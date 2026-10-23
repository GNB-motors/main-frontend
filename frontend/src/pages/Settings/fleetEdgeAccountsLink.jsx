import { Plug, Unplug } from 'lucide-react';
import { useFleetLink } from '../../contexts/fleetLinkContext';
import { linkForAccount, linkReason, linkStatus, needsAction } from '../../lib/fleetLink';
import { formatDateIST } from '../../utils/dateUtils';
import '../../components/FleetLink.css';

/**
 * Link verdict on every account card: a Reconnect call to action when the
 * account needs the customer, otherwise its link state and how long it keeps
 * syncing on its own.
 */
export default function FleetEdgeAccountLink({ accountId, status: accountStatus }) {
  const { enabled, data, error, index, openPanel } = useFleetLink();
  if (!enabled) return null;
  const link = linkForAccount(index, accountId);

  if (!link) {
    if (!data && !error) {
      return <p className="mt-2 text-xs text-slate-400">Checking the link…</p>;
    }
    // No link verdict (disabled, not an extension link, or the check failed).
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          className="fleet-link-chip fleet-link-chip--crit"
          onClick={() => openPanel(accountId)}
          title="See how to connect this FleetEdge account"
        >
          <Unplug size={11} aria-hidden="true" />
          Not connected
        </button>
        {accountStatus === 'DISABLED' ? <span>Disabled — no data is pulled.</span> : null}
      </div>
    );
  }

  const status = linkStatus(link);
  if (!needsAction(link)) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          className={`fleet-link-chip fleet-link-chip--${status.tone}`}
          onClick={() => openPanel(accountId)}
          title="FleetEdge connection details"
        >
          <Plug size={11} aria-hidden="true" />
          {status.label}
        </button>
        {link.deadline ? <span>Syncs on its own until {formatDateIST(link.deadline)}</span> : null}
      </div>
    );
  }

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
