import { MapPinned, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import LiveClock from './LiveClock.jsx';
import Skel from './Skel.jsx';
import renderIconSvg from './renderIconSvg.jsx';

function UpdateAge({ at }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  // The age of the last live-feed MESSAGE, not of the data inside it (audit DC-14).
  if (!at) return <span>Awaiting live feed</span>;
  const seconds = Math.max(0, Math.floor((now - new Date(at).getTime()) / 1000));
  const age =
    seconds < 60
      ? `${seconds}s`
      : seconds < 3600
        ? `${Math.floor(seconds / 60)}m`
        : `${Math.floor(seconds / 3600)}h`;
  return (
    <span
      title={`Last live-feed message ${new Date(at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Each truck's own last report is on its card.`}
    >
      Feed message {age} ago
    </span>
  );
}

export default function LiveTopbar({
  view = 'live',
  onViewChange,
  viewSwitchDisabled = false,
  isLiveLoading,
  statusCards,
  filter,
  setFilter,
  handleRefresh,
  isRefreshing,
  manufacturers = [],
  manufacturerCounts = {},
  selectedManufacturers = [],
  setSelectedManufacturers,
  lastEventAt,
  positionsError,
  onMapCount = 0,
  unclassifiedCount = 0,
  layerPills = null,
}) {
  return (
    <div className="topbar lt-toolbar">
      {onViewChange ? (
        <div className="lt-view-switch" role="group" aria-label="Tracking view">
          {[{ id: 'live', label: 'Live tracking', icon: <Radio size={16} aria-hidden="true" /> }, { id: 'places', label: 'Places & routes', icon: <MapPinned size={16} aria-hidden="true" /> }].map(({ id, label, icon }) => (
            <button key={id} type="button" aria-pressed={view === id} disabled={viewSwitchDisabled}
              onClick={() => onViewChange(id)} title={viewSwitchDisabled ? 'Exit Track mode to switch views' : label}>
              {icon}{label}
            </button>
          ))}
        </div>
      ) : null}
      {view === 'places' ? (
        <div className="lt-view-description">
          <strong>Places & routes</strong>
          <span>Your places, nearby stops, tolls and fleet routes</span>
          <a href="/place-hub">Open Place Hub ↗</a>
        </div>
      ) : <>
      <div className="lt-command-row">
        <div className="gnb-status-bar lt-manufacturers" role="group" aria-label="Manufacturer filters">
          <button type="button" className={`gnb-status-card ${!selectedManufacturers.length ? 'gnb-status-card--active' : ''}`} aria-pressed={!selectedManufacturers.length} onClick={() => setSelectedManufacturers([])}>
            <span className="gnb-status-card-label">All makes</span>
            <span className="gnb-status-card-count">{Object.values(manufacturerCounts).reduce((sum, n) => sum + (n || 0), 0)}</span>
          </button>
          {[...manufacturers, ...(unclassifiedCount > 0 ? ['Unclassified'] : [])].map(name => (
            <button key={name} type="button" className={`gnb-status-card ${selectedManufacturers.includes(name) ? 'gnb-status-card--active' : ''}`} aria-pressed={selectedManufacturers.includes(name)} onClick={() => setSelectedManufacturers(selectedManufacturers.includes(name) ? selectedManufacturers.filter(item => item !== name) : [...selectedManufacturers, name])}>
              <span className="gnb-status-card-label">{name}</span>
              <span className="gnb-status-card-count">{manufacturerCounts[name] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="tools">
          <span className="clockchip">
            {renderIconSvg('clock', 15)}
            <LiveClock />
          </span>
          <span className="lt-update-age">
            <UpdateAge at={lastEventAt} />
          </span>
          {positionsError && (
            <span className="lt-refresh-error" role="status">
              Update failed · Retry
            </span>
          )}
          <button
            type="button"
            className="btn"
            title="Refresh positions"
            aria-label="Refresh positions"
            disabled={isRefreshing}
            onClick={handleRefresh}
          >
            {renderIconSvg('refresh', 16, isRefreshing ? 'spin' : '')}
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      <div className="lt-status-row">
        <div className="gnb-status-bar" role="group" aria-label="Fleet status filters">
          {statusCards.map((card) => (
            <button
              key={card.k}
              type="button"
              className={`gnb-status-card ${filter === card.k ? 'gnb-status-card--active' : ''}`}
              aria-pressed={filter === card.k}
              title={card.title}
              onClick={() => setFilter(card.k)}
            >
              <span className="lt-status-dot" style={{ backgroundColor: card.stripe }} />
              <span className="gnb-status-card-label">{card.label}</span>
              <span className="gnb-status-card-count">
                {isLiveLoading ? <Skel w={18} h={14} /> : card.count}
              </span>
            </button>
          ))}
        </div>
        {layerPills}
        <span className="lt-map-count">On map: {isLiveLoading ? '…' : onMapCount}</span>
      </div>
      </>}
    </div>
  );
}
