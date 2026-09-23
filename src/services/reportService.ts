import { supabase } from '../config/supabase';
import type { ReportStatus, ReportWithDetails, UserProfile, PostWithAuthor, PostType } from '../types/models';
import { formatRelativeTime } from '../utils/relativeTime';

export class DuplicateReportError extends Error {
  constructor(message = 'You already reported this post.\nOur team will review it.') {
    super(message);
    this.name = 'DuplicateReportError';
  }
}

interface RawReportDto {
  id: string;
  post_id: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  reason: string;
  description: string;
  status: string;
  resolution: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const reportService = {
  async submitReport(
    postId: string,
    reportedUserId: string,
    reason: string,
    description: string = ''
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to report a post.');
    }

    if (user.id === reportedUserId) {
      throw new Error('You cannot report your own post.');
    }

    const { error } = await supabase
      .from('reports')
      .insert({
        post_id: postId,
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason: reason,
        description: description.trim(),
      });

    if (error) {
      if (error.code === '23505' || error.message.includes('unique') || error.message.includes('unique_post_reporter')) {
        throw new DuplicateReportError();
      }
      console.error('Error submitting report:', error);
      throw new Error("Couldn't submit report. Please try again.");
    }
  },

  async getReports(
    statusFilter?: ReportStatus | null,
    page: number = 0,
    pageSize: number = 20
  ): Promise<ReportWithDetails[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading reports:', error);
      throw new Error("Couldn't load reports. Please try again.");
    }

    const rawReports = (data || []) as RawReportDto[];
    if (rawReports.length === 0) return [];

    // Batch fetch referenced profiles and posts
    const userIds = Array.from(
      new Set(
        rawReports
          .flatMap((r) => [r.reporter_id, r.reported_user_id])
          .filter((id): id is string => Boolean(id))
      )
    );
    const postIds = Array.from(
      new Set(
        rawReports.map((r) => r.post_id).filter((id): id is string => Boolean(id))
      )
    );

