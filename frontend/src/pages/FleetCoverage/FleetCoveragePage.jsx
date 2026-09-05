import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatNum, formatPct } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import VehicleLink from '../../components/Fleet/VehicleLink.jsx';

function StatTile({ label, value, tone }) {
  return (
    <div className="cluster-inset flex flex-col gap-1 p-4">
      <span className="cluster-eyebrow">{label}</span>
      <span className="num text-xl font-bold" style={{ color: tone }}>{value}</span>
    </div>
  );
}

function TableShell({ title, caption, children }) {
  return (
    <div className="cluster-panel overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="cluster-title text-sm">{title}</h2>
        {caption ? <p className="text-dim mt-1 text-xs leading-relaxed">{caption}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function FleetCoveragePage({ embedded = false }) {
  const { data, loading, error } = useApi((signal) => FleetDataService.getFleetCoverage(signal), []);

  const summary = data?.summary || {};
  const onlyEdge = useMemo(() => data?.onlyInFleetEdge || [], [data]);
  const onlyMaster = useMemo(() => data?.onlyInFleetMaster || [], [data]);
  const linkedCount = summary.linked ?? (data?.linked || []).length;

  const coveragePct = summary.inFleetEdge > 0 ? (100 * (summary.linked ?? 0)) / summary.inFleetEdge : null;
  const noDirectory = !loading && !error && data && summary.inFleetEdge === 0;

  const skeleton = (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="cluster-inset h-10 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className={embedded ? 'fleet-embedded space-y-5' : 'cluster-page space-y-5'}>
      <div>
        <h1 className="cluster-title text-xl">FleetEdge Coverage</h1>
        <p className="text-dim mt-1 text-sm">
          Vehicles your FleetEdge account reports vs vehicles in your fleet master.
        </p>
      </div>

      <PanelErrorBoundary name="fleet-coverage">
        {loading && !data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="cluster-inset h-20 animate-pulse" />
              ))}
            </div>
            <div className="cluster-panel mt-4">{skeleton}</div>
          </>
        ) : error && !data ? (
          <div className="cluster-panel">
            <EmptyState
              title="Coverage data unavailable"
              hint="Link a FleetEdge account (Settings → FleetEdge accounts) and its vehicle directory appears here."
            />
          </div>
        ) : noDirectory ? (
          <div className="cluster-panel">
            <EmptyState
              title="No FleetEdge directory data"
              hint="Link a FleetEdge account (Settings → FleetEdge accounts) and its vehicle directory appears here."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Linked" value={formatNum(linkedCount)} tone="var(--ok)" />
              <StatTile label="Only in FleetEdge" value={formatNum(summary.onlyFleetEdge ?? onlyEdge.length)} tone="var(--caution)" />
              <StatTile label="Only in fleet master" value={formatNum(summary.onlyFleetMaster ?? onlyMaster.length)} tone="var(--inert)" />
              <StatTile label="Coverage" value={coveragePct == null ? '—' : formatPct(coveragePct)} tone="var(--cluster-text)" />
            </div>

            <div className="mt-4 space-y-4">
              <TableShell
                title="On FleetEdge, not in your fleet"
                caption="These vehicles stream data to your FleetEdge account, but they are invisible to mileage, trips and alerts until you add them to your fleet."
              >
                {onlyEdge.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="No gap here"
                      hint="Every vehicle on your FleetEdge account is already in your fleet master."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
                          <th className="px-4 py-3 font-semibold">Vehicle</th>
                          <th className="px-4 py-3 font-semibold">Model</th>
                          <th className="px-4 py-3 font-semibold">Manufacturer</th>
                          <th className="px-4 py-3 font-semibold">Fuel</th>
                          <th className="px-4 py-3 font-semibold">Emission</th>
                          <th className="px-4 py-3 font-semibold">LOB</th>
                          <th className="px-4 py-3 font-semibold">Last seen</th>
                          <th className="px-4 py-3 font-semibold" />
                        </tr>
                      </thead>
                      <tbody>
                        {onlyEdge.map((v) => (
                          <tr key={v.registrationNumber} style={{ borderBottom: '1px solid var(--hairline)' }}>
                            <td className="px-4 py-3"><VehicleLink reg={v.registrationNumber} /></td>
                            <td className="px-4 py-3">{v.vehicleModel || '—'}</td>
                            <td className="px-4 py-3">{v.manufacturer || '—'}</td>
                            <td className="px-4 py-3">{v.fuelType || '—'}</td>
                            <td className="px-4 py-3">{v.emissionNorm || '—'}</td>
                            <td className="px-4 py-3">{v.lobName || '—'}</td>
                            <td className="num px-4 py-3">{formatDateIST(v.lastSeenAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <Link to="/vehicles" className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--gnb-400)' }}>
                                Add to fleet →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableShell>

              <TableShell
                title="In fleet master, not on FleetEdge"
                caption="These vehicles exist in your fleet master but your FleetEdge account doesn't report them. Check the registration number or the device mapping."
              >
                {onlyMaster.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title="No gap here"
                      hint="Every vehicle in your fleet master is reporting through FleetEdge."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
                          <th className="px-4 py-3 font-semibold">Vehicle</th>
                          <th className="px-4 py-3 font-semibold">Model</th>
                          <th className="px-4 py-3 font-semibold">Manufacturer</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">FleetEdge reg.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onlyMaster.map((v) => (
                          <tr key={v.registrationNumber} style={{ borderBottom: '1px solid var(--hairline)' }}>
                            <td className="px-4 py-3"><VehicleLink reg={v.registrationNumber} /></td>
                            <td className="px-4 py-3">{v.model || '—'}</td>
                            <td className="px-4 py-3">{v.manufacturer || '—'}</td>
                            <td className="px-4 py-3">{v.status || '—'}</td>
                            <td className="px-4 py-3">{v.fleetEdgeRegistration || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableShell>

              <p className="text-dim text-xs">
                {formatNum(linkedCount)} vehicle{linkedCount === 1 ? '' : 's'} linked and reporting normally.
              </p>
            </div>
          </>
        )}
      </PanelErrorBoundary>
    </div>
  );
}
