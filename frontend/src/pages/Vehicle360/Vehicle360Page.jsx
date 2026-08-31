import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Wrench, Fuel, Droplets, FileWarning, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import EmptyState from '../../components/cluster/EmptyState';
import FreshnessBadge from '../../components/cluster/FreshnessBadge';
import { DataArcGauge, DataValue } from '../../components/data-state';
import { formatINR, formatKm, formatLitres, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';

function Panel({ eyebrow, right, children, className = '' }) {
  return (
    <div className={`cluster-panel flex flex-col gap-3 p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="cluster-eyebrow">{eyebrow}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <span className="text-dim text-xs">{k}</span>
      <span className="num text-xs font-semibold">{v ?? '—'}</span>
    </div>
  );
}

function riskLamp(risk) {
  if (risk === 'OVERDUE') return 'lamp--critical';
  if (risk === 'DUE_SOON') return 'lamp--caution';
  return 'lamp--ok';
}

/**
 * A DEF ledger balance object is all-zero from the backend when nothing has
 * ever been recorded. Treat that as no data rather than a confident "0 L".
 */
function hasDefLedgerData(balance) {
  if (!balance) return false;
  const hasValue = [balance.claimedAdblueL, balance.telemetryDefL, balance.expectedBalanceL].some(
    (v) => v != null && Number(v) !== 0,
  );
  const hasFlags = (balance.flagCount ?? 0) > 0 || (balance.flags?.length ?? 0) > 0;
  return hasValue || hasFlags;
}

function fuelUnit(health) {
  return health?.fuelLevelUnit === 'litres' ? 'litres' : 'unverified';
}

function defUnit(health) {
  return health?.defLevelUnit === 'litres' ? 'litres' : 'unverified';
}

export default function Vehicle360Page() {
  const { registrationNumber } = useParams();
  const reg = decodeURIComponent(registrationNumber || '').toUpperCase();

  const { data, loading, error } = useApi((signal) => FleetDataService.getVehicleProfile(reg, signal), [reg]);
  const { data: healthDetail } = useApi(
    (signal) => FleetDataService.getVehicleHealth(reg, { days: 30 }, signal),
    [reg],
    { enabled: Boolean(data?.health) },
  );

  if (error?.statusCode === 404 || error?.status === 404) {
    return (
      <div className="cluster-page">
        <Link to="/vehicles" className="text-dim mb-4 inline-flex items-center gap-1.5 text-xs hover:opacity-70">
          <ArrowLeft size={13} /> All vehicles
        </Link>
        <EmptyState
          title={`Nothing on record for ${reg}`}
          hint="This vehicle isn't in the fleet master, the FleetEdge directory, or the live-status feed. Check the registration, or add the vehicle to the fleet first."
        />
      </div>
    );
  }

  const p = data || {};
  const health = p.health;
  const history = (healthDetail?.history || []).map((h) => ({
    t: h.pulledAt ? new Date(h.pulledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    engineHours: h.engineRunHour,
    odo: h.canOdo,
  }));

  return (
    <div className="cluster-page space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/vehicles" className="text-dim inline-flex items-center gap-1.5 text-xs hover:opacity-70">
            <ArrowLeft size={13} /> Fleet
          </Link>
          <h1 className="cluster-title text-xl">
            <span className="reg-plate text-base">{reg}</span>
          </h1>
          {p.fleetMaster?.status ? (
            <span className={`lamp ${p.fleetMaster.status === 'ON_TRIP' ? 'lamp--caution' : 'lamp--ok'}`}>
              {String(p.fleetMaster.status).replace('_', ' ').toLowerCase()}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {p.coverage && (
            <span className="text-dim text-[11px]">
              {[
                p.coverage.inFleetMaster ? 'fleet master' : null,
                p.coverage.inFleetEdge ? 'FleetEdge' : null,
                p.coverage.hasLiveStatus ? 'live status' : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'no sources'}
            </span>
          )}
          {health ? <FreshnessBadge at={health.pulledAt} always prefix="Telemetry" /> : null}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="cluster-panel h-52 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Health strip */}
          <PanelErrorBoundary name="vehicle-health">
            <Panel eyebrow="Live readings">
              {health ? (
                <>
                  <div className="flex items-start justify-around">
                    <DataArcGauge
                      value={health.primaryFuelLevel}
                      label="Fuel"
                      unit={fuelUnit(health)}
                      at={health.pulledAt}
                      low={15}
                      warn={30}
                    />
                    <DataArcGauge
                      value={health.defLevel}
                      label="DEF"
                      unit={defUnit(health)}
                      at={health.pulledAt}
                      low={10}
                      warn={25}
                    />
                  </div>
                  <div className="mt-2">
                    <KV k="Odometer (CAN)" v={health.canOdo != null ? formatKm(health.canOdo) : '—'} />
                    <KV k="Engine hours" v={health.engineRunHour != null ? `${formatNum(health.engineRunHour, { decimals: 1 })} h` : '—'} />
                    <KV
                      k="Next service"
                      v={
                        health.nextServiceKm != null
                          ? `${formatKm(health.nextServiceKm)}${health.kmToService != null ? ` (${formatNum(health.kmToService)} km left)` : ''}`
                          : '—'
                      }
                    />
                  </div>
                  {health.kmToService != null && health.kmToService < 5000 ? (
                    <span className={`lamp ${health.kmToService < 1500 ? 'lamp--critical' : 'lamp--caution'}`}>
                      service due in {formatNum(health.kmToService)} km
                    </span>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="No live readings"
                  hint="Fuel, DEF and odometer readings appear here when the FleetEdge live-status pull covers this vehicle."
                />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Identity: fleet master + FleetEdge directory */}
          <PanelErrorBoundary name="vehicle-identity">
            <Panel eyebrow="Identity">
              {p.fleetMaster || p.fleetEdge ? (
                <div>
                  <KV k="Model" v={p.fleetEdge?.vehicleModel || p.fleetMaster?.model} />
                  <KV k="Manufacturer" v={p.fleetEdge?.manufacturer || p.fleetMaster?.manufacturer} />
                  <KV k="Category" v={p.fleetMaster?.vehicleCategory || p.fleetEdge?.vehicleType} />
                  <KV k="Fuel" v={p.fleetEdge?.fuelType} />
                  <KV k="Emission norm" v={p.fleetEdge?.emissionNorm} />
                  <KV k="Line of business" v={p.fleetEdge?.lobName} />
                  <KV k="VIN" v={p.fleetEdge?.vin || p.fleetMaster?.chassisNumber} />
                  {!p.fleetMaster ? (
                    <p className="text-dim mt-2 text-[11px]">
                      Not in the fleet master — add it to unlock trips, mileage and document tracking.
                    </p>
                  ) : null}
                </div>
              ) : (
                <EmptyState title="No identity data" hint="Neither the fleet master nor FleetEdge knows this registration." />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Live position */}
          <PanelErrorBoundary name="vehicle-position">
            <Panel
              eyebrow="Position"
              right={
                p.livePosition?.latitude != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${p.livePosition.latitude},${p.livePosition.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: 'var(--gnb-400)' }}
                  >
                    <MapPin size={11} /> Map
                  </a>
                ) : null
              }
            >
              {p.livePosition ? (
                <div>
                  <KV k="State" v={p.livePosition.state} />
                  <KV k="Speed" v={p.livePosition.speed != null ? `${formatNum(p.livePosition.speed)} km/h` : '—'} />
                  <KV k="Last event" v={p.livePosition.eventDateTime ? `${formatDateTimeIST(p.livePosition.eventDateTime)} (${timeAgo(p.livePosition.eventDateTime)})` : '—'} />
                </div>
              ) : (
                <EmptyState
                  title="No live position"
                  hint="Positions appear once live tracking polls this vehicle. Open Live Tracking for the fleet map."
                  action={
                    <Link to="/live-tracking" className="text-xs font-semibold" style={{ color: 'var(--gnb-400)' }}>
                      Open Live Tracking →
                    </Link>
                  }
                />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* DEF ledger row */}
          <PanelErrorBoundary name="vehicle-def">
            <Panel eyebrow="DEF ledger" right={<Droplets size={13} style={{ color: 'var(--cluster-text-dim)' }} />}>
              {hasDefLedgerData(p.defBalance) ? (
                <div>
                  <KV k="Claimed (bills)" v={<DataValue value={p.defBalance.claimedAdblueL} unit="litres" />} />
                  <KV k="Consumed (telemetry)" v={<DataValue value={p.defBalance.telemetryDefL} unit="litres" />} />
                  <KV k="Expected balance" v={<DataValue value={p.defBalance.expectedBalanceL} unit="litres" />} />
                  <KV k="Flags" v={<DataValue value={p.defBalance.flagCount} unit="flags" />} />
                  {p.defBalance.flagCount > 0 ? (
                    <Link to="/def-ledger" className="mt-2 inline-block text-[11px] font-semibold" style={{ color: 'var(--caution)' }}>
                      Review flags in the DEF ledger →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <EmptyState title="No DEF ledger row" hint="Claimed vs consumed DEF appears once bills and CAN data exist." />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Service prediction */}
          <PanelErrorBoundary name="vehicle-prediction">
            <Panel eyebrow="Service forecast" right={<Wrench size={13} style={{ color: 'var(--cluster-text-dim)' }} />}>
              {p.prediction ? (
                <div>
                  <span className={`lamp ${riskLamp(p.prediction.risk)}`}>{String(p.prediction.risk || 'OK').replace('_', ' ').toLowerCase()}</span>
                  <div className="mt-2">
                    <KV k="Km until due" v={p.prediction.kmUntilDue != null ? formatKm(p.prediction.kmUntilDue) : '—'} />
                    <KV k="Days until due" v={p.prediction.daysUntilDue != null ? formatNum(p.prediction.daysUntilDue) : '—'} />
                    <KV k="Projected due" v={p.prediction.projectedServiceDueDate ? formatDateIST(p.prediction.projectedServiceDueDate) : '—'} />
                    <KV k="Basis" v={String(p.prediction.basis || '').replace(/_/g, ' ').toLowerCase()} />
                  </div>
                </div>
              ) : (
                <EmptyState title="No forecast" hint="A service projection appears after the predictive sweep sees odometer history for this vehicle." />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Documents */}
          <PanelErrorBoundary name="vehicle-docs">
            <Panel eyebrow="Documents" right={<FileWarning size={13} style={{ color: 'var(--cluster-text-dim)' }} />}>
              {p.fleetMaster?.documents?.length ? (
                <div>
                  {p.fleetMaster.documents.map((d) => (
                    <KV key={d.docType} k={d.docType} v={d.expiryDate ? formatDateIST(d.expiryDate) : 'no expiry'} />
                  ))}
                  <Link to="/compliance" className="mt-2 inline-block text-[11px] font-semibold" style={{ color: 'var(--gnb-400)' }}>
                    Open compliance screen →
                  </Link>
                </div>
              ) : (
                <EmptyState title="No documents on record" hint="Upload RC, insurance, fitness and permits on the vehicle profile to track expiries here." />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Engine hours trend */}
          <PanelErrorBoundary name="vehicle-trend">
            <Panel eyebrow="Engine hours — 30d" className="lg:col-span-2" right={<Activity size={13} style={{ color: 'var(--cluster-text-dim)' }} />}>
              {history.length > 1 ? (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <XAxis dataKey="t" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={60} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--cluster-panel)',
                          border: '1px solid var(--hairline)',
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        formatter={(v) => [`${formatNum(v, { decimals: 1 })} h`, 'engine hours']}
                      />
                      <Area type="monotone" dataKey="engineHours" stroke="var(--gnb-400)" fill="var(--gnb-400)" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="Not enough history" hint="The engine-hours trend needs at least two live-status readings in the window." />
              )}
            </Panel>
          </PanelErrorBoundary>

          {/* Recent fuel logs */}
          <PanelErrorBoundary name="vehicle-fuel-logs">
            <Panel eyebrow="Recent fuel logs" right={<Fuel size={13} style={{ color: 'var(--cluster-text-dim)' }} />}>
              {p.recentFuelLogs?.length ? (
                <div>
                  {p.recentFuelLogs.map((l) => (
                    <KV
                      key={l.id}
                      k={formatDateIST(l.refuelTime)}
                      v={`${formatLitres(l.litres)} · ${formatINR(l.totalAmount)}`}
                    />
                  ))}
                  <Link to="/fuel-spend" className="mt-2 inline-block text-[11px] font-semibold" style={{ color: 'var(--gnb-400)' }}>
                    All fuel spend →
                  </Link>
                </div>
              ) : (
                <EmptyState title="No fuel logs" hint="Uploaded fuel bills for this vehicle show up here." />
              )}
            </Panel>
          </PanelErrorBoundary>
        </div>
      )}
    </div>
  );
}
