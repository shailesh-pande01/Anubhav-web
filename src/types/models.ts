export type PostType = 'TEXT' | 'IMAGE';

export type AccountStatus = 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';

export type ReportReason =
  | 'Spam'
  | 'Harassment'
  | 'Inappropriate content'
  | 'Hate speech'
  | 'Violence'
  | 'Other';

export const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Hate speech',
  'Violence',
  'Other',
];

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export type ModerationActionType =
  | 'WARNING'
  | 'POST_REMOVED'
  | 'USER_RESTRICTED'
  | 'USER_SUSPENDED'
  | 'USER_BANNED'
  | 'REPORT_DISMISSED'
  | 'STATUS_RESET';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  currentlyWorkingOn: string;
  thingsIveDone: string;
  profileImageUrl: string | null;
  accountStatus: AccountStatus;
  restrictedUntil: string | null;
  suspendedUntil: string | null;
  statusReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostWithAuthor {
  id: string;
  userId: string;
  postType: PostType;
  content: string;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: string;
  relativeTime: string;
  author: UserProfile;
  isLikedByCurrentUser: boolean;
  isOwner: boolean;
  isRemoved: boolean;
  removalReason: string | null;
  /**
   * STRICT PRODUCT PRIVACY RULE:
   * Only the author sees the total like count on their post.
   * For everyone else, this is strictly null.
   */
  ownerLikeCount: number | null;
}

export interface Report {
  id: string;
  postId: string | null;
  reporterId: string | null;
  reportedUserId: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  resolution: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ReportWithDetails {
  id: string;
  postId: string | null;
  reporterId: string | null;
  reportedUserId: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  resolution: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  relativeTime: string;
  reporter: UserProfile | null;
  reportedUser: UserProfile | null;
  post: PostWithAuthor | null;
}

export interface ModerationAction {
  id: string;
  adminId: string;
  userId: string | null;
  postId: string | null;
  reportId: string | null;
  action: ModerationActionType;
  reason: string;
  durationUntil: string | null;
  createdAt: string;
  relativeTime: string;
  adminDisplayName?: string | null;
  targetUserDisplayName?: string | null;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  resolvedReports: number;
  bannedUsers: number;
  restrictedUsers: number;
  suspendedUsers: number;
  postsRemoved: number;
}

export interface HighAttentionPost {
  postId: string;
  author: UserProfile;
  content: string;
  imageUrl: string | null;
  totalReports: number;
  reportsByReason: Record<string, number>;
}

export interface AdminUserSummary {
  profile: UserProfile;
  postCount: number;
  reportsReceivedCount: number;
}

export interface AdminUserDetail {
  profile: UserProfile;
  postCount: number;
  reportsReceivedCount: number;
  warningsCount: number;
  removedPostsCount: number;
  suspensionsCount: number;
  moderationHistory: ModerationAction[];
}

export interface AdminPostSummary {
  post: PostWithAuthor;
  reportsCount: number;
  isRemoved: boolean;
}
