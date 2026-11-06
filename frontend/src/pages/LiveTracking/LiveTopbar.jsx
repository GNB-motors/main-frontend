import { MapPinned, Radio } from 'lucide-react';
import Skel from './Skel.jsx';

export default function LiveTopbar({
  view = 'live',
  onViewChange,
  viewSwitchDisabled = false,
  isLiveLoading,
  statusCards,
  filter,
  setFilter,
  manufacturers = [],
  manufacturerCounts = {},
  selectedManufacturers = [],
  setSelectedManufacturers,
  positionsError,
  onMapCount = 0,
  unclassifiedCount = 0,
  layerPills = null,
}) {
  return (
    <div className="topbar lt-toolbar">
      {onViewChange ? (
        <div className="lt-view-switch" role="group" aria-label="Tracking view">
          {[
            { id: 'live', label: 'Live tracking', icon: <Radio size={16} aria-hidden="true" /> },
            {
              id: 'places',
              label: 'Places & routes',
              icon: <MapPinned size={16} aria-hidden="true" />,
            },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              disabled={viewSwitchDisabled}
              onClick={() => onViewChange(id)}
              title={viewSwitchDisabled ? 'Exit Track mode to switch views' : label}
            >
              {icon}
              {label}
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
      ) : (
        <>
          <div className="lt-command-row">
            <div
              className="gnb-status-bar lt-manufacturers"
              role="group"
              aria-label="Manufacturer filters"
            >
              <button
                type="button"
                className={`gnb-status-card ${!selectedManufacturers.length ? 'gnb-status-card--active' : ''}`}
                aria-pressed={!selectedManufacturers.length}
                onClick={() => setSelectedManufacturers([])}
              >
                <span className="gnb-status-card-label">All makes</span>
                <span className="gnb-status-card-count">
                  {Object.values(manufacturerCounts).reduce((sum, n) => sum + (n || 0), 0)}
                </span>
              </button>
              {[...manufacturers, ...(unclassifiedCount > 0 ? ['Unclassified'] : [])].map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    className={`gnb-status-card ${selectedManufacturers.includes(name) ? 'gnb-status-card--active' : ''}`}
                    aria-pressed={selectedManufacturers.includes(name)}
                    onClick={() =>
                      setSelectedManufacturers(
                        selectedManufacturers.includes(name)
                          ? selectedManufacturers.filter((item) => item !== name)
                          : [...selectedManufacturers, name],
                      )
                    }
                  >
                    <span className="gnb-status-card-label">{name}</span>
                    <span className="gnb-status-card-count">{manufacturerCounts[name] ?? 0}</span>
                  </button>
                ),
              )}
            </div>
            {positionsError && (
              <span className="lt-refresh-error" role="status">
                Update failed
              </span>
            )}
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
        </>
      )}
    </div>
  );
}
