import { Unplug } from 'lucide-react';
import { useFleetLink } from '../../contexts/fleetLinkContext';
import { linkForAccount, linkReason, linkStatus, needsAction } from '../../lib/fleetLink';
import { formatDateIST } from '../../utils/dateUtils';
import '../../components/FleetLink.css';

/**
 * Link verdict on one account card: a Reconnect call to action when the
 * account needs the customer, otherwise how long it keeps syncing on its own.
 */
export default function FleetEdgeAccountLink({ accountId }) {
  const { enabled, index, openPanel } = useFleetLink();
  const link = enabled ? linkForAccount(index, accountId) : null;
  if (!link) return null;

  if (!needsAction(link)) {
    if (!link.deadline) return null;
    return (
      <p className="mt-2 text-xs text-slate-400">
        Syncs on its own until {formatDateIST(link.deadline)}
      </p>
    );
  }

  const status = linkStatus(link);
  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-xs ${
        status.tone === 'crit' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
      }`}
    >
      <span className={`fleet-link-chip fleet-link-chip--${status.tone}`}>
        <Unplug size={11} aria-hidden="true" />
        {status.label}
      </span>
      <span className="min-w-0 flex-1">{linkReason(link)}</span>
      <button
        type="button"
        onClick={() => openPanel(accountId)}
        className="rounded-lg bg-white px-3 py-1.5 font-semibold shadow-sm ring-1 ring-inset ring-black/10 hover:bg-slate-50"
      >
        Reconnect
      </button>
    </div>
  );
}
