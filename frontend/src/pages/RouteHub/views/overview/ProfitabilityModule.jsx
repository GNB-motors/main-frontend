import Ico from '../../routeHubIcons.jsx';
import { inr } from '../../routeHubFormat';
import BarsSkeleton from './BarsSkeleton.jsx';

const money = (n) => (typeof n === 'number' && Number.isFinite(n) ? inr(n) : '—');

/**
 * Route running cost (AutoTrip telemetry) — the top lanes by running cost. No
 * revenue is recorded for detected trips, so there is no margin here; the bar is
 * each lane's running cost against the dearest lane in view.
 */
export default function ProfitabilityModule({ go, first, routes }) {
  const top = (routes || []).slice(0, 6);
  const maxCost = top.reduce((m, r) => Math.max(m, r.runningCostInr || 0), 0) || 1;
  return (
    <div className="card s7">
      <div className="mhead" style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}>
        <span className="mic">
          <Ico n="trend" s={18} />
        </span>
        <div className="mt">
          <h3>Route running cost</h3>
          <div className="ms">Top lanes by running cost · from telemetry</div>
        </div>
        <button
          type="button"
          className="go"
          aria-label="Open running cost"
          onClick={() => go('profitability')}
        >
          <Ico n="arrowUR" s={15} />
        </button>
      </div>
      {first ? <BarsSkeleton /> : null}
      <div className="bars" hidden={first}>
        {top.map((r) => (
          <div className="bar" key={r.routeId} style={{ '--c': '#C56200' }}>
            <span className="n">
              {r.origin || '—'} → {r.destination || '—'}{' '}
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400 }}>
                · {r.tripCount ?? 0} trips
              </span>
            </span>
            <span className="a" style={{ color: '#C56200' }}>
              {money(r.runningCostInr)}
            </span>
            <span className="track">
              <span
                className="f"
                style={{
                  width: `${Math.max(2, Math.min(100, ((r.runningCostInr || 0) / maxCost) * 100))}%`,
                }}
              />
            </span>
          </div>
        ))}
        {!top.length ? (
          <div className="empty">
            <b>No detected trips yet</b>
            <span>Route running cost appears once trucks run detected trips.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
