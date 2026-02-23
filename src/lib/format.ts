/**
 * Format an ISO timestamp into a human-friendly relative time string.
 *
 * Returns "Just now", "5m ago", "3h ago", "2d ago", or a formatted date for
 * anything older than 30 days. Returns "Never" when the input is null.
 */
export function formatTime(isoString: string | null): string {
  if (!isoString) return 'Never';

  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
