import Ico from '../../routeHubIcons.jsx';
import { SCALE_PCT } from './overviewConstants.js';
import BarsSkeleton from './BarsSkeleton.jsx';

export default function ProfitabilityModule({ go, first, routes, target }) {
  return (
    <div className="card s7">
      <div className="mhead" style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}>
        <span className="mic">
          <Ico n="trend" s={18} />
        </span>
        <div className="mt">
          <h3>Route profitability</h3>
          <div className="ms">Net margin per trip · target {target}%</div>
        </div>
        <button
          type="button"
          className="go"
          aria-label="Open profitability"
          onClick={() => go('profitability')}
        >
          <Ico n="arrowUR" s={15} />
        </button>
      </div>
      {first ? <BarsSkeleton /> : null}
      <div className="bars" hidden={first}>
        {routes.map((r) => (
          <div className="bar" key={r.routeId} style={{ '--c': r.health.c }}>
            <span className="n">
              {r.name}{' '}
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400 }}>
                · {r.distanceKm ?? '—'} km
              </span>
            </span>
            <span className="a" style={{ color: r.health.c }}>
              {Number(r.marginPct ?? 0).toFixed(1)}%
            </span>
            <span className="pill" style={{ '--c': r.health.c, '--tint': r.health.tint }}>
              {r.health.l}
            </span>
            <span className="track">
              <span
                className="f"
                style={{
                  width: `${Math.max(0, Math.min(100, ((r.marginPct ?? 0) / SCALE_PCT) * 100))}%`,
                }}
              />
              <span
                className="tick"
                title={`Target ${target}%`}
                style={{ left: `${(target / SCALE_PCT) * 100}%` }}
              />
            </span>
          </div>
        ))}
        {routes.length ? (
          <div className="legend" style={{ marginTop: 2 }}>
            <span>
              <i
                style={{
                  width: 2,
                  height: 12,
                  background: 'var(--midnight-black-800)',
                  opacity: 0.55,
                }}
              />
              Target {target}%
            </span>
          </div>
        ) : (
          <div className="empty">
            <b>No billed routes yet</b>
            <span>Route margin needs ERP trips with billing in the last 30 days.</span>
          </div>
        )}
      </div>
    </div>
  );
}
