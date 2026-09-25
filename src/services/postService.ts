import { supabase } from '../config/supabase';
import type { PostWithAuthor, PostType, UserProfile } from '../types/models';
import { formatRelativeTime } from '../utils/relativeTime';

interface PostProfileRelation {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  location?: string | null;
  currently_working_on?: string | null;
  things_ive_done?: string | null;
  profile_image_url?: string | null;
  account_status?: string | null;
  restricted_until?: string | null;
  suspended_until?: string | null;
  status_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawPostDto {
  id: string;
  user_id: string;
  post_type: string;
  content: string;
  image_path: string | null;
  is_removed: boolean | null;
  removal_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles: PostProfileRelation | null;
}

function resolveImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const { data } = supabase.storage.from('post-images').getPublicUrl(imagePath);
  return data.publicUrl;
}

function mapAuthor(userId: string, profileDto?: PostProfileRelation | null): UserProfile {
  return {
    id: userId,
    username: profileDto?.username || 'user',
    displayName: profileDto?.display_name || 'Anonymous',
    bio: profileDto?.bio || '',
    location: profileDto?.location || '',
    currentlyWorkingOn: profileDto?.currently_working_on || '',
    thingsIveDone: profileDto?.things_ive_done || '',
    profileImageUrl: profileDto?.profile_image_url || null,
    accountStatus: (profileDto?.account_status as any) || 'ACTIVE',
    restrictedUntil: profileDto?.restricted_until || null,
    suspendedUntil: profileDto?.suspended_until || null,
    statusReason: profileDto?.status_reason || '',
    createdAt: profileDto?.created_at || '',
    updatedAt: profileDto?.updated_at || '',
  };
}

