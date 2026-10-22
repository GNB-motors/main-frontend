import LiveClock from './LiveClock.jsx';
import Skel from './Skel.jsx';
import renderIconSvg from './renderIconSvg.jsx';

export default function LiveTopbar({
  isLiveLoading,
  counts,
  statusCards,
  filter,
  setFilter,
  handleRefresh,
  isRefreshing,
}) {
  return (
    <div className="topbar">
      <div className="brandmark">
        <span className="dot-live">{renderIconSvg('radio', 16)}</span>
        <strong>Live</strong>
      </div>

      <span className="livepill">
        <i />
        <span>{isLiveLoading ? <Skel w={14} h={10} /> : counts.gps} Live on Map</span>
      </span>

      {/* Connected Telematics Status Bar Strip (WheelsEye Style) */}
      <div className="gnb-status-bar" role="tablist" aria-label="Fleet status filters">
        {statusCards.map((card) => {
          const isActive = filter === card.k;
          return (
            <button
              key={card.k}
              type="button"
              role="tab"
              className={`gnb-status-card ${isActive ? 'gnb-status-card--active' : ''}`}
              aria-selected={isActive}
              onClick={() => setFilter(card.k)}
            >
              <span
                className="gnb-status-card-count"
                style={!isActive && card.countColor ? { color: card.countColor } : undefined}
              >
                {isLiveLoading ? <Skel w={18} h={14} /> : card.count}
              </span>
              <span className="gnb-status-card-label">{card.label}</span>
              {!isActive && (
                <span className="gnb-status-card-stripe" style={{ backgroundColor: card.stripe }} />
              )}
              {isActive && <span className="gnb-status-card-arrow" />}
            </button>
          );
        })}
      </div>

      {/* Topbar Tools */}
      <div className="tools">
        <span className="clockchip">
          {renderIconSvg('clock', 15)}
          <LiveClock />
        </span>

        <button
          className="btn btn--icon"
          title="Refresh positions"
          aria-label="Refresh"
          onClick={handleRefresh}
        >
          {renderIconSvg('refresh', 16, isRefreshing ? 'spin' : '')}
        </button>
      </div>
    </div>
  );
}
