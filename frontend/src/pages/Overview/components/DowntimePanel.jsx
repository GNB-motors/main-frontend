import { Link } from 'react-router-dom';
import { Panel, StatusPill } from './overview.primitives.jsx';
import EmptyState from '../../../components/cluster/EmptyState';
import { formatINR, formatInrCompact, formatNum } from '../../../utils/formatters';

function DistCell({ label, count, tone }) {
  const color = tone === 'critical' ? 'var(--critical)' : tone === 'caution' ? 'var(--caution)' : 'var(--ok)';
  return (
    <div className="ov-inset flex flex-col items-center gap-1 py-3">
      <span className="num text-2xl font-bold" style={{ color: count > 0 ? color : 'var(--cluster-text)' }}>
        {formatNum(count)}
      </span>
      <span className="text-dim text-[11px] font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

/**
 * Downtime Risk — "What operational risk is coming?"
 * Risk distribution across the whole fleet, then the highest-exposure vehicles
 * with the ₹ figure made visually prominent.
 */
export default function DowntimePanel({ downtime, totalVehicles = 0, loading }) {
  const vehicles = downtime?.vehicles || [];
  const overdue = vehicles.filter((v) => v.risk === 'OVERDUE').length;
  const dueSoon = vehicles.filter((v) => v.risk === 'DUE_SOON').length;
  const normal = Math.max(0, totalVehicles - overdue - dueSoon);
  const exposure = downtime?.totalExposureInr || 0;

  return (
    <Panel
      eyebrow="Downtime Risk"
      question="What risk is coming?"
      className="h-full"
      action={
        <div className="text-right">
          <div className="num text-lg font-bold" style={{ color: exposure > 0 ? 'var(--caution)' : 'var(--ok)' }}>
            {formatInrCompact(exposure)}
          </div>
          <div className="text-dim text-[10px] uppercase tracking-wide">exposure</div>
        </div>
      }
    >
      {loading && !downtime ? (
        <div className="ov-inset h-40 animate-pulse" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <DistCell label="Critical" count={overdue} tone="critical" />
            <DistCell label="Warning" count={dueSoon} tone="caution" />
            <DistCell label="Normal" count={normal} tone="ok" />
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              title="No vehicle at downtime risk"
              hint="The predictive model flags vehicles approaching or past their projected service date. Nothing is due right now."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ov-table">
                <thead>
                  <tr>
                    <th>Risk</th>
                    <th>Vehicle</th>
                    <th className="text-right">Due</th>
                    <th className="text-right">Exposure</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.slice(0, 5).map((v) => (
                    <tr key={v.registrationNumber}>
                      <td>
                        <StatusPill tone={v.risk === 'OVERDUE' ? 'critical' : 'caution'}>
                          {v.risk === 'OVERDUE' ? 'Overdue' : 'Due soon'}
                        </StatusPill>
                      </td>
                      <td>
                        <Link to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}>
                          <span className="reg-plate">{v.registrationNumber}</span>
                        </Link>
                      </td>
                      <td className="num text-dim text-right">
                        {v.daysUntilDue != null ? `${formatNum(Math.abs(v.daysUntilDue))}d` : '—'}
                      </td>
                      <td className="num text-right font-bold" style={{ color: 'var(--caution)' }}>
                        {formatINR(v.exposureInr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
