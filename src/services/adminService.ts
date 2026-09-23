import { supabase } from '../config/supabase';
import type {
  AdminDashboardStats,
  AdminUserSummary,
  AdminUserDetail,
  AdminPostSummary,
  HighAttentionPost,
  ModerationAction,
  ModerationActionType,
  AccountStatus,
  PostWithAuthor,
  PostType,
} from '../types/models';
import { formatRelativeTime } from '../utils/relativeTime';
import { reportService } from './reportService';

interface AdminStatsRpcRow {
  total_users: string | number;
  total_posts: string | number;
  pending_reports: string | number;
  resolved_reports: string | number;
  banned_users: string | number;
  restricted_users: string | number;
  suspended_users: string | number;
  posts_removed: string | number;
}

export const adminService = {
  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_is_current_user_admin');
      if (error) {
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    if (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw new Error("Couldn't fetch admin metrics.");
    }

    const row = ((data && Array.isArray(data) ? data[0] : data) || {}) as AdminStatsRpcRow;

    return {
      totalUsers: Number(row.total_users) || 0,
      totalPosts: Number(row.total_posts) || 0,
      pendingReports: Number(row.pending_reports) || 0,
      resolvedReports: Number(row.resolved_reports) || 0,
      bannedUsers: Number(row.banned_users) || 0,
      restrictedUsers: Number(row.restricted_users) || 0,
      suspendedUsers: Number(row.suspended_users) || 0,
      postsRemoved: Number(row.posts_removed) || 0,
    };
  },

  async getHighAttentionPosts(): Promise<HighAttentionPost[]> {
    const { data: reports, error: reportErr } = await supabase
      .from('reports')
      .select('post_id, reason')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(100);

    if (reportErr || !reports || reports.length === 0) return [];

    const grouped: Record<string, { count: number; reasons: Record<string, number> }> = {};
    for (const r of reports) {
      if (!r.post_id) continue;
      if (!grouped[r.post_id]) {
        grouped[r.post_id] = { count: 0, reasons: {} };
      }
      grouped[r.post_id].count++;
      grouped[r.post_id].reasons[r.reason] = (grouped[r.post_id].reasons[r.reason] || 0) + 1;
    }

    const postIds = Object.keys(grouped);
    if (postIds.length === 0) return [];

    const { data: posts, error: postErr } = await supabase
      .from('posts')
      .select('id, user_id, content, image_path, profiles(id, username, display_name, profile_image_url)')
      .in('id', postIds)
      .eq('is_removed', false);

    if (postErr || !posts) return [];

    return posts
      .map((p: any) => {
        const info = grouped[p.id];
        const profile = p.profiles || {};
        return {
          postId: p.id,
          author: {
            id: p.user_id,
            username: profile.username || 'user',
            displayName: profile.display_name || 'Anonymous',
            bio: '',
            location: '',
            currentlyWorkingOn: '',
            thingsIveDone: '',
            profileImageUrl: profile.profile_image_url || null,
            accountStatus: 'ACTIVE' as AccountStatus,
            restrictedUntil: null,
            suspendedUntil: null,
            statusReason: '',
            createdAt: '',
            updatedAt: '',
          },
          content: p.content || '',
          imageUrl: p.image_path
            ? supabase.storage.from('post-images').getPublicUrl(p.image_path).data.publicUrl
            : null,
          totalReports: info.count,
          reportsByReason: info.reasons,
        };
      })
      .sort((a, b) => b.totalReports - a.totalReports);
  },

  async getUsers(
    searchQuery: string = '',
    statusFilter: string = 'ALL',
    page: number = 0,
    pageSize: number = 20
  ): Promise<AdminUserSummary[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('account_status', statusFilter.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(`username.ilike.${q},display_name.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin users:', error);
      throw new Error("Couldn't load users.");
    }

    const profiles = (data || []) as any[];
    if (profiles.length === 0) return [];

    const userIds = profiles.map((p) => p.id);

    // Fetch reports received count
    const { data: reportsData } = await supabase
      .from('reports')
      .select('reported_user_id')
      .in('reported_user_id', userIds);

    const reportCountMap: Record<string, number> = {};
    if (reportsData) {
      for (const r of reportsData) {
        if (r.reported_user_id) {
          reportCountMap[r.reported_user_id] = (reportCountMap[r.reported_user_id] || 0) + 1;
        }
      }
    }

    // Fetch post count
    const { data: postsData } = await supabase
      .from('posts')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_removed', false);

    const postCountMap: Record<string, number> = {};
    if (postsData) {
      for (const p of postsData) {
        postCountMap[p.user_id] = (postCountMap[p.user_id] || 0) + 1;
      }
    }

    return profiles.map((p) => ({
      profile: {
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
      },
      postCount: postCountMap[p.id] || 0,
      reportsReceivedCount: reportCountMap[p.id] || 0,
    }));
  },

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !profileData) {
      throw new Error('User not found.');
    }

    // 1. Post count
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 2. Reports count
    const { count: reportsCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    // 3. Moderation history
    const { data: actionsData } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const rawActions = (actionsData || []) as any[];

    // Fetch admin display names
    const adminIds = Array.from(new Set(rawActions.map((a) => a.admin_id).filter(Boolean)));
    const adminMap: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: admins } = await supabase.from('profiles').select('id, display_name').in('id', adminIds);
      if (admins) {
        for (const a of admins) {
          adminMap[a.id] = a.display_name;
        }
      }
    }

    const moderationHistory: ModerationAction[] = rawActions.map((a) => ({
      id: a.id,
      adminId: a.admin_id,
      userId: a.user_id,
      postId: a.post_id,
      reportId: a.report_id,
      action: a.action as ModerationActionType,
      reason: a.reason || '',
      durationUntil: a.duration_until,
      createdAt: a.created_at,
      relativeTime: formatRelativeTime(a.created_at),
      adminDisplayName: adminMap[a.admin_id] || 'Admin',
      targetUserDisplayName: profileData.display_name,
    }));

    const warningsCount = moderationHistory.filter((a) => a.action === 'WARNING').length;
    const removedPostsCount = moderationHistory.filter((a) => a.action === 'POST_REMOVED').length;
    const suspensionsCount = moderationHistory.filter((a) => a.action === 'USER_SUSPENDED').length;

    return {
      profile: {
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name,
        bio: profileData.bio || '',
        location: profileData.location || '',
        currentlyWorkingOn: profileData.currently_working_on || '',
        thingsIveDone: profileData.things_ive_done || '',
        profileImageUrl: profileData.profile_image_url,
        accountStatus: profileData.account_status || 'ACTIVE',
        restrictedUntil: profileData.restricted_until,
        suspendedUntil: profileData.suspended_until,
        statusReason: profileData.status_reason || '',
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      },
      postCount: postCount || 0,
      reportsReceivedCount: reportsCount || 0,
      warningsCount,
      removedPostsCount,
      suspensionsCount,
      moderationHistory,
    };
  },

  async moderateUser(
    userId: string,
    action: ModerationActionType,
    reason: string,
    durationUntil: string | null = null,
    reportId: string | null = null,
    adminId: string,
    postId: string | null = null
  ): Promise<void> {
    const newStatus =
      action === 'USER_BANNED'
        ? 'BANNED'
        : action === 'USER_SUSPENDED'
        ? 'SUSPENDED'
        : action === 'USER_RESTRICTED'
        ? 'RESTRICTED'
        : action === 'STATUS_RESET'
        ? 'ACTIVE'
        : null;

    if (newStatus) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          account_status: newStatus,
          restricted_until: newStatus === 'RESTRICTED' ? durationUntil : null,
          suspended_until: newStatus === 'SUSPENDED' ? durationUntil : null,
          status_reason: reason.trim(),
        })
        .eq('id', userId);

      if (updateErr) {
        console.error('Error updating user status:', updateErr);
        throw new Error("Couldn't update user status.");
      }
    }

    // Insert moderation action audit record
    const { error: insertErr } = await supabase
      .from('moderation_actions')
      .insert({
        admin_id: adminId,
        user_id: userId,
        post_id: postId,
        report_id: reportId,
        action: action,
        reason: reason.trim(),
        duration_until: durationUntil,
      });

    if (insertErr) {
      console.error('Error recording moderation action:', insertErr);
    }
  },

  async getModerationActions(
    actionFilter: string = 'ALL',
    page: number = 0,
    pageSize: number = 20
  ): Promise<ModerationAction[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    let query = supabase
      .from('moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (actionFilter && actionFilter !== 'ALL') {
      query = query.eq('action', actionFilter.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching moderation actions:', error);
      throw new Error("Couldn't load moderation history.");
    }

    const rawActions = (data || []) as any[];
    if (rawActions.length === 0) return [];

    const userIds = Array.from(
      new Set(rawActions.flatMap((a) => [a.admin_id, a.user_id]).filter(Boolean))
    );

    const nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
      if (profiles) {
        for (const p of profiles) {
          nameMap[p.id] = p.display_name;
        }
      }
    }

    return rawActions.map((a) => ({
      id: a.id,
      adminId: a.admin_id,
      userId: a.user_id,
      postId: a.post_id,
      reportId: a.report_id,
      action: a.action as ModerationActionType,
      reason: a.reason || '',
      durationUntil: a.duration_until,
      createdAt: a.created_at,
      relativeTime: formatRelativeTime(a.created_at),
      adminDisplayName: nameMap[a.admin_id] || 'Admin',
      targetUserDisplayName: a.user_id ? nameMap[a.user_id] || 'User' : null,
    }));
  },

  async getAdminPosts(
    searchQuery: string = '',
    filter: string = 'ALL', // 'ALL', 'MOST_REPORTED', 'REMOVED'
    page: number = 0,
    pageSize: number = 20
  ): Promise<AdminPostSummary[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    let query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (filter === 'REMOVED') {
      query = query.eq('is_removed', true);
    }

    if (searchQuery.trim()) {
      query = query.ilike('content', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin posts:', error);
      throw new Error("Couldn't load posts.");
    }

    const posts = (data || []) as any[];
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);
    const { data: reportsData } = await supabase
      .from('reports')
      .select('post_id')
      .in('post_id', postIds);

    const reportCountMap: Record<string, number> = {};
    if (reportsData) {
      for (const r of reportsData) {
        if (r.post_id) {
          reportCountMap[r.post_id] = (reportCountMap[r.post_id] || 0) + 1;
        }
      }
    }

    let summaries: AdminPostSummary[] = posts.map((p) => {
      const author = p.profiles as any;
      const postWithAuthor: PostWithAuthor = {
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
          username: author?.username || 'user',
          displayName: author?.display_name || 'Anonymous',
          bio: author?.bio || '',
          location: author?.location || '',
          currentlyWorkingOn: author?.currently_working_on || '',
          thingsIveDone: author?.things_ive_done || '',
          profileImageUrl: author?.profile_image_url || null,
          accountStatus: author?.account_status || 'ACTIVE',
          restrictedUntil: author?.restricted_until || null,
          suspendedUntil: author?.suspended_until || null,
          statusReason: author?.status_reason || '',
          createdAt: author?.created_at || '',
          updatedAt: author?.updated_at || '',
        },
        isLikedByCurrentUser: false,
        isOwner: false,
        isRemoved: p.is_removed === true,
        removalReason: p.removal_reason,
        ownerLikeCount: null,
      };

      return {
        post: postWithAuthor,
        reportsCount: reportCountMap[p.id] || 0,
        isRemoved: p.is_removed === true,
      };
    });

    if (filter === 'MOST_REPORTED') {
      summaries = summaries.sort((a, b) => b.reportsCount - a.reportsCount);
    }

    return summaries;
  },

  async removePostByAdmin(
    postId: string,
    reason: string = '',
    reportId: string | null = null
  ): Promise<void> {
    const cleanedReason = reason.trim() || 'Violated community standards';

    // 1. Invoke atomic server-side RPC admin_remove_post
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_remove_post', {
      p_post_id: postId,
      p_reason: cleanedReason,
      p_report_id: reportId || undefined,
    });

    if (rpcErr) {
      console.error('Error in admin_remove_post RPC:', rpcErr);
      throw new Error("Couldn't remove post.");
    }

    // 2. Storage cleanup if image path was returned
    const imagePath = rpcData?.image_path;
    if (imagePath) {
      await supabase.storage.from('post-images').remove([imagePath]).catch(() => {});
    }
  },

  async warnUser(userId: string, reason: string, adminId: string): Promise<void> {
    return this.moderateUser(userId, 'WARNING', reason, null, null, adminId);
  },

  async restrictUser(userId: string, durationDays: number, reason: string, adminId: string): Promise<void> {
    const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    return this.moderateUser(userId, 'USER_RESTRICTED', reason, until, null, adminId);
  },

  async suspendUser(userId: string, durationDays: number, reason: string, adminId: string): Promise<void> {
    const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    return this.moderateUser(userId, 'USER_SUSPENDED', reason, until, null, adminId);
  },

  async banUser(userId: string, reason: string, adminId: string): Promise<void> {
    return this.moderateUser(userId, 'USER_BANNED', reason, null, null, adminId);
  },

  async resetUserStatus(userId: string, reason: string, adminId: string): Promise<void> {
    return this.moderateUser(userId, 'STATUS_RESET', reason, null, null, adminId);
  },

  async removePost(
    postId: string,
    _reportedUserId?: string,
    reason: string = '',
    _adminId?: string,
    _imagePath?: string | null
  ): Promise<void> {
    return this.removePostByAdmin(postId, reason);
  },

  async getReports(statusFilter?: any) {
    return reportService.getReports(statusFilter);
  },

  async getReportDetail(reportId: string) {
    return reportService.getReportDetails(reportId);
  },

  async getReportsCountForPost(postId: string) {
    return reportService.getReportsCountForPost(postId);
  },

  async getPosts(searchQuery?: string, filter?: string) {
    return this.getAdminPosts(searchQuery || '', filter || 'ALL');
  },

  async getModerationHistory(actionFilter?: string) {
    return this.getModerationActions(actionFilter || 'ALL');
  },

  async logModerationAction(actionData: {
    action: ModerationActionType;
    adminId: string;
    targetPostId?: string | null;
    targetUserId?: string | null;
    reason: string;
    durationUntil?: string | null;
  }) {
    await supabase.from('moderation_actions').insert({
      action: actionData.action,
      admin_id: actionData.adminId,
      post_id: actionData.targetPostId || null,
      user_id: actionData.targetUserId || null,
      reason: actionData.reason.trim(),
      duration_until: actionData.durationUntil || null,
    });
  },
};
