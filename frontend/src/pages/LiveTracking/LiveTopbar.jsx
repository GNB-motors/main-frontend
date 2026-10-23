import { useEffect, useState } from 'react';
import LiveClock from './LiveClock.jsx';
import Skel from './Skel.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import { toggleManufacturer } from './manufacturerFilters.js';

function UpdateAge({ at }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  if (!at) return <span>Awaiting update</span>;
  const seconds = Math.max(0, Math.floor((now - new Date(at).getTime()) / 1000));
  const age =
    seconds < 60
      ? `${seconds}s`
      : seconds < 3600
        ? `${Math.floor(seconds / 60)}m`
        : `${Math.floor(seconds / 3600)}h`;
  return (
    <span title={new Date(at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}>
      Updated {age} ago
    </span>
  );
}

export default function LiveTopbar({
  isLiveLoading,
  statusCards,
  filter,
  setFilter,
  handleRefresh,
  isRefreshing,
  manufacturers = [],
  selectedManufacturers = [],
  setSelectedManufacturers,
  lastEventAt,
  positionsError,
  onMapCount = 0,
  unclassifiedCount = 0,
}) {
  return (
    <div className="topbar lt-toolbar">
      <div className="lt-command-row">
        <div className="lt-manufacturers" role="group" aria-label="Manufacturer filters">
          <button
            type="button"
            className="lt-make"
            aria-pressed={!selectedManufacturers.length}
            onClick={() => setSelectedManufacturers([])}
          >
            All manufacturers
          </button>
          {manufacturers.map((name) => (
            <button
              key={name}
              type="button"
              className="lt-make"
              aria-pressed={selectedManufacturers.includes(name)}
              onClick={() =>
                setSelectedManufacturers(toggleManufacturer(selectedManufacturers, name))
              }
            >
              {name}
            </button>
          ))}
          {unclassifiedCount > 0 && (
            <button
              type="button"
              className="lt-make"
              aria-pressed={selectedManufacturers.includes('Unclassified')}
              onClick={() =>
                setSelectedManufacturers(toggleManufacturer(selectedManufacturers, 'Unclassified'))
              }
            >
              Unclassified · {unclassifiedCount}
            </button>
          )}
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
        <span className="lt-map-count">On map: {isLiveLoading ? '…' : onMapCount}</span>
      </div>
    </div>
  );
}
