import Ico from '../../routeHubIcons.jsx';
import { Skel } from '../../routeHubShared.jsx';

export default function ReplayModule({ go, first, utilization, vehicles }) {
  return (
    <div className="card s5">
      <div
        className="mhead"
        style={{ '--c': 'var(--nova-rage-600)', '--tint': 'var(--nova-rage-a10)' }}
      >
        <span className="mic">
          <Ico n="route" s={18} />
        </span>
        <div className="mt">
          <h3>Route replay</h3>
          <div className="ms">Today&apos;s vehicles · play any to replay</div>
        </div>
        <button
          type="button"
          className="go"
          aria-label="Open route replay"
          onClick={() => go('replay')}
        >
          <Ico n="arrowUR" s={15} />
        </button>
      </div>
      <div className="rows" style={{ paddingBottom: 'var(--space-4)' }}>
        {first
          ? Array.from({ length: 5 }, (_, i) => (
              <div className="trip" key={i} aria-hidden="true">
                <Skel w={30} h={30} r={999} />
                <div className="route">
                  <Skel w={88} h={22} r={6} />
                </div>
                <Skel w={40} h={10} />
              </div>
            ))
          : null}
        {(first ? [] : utilization?.vehicles || vehicles.slice(0, 5)).slice(0, 5).map((v) => {
          const reg = v.registrationNumber;
          const km = v.totalKm != null ? Math.round(v.totalKm) : null;
          return (
            <div className="trip" key={reg || v._id}>
              <button
                type="button"
                className="playbtn"
                aria-label={`Replay ${reg}`}
                onClick={() => go('replay', { v: reg })}
              >
                <Ico n="play" s={14} />
              </button>
              <div className="route">
                <span className="plate" style={{ marginRight: 8 }}>
                  {reg}
                </span>
                {v.model || ''}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--fg-secondary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {km != null ? `${km} km` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
