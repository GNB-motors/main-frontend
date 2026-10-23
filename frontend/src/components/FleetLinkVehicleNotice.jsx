import { Plug, Unplug } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { linkForReg, linkStatus, needsAction } from '../lib/fleetLink';
import './FleetLink.css';

/**
 * On a single vehicle, always: the FleetEdge link state of its account, with
 * Reconnect while the data is paused (or about to be). Clicking opens the
 * FleetEdge panel at that account.
 */
export default function FleetLinkVehicleNotice({ reg }) {
  const { enabled, data, error, index, openPanel } = useFleetLink();
  if (!enabled) return null;
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