    const profilesMap: Record<string, UserProfile> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesData) {
        for (const p of profilesData) {
          profilesMap[p.id] = {
            id: p.id,
            username: p.username,
            displayName: p.display_name,
            bio: p.bio || '',
            location: p.location || '',
            currentlyWorkingOn: p.currently_working_on || '',
            thingsIveDone: p.things_ive_done || '',
            profileImageUrl: p.profile_image_url,
            accountStatus: p.account_status || 'ACTIVE',
            restrictedUntil: p.restricted_until,
            suspendedUntil: p.suspended_until,
            statusReason: p.status_reason || '',
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        }
      }
    }

    const postsMap: Record<string, PostWithAuthor> = {};
    if (postIds.length > 0) {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .in('id', postIds);

      if (postsData) {
        for (const p of postsData) {
          const authorProfile = p.profiles as any;
          postsMap[p.id] = {
            id: p.id,
            userId: p.user_id,
            postType: (p.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
            content: p.content || '',
            imagePath: p.image_path,
            imageUrl: p.image_path
              ? supabase.storage.from('post-images').getPublicUrl(p.image_path).data.publicUrl
              : null,
            createdAt: p.created_at,
            relativeTime: formatRelativeTime(p.created_at),
            author: {
              id: p.user_id,
              username: authorProfile?.username || 'user',
              displayName: authorProfile?.display_name || 'Anonymous',
              bio: authorProfile?.bio || '',
              location: authorProfile?.location || '',
              currentlyWorkingOn: authorProfile?.currently_working_on || '',
              thingsIveDone: authorProfile?.things_ive_done || '',
              profileImageUrl: authorProfile?.profile_image_url || null,
              accountStatus: authorProfile?.account_status || 'ACTIVE',
              restrictedUntil: authorProfile?.restricted_until || null,
              suspendedUntil: authorProfile?.suspended_until || null,
              statusReason: authorProfile?.status_reason || '',
              createdAt: authorProfile?.created_at || '',
              updatedAt: authorProfile?.updated_at || '',
            },
            isLikedByCurrentUser: false,
            isOwner: false,
            isRemoved: p.is_removed === true,
            removalReason: p.removal_reason,
            ownerLikeCount: null,
          };
        }
      }
    }

    return rawReports.map((r) => ({
      id: r.id,
      postId: r.post_id,
      reporterId: r.reporter_id,
      reportedUserId: r.reported_user_id,
      reason: r.reason,
      description: r.description || '',
      status: r.status as ReportStatus,
      resolution: r.resolution,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      relativeTime: formatRelativeTime(r.created_at),
      reporter: r.reporter_id ? profilesMap[r.reporter_id] || null : null,
      reportedUser: r.reported_user_id ? profilesMap[r.reported_user_id] || null : null,
      post: r.post_id ? postsMap[r.post_id] || null : null,
    }));
  },

  async getReportById(reportId: string): Promise<ReportWithDetails | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error || !data) return null;
    const r = data as RawReportDto;

    const userIds = [r.reporter_id, r.reported_user_id].filter(Boolean) as string[];
    const profilesMap: Record<string, UserProfile> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      if (profilesData) {
        for (const p of profilesData) {
          profilesMap[p.id] = {
            id: p.id,
            username: p.username,
            displayName: p.display_name,
            bio: p.bio || '',
            location: p.location || '',
            currentlyWorkingOn: p.currently_working_on || '',
            thingsIveDone: p.things_ive_done || '',
            profileImageUrl: p.profile_image_url,
            accountStatus: p.account_status || 'ACTIVE',
            restrictedUntil: p.restricted_until,
            suspendedUntil: p.suspended_until,
            statusReason: p.status_reason || '',
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        }
      }
    }

    let post: PostWithAuthor | null = null;
    if (r.post_id) {
      const { data: postData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('id', r.post_id)
        .maybeSingle();

      if (postData) {
        const authorProfile = postData.profiles as any;
        post = {
          id: postData.id,
          userId: postData.user_id,
          postType: (postData.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
          content: postData.content || '',
          imagePath: postData.image_path,
          imageUrl: postData.image_path
            ? supabase.storage.from('post-images').getPublicUrl(postData.image_path).data.publicUrl
            : null,
          createdAt: postData.created_at,
          relativeTime: formatRelativeTime(postData.created_at),
          author: {
            id: postData.user_id,
            username: authorProfile?.username || 'user',
            displayName: authorProfile?.display_name || 'Anonymous',
            bio: authorProfile?.bio || '',
            location: authorProfile?.location || '',
            currentlyWorkingOn: authorProfile?.currently_working_on || '',
            thingsIveDone: authorProfile?.things_ive_done || '',
            profileImageUrl: authorProfile?.profile_image_url || null,
            accountStatus: authorProfile?.account_status || 'ACTIVE',
            restrictedUntil: authorProfile?.restricted_until || null,
            suspendedUntil: authorProfile?.suspended_until || null,
            statusReason: authorProfile?.status_reason || '',
            createdAt: authorProfile?.created_at || '',
            updatedAt: authorProfile?.updated_at || '',
          },
          isLikedByCurrentUser: false,
          isOwner: false,
          isRemoved: postData.is_removed === true,
          removalReason: postData.removal_reason,
          ownerLikeCount: null,
        };
      }
    }

    return {
      id: r.id,
      postId: r.post_id,
      reporterId: r.reporter_id,
      reportedUserId: r.reported_user_id,
      reason: r.reason,
      description: r.description || '',
      status: r.status as ReportStatus,
      resolution: r.resolution,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      relativeTime: formatRelativeTime(r.created_at),
      reporter: r.reporter_id ? profilesMap[r.reporter_id] || null : null,
      reportedUser: r.reported_user_id ? profilesMap[r.reported_user_id] || null : null,
      post,
    };
  },

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    resolution: string = '',
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({
        status: status,
        resolution: resolution.trim(),
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report status:', error);
      throw new Error("Couldn't update report status.");
    }
  },

  async getReportDetails(reportId: string): Promise<ReportWithDetails | null> {
    return this.getReportById(reportId);
  },

  async getReportsCountForPost(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error getting reports count for post:', error);
      return 0;
    }
    return count || 0;
  },
};
