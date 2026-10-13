import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';
import { SCALE_PCT } from './profitabilityScale.js';

export default function ProfitabilityTable({ routes, selected, setSelId, target, first, error }) {
  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="split" />
        </span>
        <h3>Route profitability benchmark</h3>
        <span className="hint">Per trip averages · select a route for its cost breakdown</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Route</th>
              <th className="num">Distance</th>
              <th className="num">Trips</th>
              <th className="num">Avg invoiced rev</th>
              <th className="num">Avg running cost</th>
              <th className="num">Est. margin</th>
              <th>Margin %</th>
              <th>Health</th>
            </tr>
          </thead>
          {routes.length ? (
            <tbody>
              {routes.map((r, i) => (
                <tr
                  key={r.routeId}
                  className={`click ${selected && r.routeId === selected.routeId ? 'sel' : ''}`}
                  onClick={() => setSelId(r.routeId)}
                >
                  <td>
                    <span className="plate">#{i + 1}</span>
                  </td>
                  <td className="strong">
                    {r.originCity || '—'} <span style={{ color: 'var(--fg-tertiary)' }}>→</span>{' '}
                    {r.destCity || '—'}
                  </td>
                  <td className="num mono">{r.distanceKm ?? '—'} km</td>
                  <td className="num mono">{r.tripCount ?? 0}</td>
                  <td className="num mono strong">{inr(r.avgRevenueInr || 0)}</td>
                  <td className="num mono">{inr(r.avgCostInr || 0)}</td>
                  <td
                    className="num mono strong"
                    style={{ color: (r.avgMarginInr || 0) >= 0 ? '#187A32' : '#C2323A' }}
                  >
                    {(r.avgMarginInr || 0) >= 0 ? '+' : ''}
                    {inr(r.avgMarginInr || 0)}
                  </td>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the margin text inside */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="mono strong" style={{ color: r.health.c, width: 42 }}>
                        {Number(r.marginPct ?? 0).toFixed(1)}%
                      </span>
                      <span className="mbar" style={{ '--c': r.health.c }}>
                        <span
                          className="f"
                          style={{
                            width: `${Math.max(0, Math.min(100, ((r.marginPct ?? 0) / SCALE_PCT) * 100))}%`,
                          }}
                        />
                        <span className="tick" style={{ left: `${(target / SCALE_PCT) * 100}%` }} />
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="pill" style={{ '--c': r.health.c, '--tint': r.health.tint }}>
                      {r.health.l}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : first ? (
            <TableSkeleton cols={9} />
          ) : (
            <TableEmpty
              colSpan={9}
              title={error ? 'Profitability unavailable' : 'No billed routes yet'}
              sub={error || 'No ERP trips with billing in the last 30 days.'}
              tone={error ? '#C56200' : '#187A32'}
              icon={error ? 'alert' : 'check'}
            />
          )}
        </table>
      </div>
    </div>
  );
}
