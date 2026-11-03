import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { formatAgo } from '../../utils/redesign/format';
import { RECONNECT_PATH } from '../../utils/redesign/links';

/**
 * VehicleAccountBanner — the vendor account stopped sending data.
 *
 * "The trucks went quiet" is useless to an owner. This says which account,
 * how long it has been quiet, and gives the one button that fixes it.
 */
export default function VehicleAccountBanner({ account = null }) {
  if (!account) return null;
  if (account.state !== 'NEEDS_RELINK' && account.state !== 'RECOVERING') return null;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--rd-radius)] border border-[var(--rd-act)] bg-[var(--rd-act-tint)] p-3">
      <p className="m-0 flex items-start gap-2 text-[13px] font-semibold text-[var(--rd-act-ink)]">
        <TriangleAlert size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>
          This truck&apos;s {account.vendor === 'IALERT' ? 'iAlert' : 'FleetEdge'} account is
          disconnected. Live data stopped {formatAgo(account.lastDataAt)}.
        </span>
      </p>
      <Link
        to={RECONNECT_PATH}
        className="w-fit rounded-[var(--rd-radius-sm)] bg-[var(--rd-act)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline"
      >
        Reconnect
      </Link>
    </div>
  );
}
