import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { inr, fmtDT } from '../../routeHubFormat';

const money = (n) => (typeof n === 'number' && Number.isFinite(n) ? inr(n) : '—');
const km = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n)} km` : '—');

const STATUS_LABEL = {
  COMPLETE: 'Complete',
  CONFIRMED: 'Confirmed',
  NEEDS_REVIEW: 'Needs review',
  OPEN: 'Open',
};

/**
 * Per-trip RUNNING COST from AutoTrip telemetry, most recent first. No revenue
 * is recorded for a detected trip, so there is no margin — this is distance and
 * running cost only. A trip the economics engine has not priced shows "—" for
 * cost (unknown, not ₹0).
 */
export default function TripPnlTable({ trips, first, error, className = '' }) {
  const rows = trips || [];
  return (
    <div className={`card ${className}`.trim()}>
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="ledger" />
        </span>
        <h3>Trip running cost</h3>
        <span className="hint">Detected trips, most recent first · cost from telemetry</span>
      </div>
      <div className="tblwrap tblwrap--scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Route</th>
              <th className="num">Distance</th>
              <th className="num">Running cost</th>
              <th>When</th>
              <th>Status</th>
            </tr>
          </thead>
          {rows.length ? (
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="strong">{t.registrationNumber || '—'}</td>
                  <td>
                    {t.origin || '—'} <span style={{ color: 'var(--fg-tertiary)' }}>→</span>{' '}
                    {t.destination || '—'}
                  </td>
                  <td className="num mono">{km(t.distanceKm)}</td>
                  <td className="num mono strong">
                    {money(t.runningCostInr)}
                    {!t.priced ? <div className="hint">not priced yet</div> : null}
                  </td>
                  <td className="mono">{t.at ? fmtDT(new Date(t.at)) : '—'}</td>
                  <td>
                    <span style={{ color: 'var(--fg-tertiary)' }}>
                      {STATUS_LABEL[t.status] || t.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : first ? (
            <TableSkeleton cols={6} />
          ) : (
            <TableEmpty
              colSpan={6}
              title={error ? 'Trip cost unavailable' : 'No detected trips in this window'}
              sub={error || 'Detected trips and their running cost appear here once trucks run.'}
              tone={error ? '#C56200' : '#4B5563'}
              icon={error ? 'alert' : 'ledger'}
            />
          )}
        </table>
      </div>
    </div>
  );
}
