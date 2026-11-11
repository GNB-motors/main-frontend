import { useState } from 'react';
import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';

/** "—" for anything that is not a known number (unpriced ≠ ₹0). */
const money = (n) => (typeof n === 'number' && Number.isFinite(n) ? inr(n) : '—');
const km = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n)} km` : '—');

const PAGE = 12;

/**
 * Per-route RUNNING COST from AutoTrip telemetry (no ERP, no revenue, no margin).
 * Lanes are grouped by the route the truck actually ran (origin place → drop
 * place); a lane with no priced trips shows "—", never ₹0, and the "Priced"
 * column says how many of its trips carry cost. Paginated so a long fleet does
 * not stretch the card.
 */
export default function ProfitabilityTable({
  routes,
  selected,
  setSelId,
  first,
  error,
  windowLabel = 'the last 30 days',
  className = '',
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(routes.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE;
  const shown = routes.slice(start, start + PAGE);

  return (
    <div className={`card ${className}`.trim()}>
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="split" />
        </span>
        <h3>Route running cost</h3>
        <span className="hint">Detected trips grouped by lane · cost from telemetry</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Route</th>
              <th className="num">Trips</th>
              <th className="num">Distance</th>
              <th className="num">Avg / trip</th>
              <th className="num">Cost / km</th>
              <th className="num">Priced</th>
            </tr>
          </thead>
          {routes.length ? (
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.routeId}
                  className={`click ${selected && r.routeId === selected.routeId ? 'sel' : ''}`}
                  onClick={() => setSelId(r.routeId)}
                >
                  <td>
                    <span className="plate">#{r.rank}</span>
                  </td>
                  <td className="strong">
                    {r.origin || '—'} <span style={{ color: 'var(--fg-tertiary)' }}>→</span>{' '}
                    {r.destination || '—'}
                  </td>
                  <td className="num mono">{r.tripCount ?? 0}</td>
                  <td className="num mono">{km(r.distanceKm)}</td>
                  <td className="num mono strong">{money(r.avgCostPerTripInr)}</td>
                  <td className="num mono">
                    {typeof r.costPerKmInr === 'number' ? `₹${Math.round(r.costPerKmInr)}` : '—'}
                  </td>
                  <td className="num mono" style={{ color: 'var(--fg-tertiary)' }}>
                    {r.economicsTripCount}/{r.tripCount}
                  </td>
                </tr>
              ))}
            </tbody>
          ) : first ? (
            <TableSkeleton cols={7} />
          ) : (
            <TableEmpty
              colSpan={7}
              title={error ? 'Running cost unavailable' : 'No detected trips in this window'}
              sub={error || `No AutoTrip activity in ${windowLabel.toLowerCase()} for this fleet.`}
              tone={error ? '#C56200' : '#4B5563'}
              icon={error ? 'alert' : 'route'}
            />
          )}
        </table>
      </div>
      {routes.length > PAGE ? (
        <div className="dev-pager">
          <span className="muted">
            {start + 1}–{Math.min(start + PAGE, routes.length)} of {routes.length} lanes
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <Ico n="arrowL" s={12} /> Prev
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
            >
              Next <Ico n="arrowR" s={12} />
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
