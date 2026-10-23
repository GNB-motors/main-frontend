import { Plug, Unplug } from 'lucide-react';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { indicatorModel } from '../lib/fleetLink';
import './FleetLink.css';

/**
 * Header icon next to the notification bell — always there for roles that can
 * re-link, so FleetEdge has one place to check. Red with a count while
 * accounts are disconnected, amber dot while one expires soon, green dot when
 * all are connected. It cannot be acknowledged away: it turns green only when
 * the links are healthy again.
 */
export default function FleetLinkIndicator() {
  const { enabled, data, openPanel } = useFleetLink();
  if (!enabled) return null;
  const model = indicatorModel(data);
  const Icon = model.tone === 'crit' || model.tone === 'warn' ? Unplug : Plug;

  let marker = null;
  if (model.count > 0) {
    marker = (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
        {model.count > 99 ? '99+' : model.count}
      </span>
    );
  } else if (model.tone === 'warn' || model.tone === 'ok') {
    marker = <span className={`fleet-link-dot fleet-link-dot--${model.tone}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={`navbar-bell relative fleet-link-btn--${model.tone}`}
      aria-label={model.label}
      title={model.label}
      onClick={() => openPanel()}
    >
      <Icon size={18} />
      {marker}
    </button>
  );
}
