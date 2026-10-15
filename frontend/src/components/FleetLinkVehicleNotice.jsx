import { Unplug } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { linkForReg, linkStatus, needsAction } from '../lib/fleetLink';
import './FleetLink.css';

/**
 * On a single vehicle: "its FleetEdge account is disconnected — reconnect".
 * Renders nothing when the account is fine or the viewer cannot re-link.
 */
export default function FleetLinkVehicleNotice({ reg }) {
  const { enabled, index, openPanel } = useFleetLink();
  const account = linkForReg(index, reg);
  if (!enabled || !needsAction(account)) return null;
  const status = linkStatus(account);
  const what =
    account.state === 'NEEDS_RELINK'
      ? 'FleetEdge data paused'
      : `FleetEdge ${status.label.toLowerCase()}`;

  return (
    <button
      type="button"
      className={`fleet-link-chip fleet-link-chip--${status.tone}`}
      style={{ fontSize: 12, padding: '6px 10px' }}
      title={`${account.friendlyName || account.fleetId}: see how to reconnect`}
      onClick={() => openPanel(account.accountId)}
    >
      <Unplug size={13} aria-hidden="true" />
      {what} · Reconnect
    </button>
  );
}
