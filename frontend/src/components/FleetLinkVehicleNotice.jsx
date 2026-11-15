import { Plug, Unplug } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { linkForReg, linkStatus, needsAction } from '../lib/fleetLink';
import './FleetLink.css';

/**
 * On a single vehicle, always: the telematics link state of its account, with
 * Reconnect while the data is paused (or about to be).
 * Dynamically adapts to the vehicle's telematics provider (FleetEdge vs iALERT vs multi-vendor).
 */
export default function FleetLinkVehicleNotice({
  reg,
  telematicsProvider,
  manufacturer,
  ialert,
  coverage,
}) {
  const { enabled, data, error, index, openPanel } = useFleetLink();
  if (!enabled) return null;

  const mfg = String(manufacturer || '')
    .trim()
    .toUpperCase();
  const isIalert =
    telematicsProvider === 'IALERT' ||
    mfg.includes('ASHOK') ||
    mfg.includes('LEYLAND') ||
    Boolean(ialert) ||
    Boolean(coverage?.inIalert);

  if (isIalert) {
    // iALERT provider logic for Ashok Leyland vehicles
    const isLinked =
      ialert?.account?.isLinked || (coverage?.inIalert && Boolean(ialert?.lastReportedAt));
    const tokenStatus = ialert?.account?.tokenStatus;
    const accountStatus = ialert?.account?.status;
    const needsReconnect = tokenStatus === 'NEEDS_REAUTH' || accountStatus === 'AUTH_FAILED';

    if (needsReconnect) {
      return (
        <button
          type="button"
          className="fleet-link-chip fleet-link-chip--warn"
          style={{ fontSize: 12, padding: '6px 10px' }}
          title={
            ialert?.account?.friendlyName
              ? `${ialert.account.friendlyName}: iALERT session expired — click to reconnect`
              : 'iALERT session expired — click to reconnect'
          }
          onClick={() => openPanel()}
        >
          <Unplug size={13} aria-hidden="true" />
          iALERT data paused · Reconnect
        </button>
      );
    }

    if (isLinked) {
      return (
        <button
          type="button"
          className="fleet-link-chip fleet-link-chip--ok"
          style={{ fontSize: 12, padding: '6px 10px' }}
          title={
            ialert?.account?.friendlyName
              ? `${ialert.account.friendlyName}: iALERT connection active`
              : 'iALERT connection active'
          }
          onClick={() => openPanel()}
        >
          <Plug size={13} aria-hidden="true" />
          iALERT connected
        </button>
      );
    }

    return (
      <button
        type="button"
        className="fleet-link-chip fleet-link-chip--crit"
        style={{ fontSize: 12, padding: '6px 10px' }}
        title="See how to connect Ashok Leyland iALERT"
        onClick={() => openPanel()}
      >
        <Unplug size={13} aria-hidden="true" />
        iALERT not connected
      </button>
    );
  }

  if (telematicsProvider === 'MAHINDRA_IMAXX' || mfg.includes('MAHINDRA')) {
    return (
      <button
        type="button"
        className="fleet-link-chip fleet-link-chip--crit"
        style={{ fontSize: 12, padding: '6px 10px' }}
        title="See how to connect Mahindra iMAXX"
        onClick={() => openPanel()}
      >
        <Unplug size={13} aria-hidden="true" />
        iMAXX not connected
      </button>
    );
  }

  // Tata FleetEdge provider logic
  const account = linkForReg(index, reg);

  if (!account) {
    if (!data && !error) {
      return (
        <span
          className="fleet-link-chip fleet-link-chip--info"
          style={{ fontSize: 12, padding: '6px 10px' }}
        >
          <Plug size={13} aria-hidden="true" />
          FleetEdge: checking…
        </span>
      );
    }
    // No link verdict for this truck (no linked account, or the check failed).
    return (
      <button
        type="button"
        className="fleet-link-chip fleet-link-chip--crit"
        style={{ fontSize: 12, padding: '6px 10px' }}
        title="See how to connect FleetEdge"
        onClick={() => openPanel()}
      >
        <Unplug size={13} aria-hidden="true" />
        FleetEdge not connected
      </button>
    );
  }

  const status = linkStatus(account);
  const action = needsAction(account);
  let what = `FleetEdge ${status.label.toLowerCase()}`;
  if (account.state === 'NEEDS_RELINK') what = 'FleetEdge data paused';
  const Icon = action ? Unplug : Plug;

  return (
    <button
      type="button"
      className={`fleet-link-chip fleet-link-chip--${status.tone}`}
      style={{ fontSize: 12, padding: '6px 10px' }}
      title={
        action
          ? `${account.friendlyName || account.fleetId}: see how to reconnect`
          : `${account.friendlyName || account.fleetId}: FleetEdge connection details`
      }
      onClick={() => openPanel(account.accountId)}
    >
      <Icon size={13} aria-hidden="true" />
      {action ? `${what} · Reconnect` : what}
    </button>
  );
}