export const postService = {
  async getFeedPosts(
    currentUserId: string | null,
    page: number = 0,
    pageSize: number = 20
  ): Promise<PostWithAuthor[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    // 1. PUBLIC READ-ONLY GUEST FEED PATH
    if (!currentUserId) {
      // Primary: Secure RPC function exposing only published posts and public author attributes
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_posts', {
          p_limit: pageSize,
          p_offset: fromIndex,
        });

        if (!rpcError && rpcData && Array.isArray(rpcData)) {
          const rpcRows = rpcData as Array<{
            id: string;
            user_id: string;
            post_type: string;
            content: string;
            image_path: string | null;
            created_at: string;
            author_display_name: string;
            author_username: string;
            author_profile_image_url: string | null;
          }>;

          return rpcRows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            postType: (row.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
            content: row.content || '',
            imagePath: row.image_path,
            imageUrl: resolveImageUrl(row.image_path),
            createdAt: row.created_at,
            relativeTime: formatRelativeTime(row.created_at),
            author: {
              id: row.user_id,
              username: row.author_username || 'user',
              displayName: row.author_display_name || 'Anonymous',
              bio: '',
              location: '',
              currentlyWorkingOn: '',
              thingsIveDone: '',
              profileImageUrl: row.author_profile_image_url || null,
              accountStatus: 'ACTIVE',
              restrictedUntil: null,
              suspendedUntil: null,
              statusReason: '',
              createdAt: '',
              updatedAt: '',
            },
            isLikedByCurrentUser: false,
            isOwner: false,
            isRemoved: false,
            removalReason: null,
            ownerLikeCount: null,
          }));
        }
      } catch (rpcErr) {
        console.warn('get_public_posts RPC fallback triggered:', rpcErr);
      }

      // Resilient fallback: Select strictly published posts and minimum public author fields
      let guestQuery = supabase
        .from('posts')
        .select('id, user_id, post_type, content, image_path, is_removed, created_at, profiles(display_name, username, profile_image_url)')
        .or('is_removed.eq.false,is_removed.is.null')
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex);

      let { data: guestData, error: guestError } = await guestQuery;

      if (guestError && guestError.message?.includes('profiles')) {
        const guestRelQuery = supabase
          .from('posts')
          .select('id, user_id, post_type, content, image_path, is_removed, created_at, profiles!user_id(display_name, username, profile_image_url)')
          .or('is_removed.eq.false,is_removed.is.null')
          .order('created_at', { ascending: false })
          .range(fromIndex, toIndex);
        const guestRelRes = await guestRelQuery;
        guestData = guestRelRes.data;
        guestError = guestRelRes.error;
      }

      if (guestError) {
        console.error('Error fetching public guest feed:', guestError);
        throw new Error("Couldn't load posts. Please try again.");
      }

      const rawGuestPosts = (guestData || []) as unknown as Array<{
        id: string;
        user_id: string;
        post_type: string;
        content: string;
        image_path: string | null;
        is_removed: boolean | null;
        created_at: string;
        profiles: {
          display_name?: string | null;
          username?: string | null;
          profile_image_url?: string | null;
        } | null;
      }>;

      return rawGuestPosts
        .filter((p) => p.is_removed !== true)
        .map((dto) => ({
          id: dto.id,
          userId: dto.user_id,
          postType: (dto.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
          content: dto.content || '',
          imagePath: dto.image_path,
          imageUrl: resolveImageUrl(dto.image_path),
          createdAt: dto.created_at,
          relativeTime: formatRelativeTime(dto.created_at),
          author: {
            id: dto.user_id,
            username: dto.profiles?.username || 'user',
            displayName: dto.profiles?.display_name || 'Anonymous',
            bio: '',
            location: '',
            currentlyWorkingOn: '',
            thingsIveDone: '',
            profileImageUrl: dto.profiles?.profile_image_url || null,
            accountStatus: 'ACTIVE',
            restrictedUntil: null,
            suspendedUntil: null,
            statusReason: '',
            createdAt: '',
            updatedAt: '',
          },
          isLikedByCurrentUser: false,
          isOwner: false,
          isRemoved: false,
          removalReason: null,
          ownerLikeCount: null,
        }));
    }

    // 2. AUTHENTICATED FEED PATH
    let query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .or('is_removed.eq.false,is_removed.is.null')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    let { data, error } = await query;

    // Fallback relation syntax if necessary
    if (error && error.message?.includes('profiles')) {
      const fallbackQuery = supabase
        .from('posts')
        .select('*, profiles!user_id(*)')
        .or('is_removed.eq.false,is_removed.is.null')
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex);
      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Error fetching feed posts:', error);
      throw new Error("Couldn't load posts. Please try again.");
    }

    const rawPosts = (data || []) as unknown as RawPostDto[];
    const visiblePosts = rawPosts.filter((p) => p.is_removed !== true);
    const postIds = visiblePosts.map((p) => p.id);

    // Fetch user likes for visible posts
    let likedPostIds = new Set<string>();
    if (currentUserId && postIds.length > 0) {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      if (likesData) {
        likedPostIds = new Set(likesData.map((l) => l.post_id));
      }
    }

    // Owner like counts: fetch strictly for posts owned by the current user
    const ownerCountsMap: Record<string, number> = {};
    const ownerPostIds = currentUserId
      ? visiblePosts.filter((p) => p.user_id === currentUserId).map((p) => p.id)
      : [];

    if (ownerPostIds.length > 0) {
      try {
        const { data: countsData } = await supabase.rpc('get_post_like_counts', {
          post_ids: ownerPostIds,
        });
        if (countsData && Array.isArray(countsData)) {
          for (const item of countsData) {
            ownerCountsMap[item.post_id] = Number(item.like_count) || 0;
          }
        }
      } catch {
        // Fallback: direct group count if RPC not available
        const { data: rawLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', ownerPostIds);
        if (rawLikes) {
          for (const l of rawLikes) {
            ownerCountsMap[l.post_id] = (ownerCountsMap[l.post_id] || 0) + 1;
          }
        }
      }
    }

    return visiblePosts.map((dto) => {
      const isOwner = Boolean(currentUserId && dto.user_id === currentUserId);
      const isLiked = likedPostIds.has(dto.id);
      const ownerLikeCount = isOwner ? ownerCountsMap[dto.id] || 0 : null;

      return {
        id: dto.id,
        userId: dto.user_id,
        postType: (dto.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
        content: dto.content || '',
        imagePath: dto.image_path,
        imageUrl: resolveImageUrl(dto.image_path),
        createdAt: dto.created_at,
        relativeTime: formatRelativeTime(dto.created_at),
        author: mapAuthor(dto.user_id, dto.profiles),
        isLikedByCurrentUser: isLiked,
        isOwner: isOwner,
        isRemoved: dto.is_removed === true,
        removalReason: dto.removal_reason,
        ownerLikeCount: ownerLikeCount,
      };
    });
  },

  async getUserPosts(
    targetUserId: string,
    currentUserId: string | null,
    page: number = 0,
    pageSize: number = 20
  ): Promise<PostWithAuthor[]> {
    const fromIndex = page * pageSize;
    const toIndex = (page + 1) * pageSize - 1;

    let query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', targetUserId)
      .or('is_removed.eq.false,is_removed.is.null')
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    let { data, error } = await query;
    if (error && error.message?.includes('profiles')) {
      const fallback = await supabase
        .from('posts')
        .select('*, profiles!user_id(*)')
        .eq('user_id', targetUserId)
        .or('is_removed.eq.false,is_removed.is.null')
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching user posts:', error);
      throw new Error("Couldn't load posts. Please try again.");
    }

    const rawPosts = (data || []) as unknown as RawPostDto[];
    const visiblePosts = rawPosts.filter((p) => p.is_removed !== true);
    const postIds = visiblePosts.map((p) => p.id);

    let likedPostIds = new Set<string>();
    if (currentUserId && postIds.length > 0) {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      if (likesData) {
        likedPostIds = new Set(likesData.map((l) => l.post_id));
      }
    }

    const isOwnProfile = Boolean(currentUserId && targetUserId === currentUserId);
    const ownerCountsMap: Record<string, number> = {};
    if (isOwnProfile && postIds.length > 0) {
      try {
        const { data: countsData } = await supabase.rpc('get_post_like_counts', {
          post_ids: postIds,
        });
        if (countsData && Array.isArray(countsData)) {
          for (const item of countsData) {
            ownerCountsMap[item.post_id] = Number(item.like_count) || 0;
          }
        }
      } catch {
        const { data: rawLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds);
        if (rawLikes) {
          for (const l of rawLikes) {
            ownerCountsMap[l.post_id] = (ownerCountsMap[l.post_id] || 0) + 1;
          }
        }
      }
    }

    return visiblePosts.map((dto) => {
      const isOwner = Boolean(currentUserId && dto.user_id === currentUserId);
      const isLiked = likedPostIds.has(dto.id);
      const ownerLikeCount = isOwner ? ownerCountsMap[dto.id] || 0 : null;

      return {
        id: dto.id,
        userId: dto.user_id,
        postType: (dto.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
        content: dto.content || '',
        imagePath: dto.image_path,
        imageUrl: resolveImageUrl(dto.image_path),
        createdAt: dto.created_at,
        relativeTime: formatRelativeTime(dto.created_at),
        author: mapAuthor(dto.user_id, dto.profiles),
        isLikedByCurrentUser: isLiked,
        isOwner: isOwner,
        isRemoved: dto.is_removed === true,
        removalReason: dto.removal_reason,
        ownerLikeCount: ownerLikeCount,
      };
    });
  },

  async getPostById(postId: string, currentUserId: string | null): Promise<PostWithAuthor | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('id', postId)
      .maybeSingle();

    if (error || !data) return null;
    const dto = data as unknown as RawPostDto;

    let isLiked = false;
    if (currentUserId) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .maybeSingle();
      isLiked = Boolean(likeData);
    }

    const isOwner = Boolean(currentUserId && dto.user_id === currentUserId);
    let ownerLikeCount: number | null = null;
    if (isOwner) {
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      ownerLikeCount = count || 0;
    }

    return {
      id: dto.id,
      userId: dto.user_id,
      postType: (dto.post_type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'TEXT') as PostType,
      content: dto.content || '',
      imagePath: dto.image_path,
      imageUrl: resolveImageUrl(dto.image_path),
      createdAt: dto.created_at,
      relativeTime: formatRelativeTime(dto.created_at),
      author: mapAuthor(dto.user_id, dto.profiles),
      isLikedByCurrentUser: isLiked,
      isOwner: isOwner,
      isRemoved: dto.is_removed === true,
      removalReason: dto.removal_reason,
      ownerLikeCount: ownerLikeCount,
    };
  },

  async createTextPost(userId: string, content: string): Promise<string> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Post content cannot be empty.');
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        post_type: 'TEXT',
        content: trimmed,
        image_path: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating text post:', error);
      throw new Error("Couldn't create post. Please try again.");
    }

    return data.id;
  },

  async createImagePost(userId: string, caption: string, imageBlob: Blob): Promise<string> {
    const postId = crypto.randomUUID();
    const storagePath = `${userId}/${postId}.jpg`;

    // 1. Upload compressed image to Supabase post-images bucket
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(storagePath, imageBlob, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Post image upload failed:', uploadError);
      throw new Error("Couldn't upload image. Please try again.");
    }

    // 2. Insert post record
    const { data, error } = await supabase
      .from('posts')
      .insert({
        id: postId,
        user_id: userId,
        post_type: 'IMAGE',
        content: caption.trim(),
        image_path: storagePath,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating image post:', error);
      // Clean up uploaded image if post row insertion fails
      await supabase.storage.from('post-images').remove([storagePath]);
      throw new Error("Couldn't create post. Please try again.");
    }

    return data.id;
  },

  async updatePost(
    postId: string,
    userId: string,
    content: string,
    newImageBlob?: Blob | null,
    removeImage: boolean = false,
    existingImagePath?: string | null
  ): Promise<void> {
    let resolvedImagePath = existingImagePath;

    if (newImageBlob) {
      const newPath = `${userId}/${postId}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(newPath, newImageBlob, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw new Error("Couldn't upload replacement image. Please try again.");
      }

      resolvedImagePath = newPath;
      if (existingImagePath && existingImagePath !== newPath) {
        supabase.storage.from('post-images').remove([existingImagePath]).catch(() => {});
      }
    } else if (removeImage) {
      if (existingImagePath) {
        supabase.storage.from('post-images').remove([existingImagePath]).catch(() => {});
      }
      resolvedImagePath = null;
    }

    const postType = resolvedImagePath ? 'IMAGE' : 'TEXT';

    const { error } = await supabase
      .from('posts')
      .update({
        content: content.trim(),
        post_type: postType,
        image_path: resolvedImagePath,
      })
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating post:', error);
      throw new Error("Couldn't update post. Please try again.");
    }
  },

  async deletePost(postId: string, imagePath?: string | null): Promise<void> {
    // 1. Delete post row
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      throw new Error("Couldn't delete post. Please try again.");
    }

    // 2. Clean storage object if image post
    if (imagePath) {
      await supabase.storage.from('post-images').remove([imagePath]).catch(() => {});
    }
  },

  async toggleLike(postId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
    if (currentlyLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking post:', error);
        throw new Error("Couldn't unlike post.");
      }
      return false;
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (error) {
        // If unique key violation, already liked on server
        if (error.code === '23505' || error.message.includes('unique')) {
          return true;
        }
        console.error('Error liking post:', error);
        throw new Error("Couldn't like post.");
      }
      return true;
    }
  },
};
