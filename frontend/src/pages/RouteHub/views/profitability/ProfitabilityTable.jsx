import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';

/** "—" for anything that is not a known number (unpriced ≠ ₹0). */
const money = (n) => (typeof n === 'number' && Number.isFinite(n) ? inr(n) : '—');
const km = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n)} km` : '—');

/**
 * Per-route RUNNING COST from AutoTrip telemetry (no ERP, no revenue, no margin).
 * Lanes are grouped by the route the truck actually ran (origin place → drop
 * place); a lane with no priced trips shows "—", never ₹0, and the "Priced"
 * column says how many of its trips carry cost.
 */
export default function ProfitabilityTable({
  routes,
  selected,
  setSelId,
  first,
  error,
  windowLabel = 'the last 30 days',
}) {
  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="split" />
        </span>
        <h3>Route running cost</h3>
        <span className="hint">Detected trips grouped by lane · cost from telemetry economics</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Route</th>
              <th className="num">Trips</th>
              <th className="num">Distance</th>
              <th className="num">Avg cost / trip</th>
              <th className="num">Cost / km</th>
              <th className="num">Priced</th>
            </tr>
          </thead>
          {routes.length ? (
            <tbody>
              {routes.map((r) => (
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
    </div>
  );
}
