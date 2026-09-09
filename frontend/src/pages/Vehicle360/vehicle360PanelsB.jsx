import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { formatINR, formatKm, formatLitres, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';
import useApi from '../../hooks/useApi';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import {
  serviceState,
  documentSummary,
  buildSignals,
  daysSince,
  hasDefLedgerData,
} from './vehicle360Logic';

function Empty({ title, hint, action }) {
  return (
    <div className="v360-empty">
      <span className="v360-empty-title">{title}</span>
      {hint ? <span className="v360-empty-hint">{hint}</span> : null}
      {action}
    </div>
  );
}

/**
 * Service tab — the standing, stated plainly, with the reasoning spelled out.
 * A frozen odometer means the overdue distance cannot grow, which is worth
 * saying: it changes when the workshop visit should be booked.
 */
export function ServicePanel({ prediction, health, history }) {
  const svc = serviceState(prediction);
  const stalled = (history || []).length > 1 && daysSince(health?.pulledAt) >= 1;

  if (svc.level === 'none') {
    return (
      <PanelErrorBoundary name="vehicle-service">
        <div className="v360-panel--single v360-panel">
          <section className="v360-card">
            <p className="v360-card-title">Service</p>
            <Empty
              title="No service forecast yet"
              hint="A projection appears once the predictive sweep has enough odometer history for this vehicle."
            />
          </section>
        </div>
      </PanelErrorBoundary>
    );
  }

  return (
    <PanelErrorBoundary name="vehicle-service">
      <div className="v360-panel v360-panel--halves">
        <section className={`v360-card ${svc.overdue ? 'v360-card--alert' : ''}`.trim()}>
          <span className={`v360-pill v360-pill--${svc.overdue ? 'crit' : 'warn'}`}>
            <span className="v360-pill-dot" aria-hidden="true" />
            {svc.label}
          </span>

          <p className="v360-figure">
            <span
              className={`v360-figure-value v360-figure-value--lg ${svc.overdue ? 'v360-figure-value--crit' : ''}`.trim()}
            >
              {svc.km != null ? formatKm(svc.km) : `${formatNum(svc.days ?? 0)} days`}
            </span>
            <span className="v360-figure-note">
              {svc.overdue ? 'past the service interval' : 'until the service is due'}
            </span>
          </p>

          <p className="v360-card-lede">
            {svc.projectedAt ? `Due ${formatDateIST(svc.projectedAt)}` : 'Due date not projected'}
            {svc.days != null
              ? ` — ${formatNum(svc.days)} days ${svc.overdue ? 'ago' : 'away'}.`
              : '.'}
            {stalled && svc.overdue
              ? ' The odometer has not moved since the last reading, so the overdue distance is frozen — it will not grow until the truck runs again.'
              : ''}
          </p>

          <dl className="v360-kv">
            {svc.days != null ? (
              <>
                <dt>{svc.overdue ? 'Days overdue' : 'Days until due'}</dt>
                <dd className={svc.overdue ? 'is-crit' : undefined}>{formatNum(svc.days)} days</dd>
              </>
            ) : null}
            <dt>Projected due</dt>
            <dd>{svc.projectedAt ? formatDateIST(svc.projectedAt) : '—'}</dd>
            {health?.nextServiceKm != null ? (
              <>
                <dt>Next service at</dt>
                <dd>{formatKm(health.nextServiceKm)}</dd>
              </>
            ) : null}
            {health?.canOdo != null ? (
              <>
                <dt>Odometer at last reading</dt>
                <dd>{formatKm(health.canOdo)}</dd>
              </>
            ) : null}
            {svc.basis ? (
              <>
                <dt>Basis</dt>
                <dd className="is-dim">{String(svc.basis).replace(/_/g, ' ').toLowerCase()}</dd>
              </>
            ) : null}
          </dl>

          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              to="/vehicles/service-intelligence/add-service"
              className="v360-btn v360-btn--primary"
            >
              Create service record
            </Link>
            <Link to="/vehicles/service-intelligence" className="v360-btn">
              Service history
            </Link>
          </div>
        </section>

        <section className="v360-card">
          <p className="v360-card-title">How this was worked out</p>
          <p className="v360-card-lede">
            The forecast comes from the predictive sweep, which projects the next service from the
            odometer trend rather than from a fixed calendar date.
          </p>
          <dl className="v360-kv">
            <dt>Source</dt>
            <dd className="is-dim">predictive maintenance sweep</dd>
            <dt>Readings used</dt>
            <dd>{formatNum((history || []).length)}</dd>
            <dt>Last telemetry</dt>
            <dd className="is-dim">{health?.pulledAt ? timeAgo(health.pulledAt) : 'never'}</dd>
          </dl>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}

export function FuelPanel({ recentFuelLogs, defBalance }) {
  const logs = recentFuelLogs || [];

  return (
    <PanelErrorBoundary name="vehicle-fuel">
      <div className="v360-panel v360-panel--halves">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Fuel bills</p>
            <Link to="/fuel-spend" className="v360-link">
              All fuel spend →
            </Link>
          </div>
          {logs.length === 0 ? (
            <Empty
              title="No fuel logs"
              hint="Uploaded fuel bills for this vehicle appear here once they are processed."
            />
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="is-num">Litres</th>
                  <th className="is-num">Rate</th>
                  <th className="is-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateIST(l.refuelTime)}</td>
                    <td className="is-num">{formatLitres(l.litres)}</td>
                    <td className="is-num">{l.rate != null ? `${formatINR(l.rate)}/L` : '—'}</td>
                    <td className="is-num">{formatINR(l.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">DEF ledger</p>
            <Link to="/def-ledger" className="v360-link">
              DEF ledger →
            </Link>
          </div>
          {hasDefLedgerData(defBalance) ? (
            <dl className="v360-kv">
              <dt>Claimed (bills)</dt>
              <dd>{formatLitres(defBalance.claimedAdblueL)}</dd>
              <dt>Consumed (telemetry)</dt>
              <dd>{formatLitres(defBalance.telemetryDefL)}</dd>
              <dt>Expected balance</dt>
              <dd>{formatLitres(defBalance.expectedBalanceL)}</dd>
              <dt>Flags</dt>
              <dd className={defBalance.flagCount > 0 ? 'is-crit' : undefined}>
                {formatNum(defBalance.flagCount ?? 0)}
              </dd>
            </dl>
          ) : (
            <Empty
              title="No DEF ledger row"
              hint="Claimed versus consumed DEF appears once both bills and CAN data exist for this vehicle."
            />
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}

export function DocumentsPanel({ documents }) {
  const rows = documents || [];
  const summary = documentSummary(rows);

  return (
    <PanelErrorBoundary name="vehicle-docs">
      <div className="v360-panel v360-panel--halves">
        <section className={`v360-card ${summary.expired > 0 ? 'v360-card--alert' : ''}`.trim()}>
          <div className="v360-card-head">
            <p className="v360-card-title">Documents</p>
            <Link to="/compliance" className="v360-link">
              Compliance →
            </Link>
          </div>
          {rows.length === 0 ? (
            <Empty
              title="No documents on record"
              hint="RC, insurance, fitness and permits have never been uploaded, so nothing can be checked for expiry."
            />
          ) : (
            <>
              <span
                className={`v360-pill v360-pill--${summary.expired > 0 ? 'crit' : summary.expiring > 0 ? 'warn' : 'ok'}`}
              >
                <span className="v360-pill-dot" aria-hidden="true" />
                {summary.expired > 0
                  ? `${summary.expired} expired`
                  : summary.expiring > 0
                    ? `${summary.expiring} expiring soon`
                    : 'All current'}
              </span>
              <table className="v360-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th className="is-num">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.docType}>
                      <td>{d.docType}</td>
                      <td className="is-num">
                        {d.expiryDate ? formatDateIST(d.expiryDate) : 'no expiry recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section className="v360-card">
          <p className="v360-card-title">Why these matter</p>
          <dl className="v360-kv">
            <dt>Registration</dt>
            <dd className="is-dim">Proves the truck is yours and legally on the road</dd>
            <dt>Insurance</dt>
            <dd className="is-dim">Without it a claim cannot be filed at all</dd>
            <dt>Fitness</dt>
            <dd className="is-dim">Checked at every state border</dd>
            <dt>Permit</dt>
            <dd className="is-dim">Covers the routes this truck is allowed to run</dd>
          </dl>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}

function Trend({ data, dataKey, format }) {
  return (
    <div style={{ height: 170 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            width={58}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--line2)',
              borderRadius: 9,
              fontSize: 12,
            }}
            formatter={(v) => [format(v), '']}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="var(--erp)"
            fill="var(--erp)"
            fillOpacity={0.14}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Telemetry tab — which signals are actually arriving.
 *
 * The list only names signals this payload covers. Tyre pressure and brake
 * fluid are absent on purpose: the API has no such fields, and showing a dial
 * for a sensor that may not exist is how a fleet page starts lying.
 */
export function TelemetryPanel({ health, livePosition, history }) {
  const signals = buildSignals(health, livePosition);
  const enough = (history || []).length > 1;

  return (
    <PanelErrorBoundary name="vehicle-telemetry">
      <div className="v360-panel v360-panel--halves">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Signals</p>
            <Link to="/fleet-coverage" className="v360-link">
              Coverage →
            </Link>
          </div>
          <div className="v360-signals">
            {signals.map((s) => (
              <div key={s.name} className={`v360-signal v360-signal--${s.tone}`}>
                <span className="v360-signal-dot" aria-hidden="true" />
                <span className="v360-signal-name">{s.name}</span>
                <span className="v360-signal-state">{s.state}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Location</p>
            <Link to="/live-tracking" className="v360-link">
              Live tracking →
            </Link>
          </div>
          {livePosition ? (
            <>
              {livePosition.latitude != null ? (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <PlaceLabel lat={livePosition.latitude} lng={livePosition.longitude} />
                </div>
              ) : null}
              <dl className="v360-kv">
                <dt>Region</dt>
                <dd>{livePosition.state || '—'}</dd>
                <dt>Speed</dt>
                <dd>
                  {livePosition.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}
                </dd>
                <dt>Last event</dt>
                <dd className="is-dim">
                  {livePosition.eventDateTime
                    ? `${formatDateTimeIST(livePosition.eventDateTime)} · ${timeAgo(livePosition.eventDateTime)}`
                    : '—'}
                </dd>
              </dl>
            </>
          ) : (
            <Empty
              title="No live position"
              hint="Positions appear once live tracking polls this vehicle."
            />
          )}
        </section>

        <section className="v360-card" style={{ gridColumn: '1 / -1' }}>
          <p className="v360-card-title">Odometer & engine hours</p>
          {enough ? (
            <div className="v360-panel" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
              <div>
                <p className="v360-card-lede" style={{ marginTop: 0 }}>
                  Odometer
                </p>
                <Trend data={history} dataKey="odo" format={(v) => formatKm(v)} />
              </div>
              <div>
                <p className="v360-card-lede" style={{ marginTop: 0 }}>
                  Engine hours
                </p>
                <Trend
                  data={history}
                  dataKey="engineHours"
                  format={(v) => `${formatNum(v, { decimals: 1 })} h`}
                />
              </div>
            </div>
          ) : (
            <Empty
              title="Not enough history yet"
              hint={`A trend needs at least two live-status readings in the window — ${(history || []).length === 1 ? 'only one is' : 'none are'} available.`}
            />
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}

/**
 * Driver ↔ vehicle assignment history — reuses the assignment ledger's own
 * list endpoint (`DriverVehicleAssignmentService`), the same one the
 * Employee page and Khata Ledger's Assignments tab already call. Not fetched
 * as part of the vehicle profile aggregate, so this tab fetches it on its own
 * only when the tab is actually opened.
 */
export function DriversPanel({ vehicleId, assignedDriver }) {
  const { data, loading, error } = useApi(
    () => DriverVehicleAssignmentService.getAssignments({ vehicleId, includePast: true }),
    [vehicleId],
    { enabled: Boolean(vehicleId) },
  );
  const rows = Array.isArray(data) ? data : data?.results || data?.items || [];

  return (
    <PanelErrorBoundary name="vehicle-drivers">
      <div className="v360-panel v360-panel--single">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Drivers</p>
          </div>
          {!vehicleId ? (
            <Empty
              title="No fleet-master record"
              hint="This registration isn't in the fleet master, so assignments can't be resolved."
            />
          ) : loading && !data ? (
            <Empty title="Loading assignment history…" />
          ) : error ? (
            <Empty
              title="Could not load assignments"
              hint="This vehicle may not have driver assignments enabled for this organization."
            />
          ) : rows.length === 0 ? (
            <Empty
              title="No assignments on record"
              hint="Nobody has been assigned to this vehicle yet."
            />
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th className="is-num">Start</th>
                  <th className="is-num">End</th>
                  <th className="is-num">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const driverName = [a.driverId?.firstName, a.driverId?.lastName]
                    .filter(Boolean)
                    .join(' ');
                  const isCurrent =
                    assignedDriver &&
                    String(a.driverId?._id || a.driverId) === String(assignedDriver.id);
                  return (
                    <tr key={a._id}>
                      <td>
                        {driverName || '—'}
                        {isCurrent ? ' (current)' : ''}
                      </td>
                      <td>{a.driverId?.mobileNumber || '—'}</td>
                      <td className="is-num">{a.startDate ? formatDateIST(a.startDate) : '—'}</td>
                      <td className="is-num">{a.endDate ? formatDateIST(a.endDate) : 'ongoing'}</td>
                      <td className="is-num">{a.status || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}

/** Trips are not in this payload — say so rather than render an empty table. */
export function TripsPanel() {
  return (
    <PanelErrorBoundary name="vehicle-trips">
      <div className="v360-panel v360-panel--single">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Trips</p>
            <Link to="/trip-management" className="v360-link">
              Trip management →
            </Link>
          </div>
          <Empty
            title="Trip history is not wired into this page yet"
            hint="The trips API is vehicle-scoped and ready; this tab needs to be pointed at it. Until then, open trip management for the fleet-wide list."
          />
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
