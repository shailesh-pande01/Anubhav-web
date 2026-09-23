/**
 * Formats ISO timestamps into calm relative time strings
 * matching the exact formatting in Android RelativeTimeFormatter.kt:
 * - < 60s: "just now"
 * - < 60m: "12m"
 * - < 24h: "3h"
 * - 1 day: "Yesterday"
 * - < 7 days: "4d"
 * - < 30 days: "2w"
 * - older: "Jan 15" or "Jan 15, 2025"
 */
export function formatRelativeTime(timestampString?: string | null): string {
  if (!timestampString) return '';

  const date = new Date(timestampString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) {
    return 'just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w`;
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear();
  const options: Intl.DateTimeFormatOptions = isCurrentYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString('en-US', options);
}
