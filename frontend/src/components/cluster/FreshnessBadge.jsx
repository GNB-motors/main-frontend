import { freshnessOf, timeAgo } from '../../utils/formatters';

/**
 * FreshnessBadge — the system-wide staleness contract.
 *   fresh  (<1h)  renders nothing unless `always`
 *   aging  (1–6h) muted "Updated 3h ago"
 *   stale  (6–24h) amber
 *   dead   (>24h / null) red
 */
export default function FreshnessBadge({ at, always = false, prefix = 'Updated', className = '' }) {
  const level = freshnessOf(at);
  if (level === 'fresh' && !always) return null;
  const label = at ? `${prefix} ${timeAgo(at)}` : 'No data received yet';
  return <span className={`freshness freshness--${level} ${className}`}>{label}</span>;
}
