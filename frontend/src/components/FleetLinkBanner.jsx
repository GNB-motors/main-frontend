import { useState } from 'react';
import { Unplug, X } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { bannerModel } from '../lib/fleetLink';
import { dismissFleetLinkBanner, getDismissedFleetLinkBanner } from '../utils/session.js';
import './FleetLink.css';

/**
 * Strip under the navbar on every dashboard page while a FleetEdge account is
 * disconnected (red) or stops within two days (amber). Dismissing hides it for
 * this tab only, and only for the same set of accounts.
 */
export default function FleetLinkBanner() {
  const { enabled, data, openPanel } = useFleetLink();
  const [dismissed, setDismissed] = useState(getDismissedFleetLinkBanner);
  const banner = bannerModel(data);
  if (!enabled || !banner || dismissed === banner.signature) return null;

  const dismiss = () => {
    dismissFleetLinkBanner(banner.signature);
    setDismissed(banner.signature);
  };

  return (
    <div className={`fleet-link-banner fleet-link-banner--${banner.tone}`} role="alert">
      <Unplug size={16} aria-hidden="true" />
      <span className="fleet-link-banner-text">{banner.text}</span>
      <button type="button" className="fleet-link-banner-cta" onClick={() => openPanel()}>
        Reconnect now
      </button>
      <button
        type="button"
        className="fleet-link-banner-close"
        aria-label="Hide until this tab is closed"
        title="Hide until this tab is closed"
        onClick={dismiss}
      >
        <X size={15} />
      </button>
    </div>
  );
}
