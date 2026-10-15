import { Unplug } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { indicatorModel } from '../lib/fleetLink';
import './FleetLink.css';

/**
 * Header icon next to the notification bell. Shown only while a FleetEdge
 * account needs re-linking (red, with a count) or expires soon (amber dot).
 * It cannot be acknowledged away: it goes when the link is healthy again.
 */
export default function FleetLinkIndicator() {
  const { enabled, data, openPanel } = useFleetLink();
  const model = indicatorModel(data);
  if (!enabled || !model.visible) return null;

  return (
    <button
      type="button"
      className={`navbar-bell relative fleet-link-btn--${model.tone}`}
      aria-label={model.label}
      title={model.label}
      onClick={() => openPanel()}
    >
      <Unplug size={18} />
      {model.count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {model.count > 99 ? '99+' : model.count}
        </span>
      ) : (
        <span className="fleet-link-dot" aria-hidden="true" />
      )}
    </button>
  );
}
