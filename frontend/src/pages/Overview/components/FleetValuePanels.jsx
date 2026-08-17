import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import EmptyState from '../../../components/cluster/EmptyState';
import { useUtilization, useDowntimeRisk } from '../../../hooks/useOwnerValue';
import { formatINR, formatInrCompact, formatKm, formatNum, formatPct } from '../../../utils/formatters';

/**
 * Utilization + downtime panels for the Overview (PR 2.4).
 * Both degrade to directive empty states while trip/prediction data is thin —
 * an honest empty panel beats a demo of nothing.
 */
export default function FleetValuePanels({ moneyParams = {} }) {
  const { data: utilization, loading: utilLoading } = useUtilization(moneyParams);
  const { data: downtime, loading: downLoading } = useDowntimeRisk();

  const fleet = utilization?.fleet;
  const hasUtil = fleet && fleet.totalKm > 0;
  const riskVehicles = downtime?.vehicles || [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PanelErrorBoundary name="utilization">
        <div className="cluster-panel flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="cluster-eyebrow">Utilization</span>
            <span className="text-dim text-[11px]">loaded vs empty km</span>
          </div>
          {utilLoading && !utilization ? (
            <div className="cluster-inset h-28 animate-pulse" />
          ) : !hasUtil ? (
            <EmptyState
              title="No distance data in this window"
              hint="Loaded vs empty kilometres appear once trips are running and FleetEdge distance data flows. Until then there's nothing to price."
            />
          ) : (
            <>
              <div className="flex items-end gap-6">
                <div>
                  <div className="num text-2xl font-bold" style={{ color: 'var(--cluster-text)' }}>
                    {formatPct(fleet.emptyKmPct, { decimals: 1 })}
                  </div>
                  <div className="text-dim text-xs">empty running</div>
                </div>
                <div>
                  <div className="num text-2xl font-bold" style={{ color: fleet.emptyKmWasteInr > 0 ? 'var(--caution)' : 'var(--ok)' }}>
                    {formatInrCompact(fleet.emptyKmWasteInr)}
                  </div>
                  <div className="text-dim text-xs">estimated empty-km waste</div>
                </div>
                <div className="text-dim ml-auto text-right text-xs">
                  <span className="num">{formatKm(fleet.loadedKm)}</span> loaded
                  <br />
                  <span className="num">{formatKm(fleet.emptyKm)}</span> empty
                </div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--hairline)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.min(100, fleet.emptyKmPct)}%`,
                    background: fleet.emptyKmPct > 30 ? 'var(--critical)' : fleet.emptyKmPct > 15 ? 'var(--caution)' : 'var(--ok)',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary name="downtime-risk">
        <div className="cluster-panel flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="cluster-eyebrow">Downtime risk</span>
            <span className="text-dim text-[11px]">{riskVehicles.length ? `exposure ${formatInrCompact(downtime.totalExposureInr)}` : ''}</span>
          </div>
          {downLoading && !downtime ? (
            <div className="cluster-inset h-28 animate-pulse" />
          ) : riskVehicles.length === 0 ? (
            <EmptyState
              title="No vehicle at downtime risk"
              hint="The predictive model flags vehicles approaching or past their projected service date. Nothing is due right now."
            />
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--hairline)' }}>
              {riskVehicles.slice(0, 4).map((v) => (
                <Link
                  key={v.registrationNumber}
                  to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}
                  className="flex items-center gap-3 py-2 transition-opacity hover:opacity-75"
                >
                  <span className="reg-plate">{v.registrationNumber}</span>
                  <span className={`lamp ${v.risk === 'OVERDUE' ? 'lamp--critical' : 'lamp--caution'}`}>
                    {v.risk === 'OVERDUE' ? 'overdue' : 'due soon'}
                  </span>
                  <span className="num text-dim ml-auto text-xs">
                    {v.daysUntilDue != null ? `${formatNum(Math.abs(v.daysUntilDue))}d` : '—'}
                  </span>
                  <span className="num text-xs font-bold" style={{ color: 'var(--caution)' }}>
                    {formatINR(v.exposureInr)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PanelErrorBoundary>
    </div>
  );
}
