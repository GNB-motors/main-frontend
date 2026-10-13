import Ico from '../../routeHubIcons.jsx';
import { RowsSkeleton } from '../../routeHubShared.jsx';
import { OS_MAX_HOURS, OS_THRESHOLD } from './overviewConstants.js';
import Gauge from './Gauge.jsx';
import GaugeSkeleton from './GaugeSkeleton.jsx';

export default function OverspeedModule({ go, first, hours, osTotals, overspeed, vehicles }) {
  return (
    <div className="card">
      <div className="mhead" style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}>
        <span className="mic">
          <Ico n="gauge" s={18} />
        </span>
        <div className="mt">
          <h3>Overspeed audit</h3>
          <div className="ms">
            Sustained over {OS_THRESHOLD} km/h · last {Math.min(hours, OS_MAX_HOURS)} h
          </div>
        </div>
        <button
          type="button"
          className="go"
          aria-label="Open overspeed audit"
          onClick={() => go('overspeed')}
        >
          <Ico n="arrowUR" s={15} />
        </button>
      </div>
      {first ? (
        <>
          <GaugeSkeleton />
          <RowsSkeleton n={3} />
        </>
      ) : (
        <Gauge
          peak={osTotals.peakSpeedKmh || 0}
          eventCount={osTotals.eventCount || 0}
          flagged={osTotals.vehiclesFlagged || 0}
          vehicleCount={osTotals.vehicleCount || vehicles.length}
        />
      )}
      <div className="rows">
        {(overspeed?.vehicles || [])
          .filter((v) => v.eventCount)
          .slice(0, 3)
          .map((v) => (
            <div className="row" key={v.vehicleId}>
              <span className="plate">{v.registrationNumber}</span>
              <span className="muted">
                {v.eventCount} event{v.eventCount > 1 ? 's' : ''}
              </span>
              <span className="sp" />
              <b style={{ color: '#C56200' }}>{v.peakSpeedKmh} km/h</b>
            </div>
          ))}
      </div>
    </div>
  );
}
