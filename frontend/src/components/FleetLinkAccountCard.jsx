import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTimeIST } from '../utils/dateUtils';
import { timeAgo } from '../utils/formatters';
import { linkStatus, linkReason, linkedByText } from '../lib/fleetLink';
import { fleetEdgeAccountTitle } from '../lib/fleetConnections';
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
      className={`fleet-account ${
        highlighted
          ? 'fleet-account--focus'
          : ''
      }`}
    >
      <header className="fleet-account-head">
        <div className="min-w-0">
          <h4 className="fleet-account-name">{fleetEdgeAccountTitle(account)}</h4>
          <p className="fleet-account-sub truncate" title={account.fleetId || undefined}>
            Fleet ID <span className="font-mono">{account.fleetId || '—'}</span>
          </p>
        </div>
        <span className={`fleet-link-chip fleet-link-chip--${status.tone}`}>{status.label}</span>
      </header>

      {reason ? <p className="fleet-account-note">{reason}</p> : null}
      {when ? <p className="fleet-account-note">{when}</p> : null}

      {vehicles.length ? (
        <div className="fleet-vehicles">
          <p className="fleet-vehicles-label">Vehicles ({account.vehicleCount ?? vehicles.length})</p>
          <div className="fleet-vehicles-list">
            {shown.map((v) => (
              <Link
                key={v.id || v.registrationNumber}
                to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}
                onClick={onNavigate}
                className="fleet-vehicle"
              >
                {v.registrationNumber}
              </Link>
            ))}
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="fleet-vehicle fleet-vehicle--more"
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
