import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTimeIST } from '../utils/dateUtils';
import { timeAgo } from '../utils/formatters';
import { linkStatus, linkReason, linkedByText } from '../lib/fleetLink';
import './FleetLink.css';

const PREVIEW_VEHICLES = 6;

/** One FleetEdge account in the relink panel: what broke, since when, which trucks. */
export default function FleetLinkAccountCard({ account, highlighted, onNavigate }) {
  const [showAll, setShowAll] = useState(false);
  const status = linkStatus(account);
  const reason = linkReason(account);
  const linkedBy = linkedByText(account);
  const vehicles = account.vehicles || [];
  const shown = showAll ? vehicles : vehicles.slice(0, PREVIEW_VEHICLES);
  const hidden = vehicles.length - shown.length;

  let when = null;
  if (account.state === 'NEEDS_RELINK' && account.dataPausedSince) {
    when = `Data paused since ${formatDateTimeIST(account.dataPausedSince)} (${timeAgo(account.dataPausedSince)})`;
  } else if (account.state === 'EXPIRING' && account.deadline) {
    when = `Auto-sync stops on ${formatDateTimeIST(account.deadline)}. Reconnect before then.`;
  } else if (account.state === 'RECOVERING') {
    when = 'Renewing its sign-in automatically — nothing to do.';
  } else if (account.state === 'HEALTHY' && account.deadline) {
    when = `Syncs on its own until ${formatDateTimeIST(account.deadline)}.`;
  }

  return (
    <article
      className={`rounded-[var(--ds-radius-md)] border bg-card p-4 ${
        highlighted
          ? 'border-[var(--ds-focus)] ring-2 ring-[var(--ds-info-tint)]'
          : 'border-[var(--ds-line)]'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            {account.friendlyName || `Fleet ${account.fleetId}`}
          </h3>
          <p className="text-xs text-muted-foreground">Fleet ID {account.fleetId || '—'}</p>
        </div>
        <span className={`fleet-link-chip fleet-link-chip--${status.tone}`}>{status.label}</span>
      </header>

      {reason ? <p className="mt-2 text-xs text-[var(--ds-ink2)]">{reason}</p> : null}
      {when ? <p className="mt-1 text-xs font-medium text-[var(--ds-ink2)]">{when}</p> : null}

      {vehicles.length ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Vehicles ({account.vehicleCount ?? vehicles.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((v) => (
              <Link
                key={v.id || v.registrationNumber}
                to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}
                onClick={onNavigate}
                className="rounded-md border border-[var(--ds-line)] px-1.5 py-0.5 font-mono text-[11px] hover:bg-[var(--ds-sunk)]"
              >
                {v.registrationNumber}
              </Link>
            ))}
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[var(--ds-focus)] hover:underline"
              >
                +{hidden} more
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No vehicles are assigned to this account.
        </p>
      )}

      {linkedBy ? (
        <p className="mt-3 text-[11px] text-muted-foreground">Last connected by {linkedBy}</p>
      ) : null}
      {account.reason === 'NOT_LINKED' ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Not using this account any more? An owner can disable it under Settings → FleetEdge
          accounts.
        </p>
      ) : null}
    </article>
  );
}
