import { Link } from 'react-router-dom';
import { Route, Share2 } from 'lucide-react';
import { trackLink } from '../../utils/redesign/links';

/**
 * VehiclePanelActions — the two buttons under the header.
 *
 * There is no separate Replay button any more: Replay is part of Track
 * mode, which opens the truck's last 24 hours on the map. Track is the
 * orange one because it is the action the owner takes most.
 */
export default function VehiclePanelActions({
  registrationNumber = null,
  onShare = null,
  shareCreating = false,
}) {
  const to = trackLink({
    reg: registrationNumber,
    from: new Date(Date.now() - 24 * 3600 * 1000),
    to: new Date(),
  });

  return (
    <div className="flex items-center gap-2">
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-sm)] bg-[var(--rd-accent)] px-3.5 py-2 text-[13px] font-semibold text-white no-underline transition-colors hover:brightness-95"
      >
        <Route size={15} aria-hidden="true" />
        Track
      </Link>
      <button
        type="button"
        onClick={onShare}
        disabled={shareCreating}
        className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-3.5 py-2 text-[13px] font-semibold text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)] disabled:opacity-50"
      >
        <Share2 size={15} aria-hidden="true" />
        Share
      </button>
    </div>
  );
}
