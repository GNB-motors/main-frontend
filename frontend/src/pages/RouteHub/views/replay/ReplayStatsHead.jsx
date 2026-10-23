import Ico from '../../routeHubIcons.jsx';
import { Skel } from '../../routeHubShared.jsx';

export default function ReplayStatsHead({ vehicle, trip, loading, stats }) {
  return (
    <div className="card-head">
      <span className="eyebrow">Replay canvas</span>
      <span className="hint">
        {vehicle ? `${vehicle.registrationNumber}` : ''}
        {trip
          ? ` · ${trip.startAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : ''}
      </span>
      <span className="sp" />
      <div className="stats">
        {loading && !trip
          ? ['Distance', 'Duration', 'Avg speed', 'Peak speed'].map((k) => (
              <span className="stat" key={k} aria-hidden="true">
                {k}
                <Skel w={44} h={12} />
              </span>
            ))
          : null}
        {stats.map(([i, k, val, c]) => (
          <span className="stat" key={k} style={{ '--c': c }}>
            <Ico n={i} s={14} />
            {k}
            <b>{val}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
