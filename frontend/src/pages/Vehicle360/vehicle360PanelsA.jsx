import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatINR, formatKm, formatLitres, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import {
  buildDueItems,
  distanceInWindow,
  dailyDistances,
  daysSince,
  documentSummary,
  serviceState,
} from './vehicle360Logic';
import { Ring } from './vehicle360Header';

/**
 * Overview panel — "can this truck earn today, and what is stopping it".
 * Three cards: how much it has run, what it owes, and what it has burned.
 */

function CardHead({ title, action }) {
  return (
    <div className="v360-card-head">
      <p className="v360-card-title">{title}</p>
      {action}
    </div>
  );
}

/**
 * Utilisation from the odometer history — the difference between the first and
 * last CAN reading we hold. Deliberately not an estimate: with fewer than two
 * readings the card says so instead of implying the truck sat still.
 */
function UtilisationCard({ history, health, onGoTrips }) {
  const travelled = distanceInWindow(history);
  const silentDays = daysSince(health?.pulledAt);
  const readings = (history || []).length;

  return (
    <section className="v360-card">
      <CardHead
        title="Utilisation"
        action={
          <button type="button" className="v360-link" onClick={onGoTrips}>
            Trip history →
          </button>
        }
      />

      {travelled == null ? (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">—</span>
            <span className="v360-figure-note">no distance can be derived</span>
          </p>
          <div className="v360-empty">
            <span className="v360-empty-title">
              {readings === 1 ? 'Only one odometer reading' : 'No odometer history'}
            </span>
            <span className="v360-empty-hint">
              Distance travelled is the gap between two CAN readings. With{' '}
              {readings === 1 ? 'a single reading' : 'none'} in the window there is nothing to
              subtract.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatKm(travelled)}</span>
            <span
              className={`v360-figure-note ${travelled === 0 ? 'v360-figure-note--crit' : ''}`.trim()}
            >
              in the telemetry window
            </span>
          </p>
          <p className="v360-card-lede">
            {travelled === 0
              ? `No movement recorded across ${formatNum(readings)} readings. The truck has been earning nothing.`
              : `Derived from ${formatNum(readings)} CAN odometer readings.`}
            {silentDays != null && silentDays >= 1
              ? ` Last reading ${timeAgo(health.pulledAt)}.`
              : ''}
          </p>
        </>
      )}
    </section>
  );
}

/** Every open obligation on the vehicle, worst first — the "Reminders" list. */
function WhatIsDueCard({ prediction, documents, health, onGoTab }) {
  const items = buildDueItems({ prediction, documents, health });
  const worst = items[0]?.tone;

  return (
    <section className={`v360-card ${worst === 'red' ? 'v360-card--alert' : ''}`.trim()}>
      <CardHead title="Reminders" />
      {items.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">Nothing outstanding</span>
          <span className="v360-empty-hint">
            No overdue service, no document gaps, and telemetry is current.
          </span>
        </div>
      ) : (
        <div className="v360-due">
          {items.map((d) => (
            <div key={d.id} className={`v360-due-item v360-due-item--${d.tone}`}>
              <span className="v360-due-dot" aria-hidden="true" />
              <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span className="v360-due-title">{d.title}</span>
                <span className="v360-due-detail">{d.detail}</span>
                <button
                  type="button"
                  className="v360-link v360-due-cta"
                  onClick={() => onGoTab(d.tab)}
                >
                  {d.cta} →
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Recent fills, with each fill's size drawn relative to the biggest one. */
function FuelCard({ recentFuelLogs, onGoFuel }) {
  const logs = recentFuelLogs || [];
  const max = logs.reduce((m, l) => Math.max(m, Number(l.litres) || 0), 0);
  const total = logs.reduce((s, l) => s + (Number(l.totalAmount) || 0), 0);

  return (
    <section className="v360-card">
      <CardHead
        title="Fuel"
        action={
          <button type="button" className="v360-link" onClick={onGoFuel}>
            Fuel history →
          </button>
        }
      />
      {logs.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No fuel logs</span>
          <span className="v360-empty-hint">
            Uploaded fuel bills for this vehicle appear here once they are processed.
          </span>
        </div>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatLitres(logs[0].litres)}</span>
            <span className="v360-figure-note">last fill · {formatINR(logs[0].totalAmount)}</span>
          </p>
          <p className="v360-card-lede">
            {formatNum(logs.length)} fill{logs.length === 1 ? '' : 's'} on record ·{' '}
            {formatINR(total)} total.
          </p>
          <div className="v360-fills">
            {logs.map((l) => (
              <div key={l.id} className="v360-fill">
                <span className="v360-fill-date">{formatDateIST(l.refuelTime)}</span>
                <span className="v360-fill-bar" aria-hidden="true">
                  <span
                    style={{ width: max ? `${((Number(l.litres) || 0) / max) * 100}%` : '0%' }}
                  />
                </span>
                <span className="v360-fill-amount">{formatLitres(l.litres)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Who is driving this vehicle today. No photo field exists on `User`, so this
 * shows initials rather than a fabricated headshot — same rule as the rest of
 * this page: draw what the API actually reports.
 */
function DriverCard({ assignedDriver, fleetMaster, fleetEdge, health, livePosition }) {
  const tags = [fleetMaster?.vehicleType, fleetEdge?.fuelType].filter(Boolean);

  return (
    <section className="v360-card" style={{ gridColumn: '1 / span 2' }}>
      <CardHead title="Driver" />
      {!assignedDriver ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No driver currently assigned</span>
          <span className="v360-empty-hint">
            Assign a driver from Driver ↔ Vehicle Assignments to see them here.
          </span>
        </div>
      ) : (
        <div className="v360-driver">
          <span className="v360-driver-avatar" aria-hidden="true">
            {initials(assignedDriver.name) || '?'}
          </span>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <p className="v360-driver-name">{assignedDriver.name || 'Unnamed driver'}</p>
            <p className="v360-card-lede" style={{ margin: '2px 0 0' }}>
              {[
                assignedDriver.mobileNumber,
                assignedDriver.group ? `Group: ${assignedDriver.group}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'No contact details on record'}
            </p>
            {tags.length ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span key={t} className="v360-pill v360-pill--grey">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <dl className="v360-kv" style={{ flex: '0 0 auto' }}>
            <dt>Model</dt>
            <dd>{fleetEdge?.vehicleModel || fleetMaster?.model || '—'}</dd>
            <dt>ODD</dt>
            <dd>{health?.canOdo != null ? formatKm(health.canOdo) : '—'}</dd>
            <dt>Runtime</dt>
            <dd>
              {health?.engineRunHour != null
                ? `${formatNum(health.engineRunHour, { decimals: 1 })} h`
                : '—'}
            </dd>
            <dt>Speed</dt>
            <dd>{livePosition?.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}</dd>
          </dl>
        </div>
      )}
    </section>
  );
}

/** dt/dd pair for InfoCard — a component so key can attach outside the fragment. */
function InfoRow({ docType, expiryDate }) {
  return (
    <>
      <dt>{docType}</dt>
      <dd>{expiryDate ? formatDateIST(expiryDate) : 'no expiry recorded'}</dd>
    </>
  );
}

/**
 * Compact document list — the same rows `DocumentsPanel` shows on the
 * Documents tab, just capped and linked out rather than duplicating the
 * upload/manage flow here.
 */
function InfoCard({ documents, onGoDocuments }) {
  const rows = documents || [];
  const summary = documentSummary(rows);

  return (
    <section className="v360-card">
      <CardHead
        title="Info"
        action={
          <button type="button" className="v360-link" onClick={onGoDocuments}>
            Manage →
          </button>
        }
      />
      {rows.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No documents on record</span>
          <span className="v360-empty-hint">
            RC, insurance, fitness and permits appear here once uploaded.
          </span>
        </div>
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
          <dl className="v360-kv">
            {rows.slice(0, 4).map((d) => (
              <InfoRow key={d.docType} docType={d.docType} expiryDate={d.expiryDate} />
            ))}
          </dl>
        </>
      )}
    </section>
  );
}

/** Distance travelled per reading over the telemetry window — the "Activity" chart. */
function ActivityCard({ history }) {
  const series = dailyDistances(history);
  const travelled = distanceInWindow(history);

  return (
    <section className="v360-card" style={{ gridColumn: '1 / span 2' }}>
      <CardHead title="Activity" />
      {!series ? (
        <div className="v360-empty">
          <span className="v360-empty-title">Not enough history yet</span>
          <span className="v360-empty-hint">
            A trend needs at least two odometer readings in the window.
          </span>
        </div>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatKm(travelled)}</span>
            <span className="v360-figure-note">travelled in the telemetry window</span>
          </p>
          <div style={{ height: 170, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--line2)',
                    borderRadius: 9,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatKm(v), 'distance']}
                />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="var(--erp)"
                  fill="var(--erp)"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}

/** "Last check-in" donut — the service-interval ring, restyled with the odometer it was last serviced at. */
function ServicesCard({ prediction }) {
  const svc = serviceState(prediction);
  return (
    <section className="v360-card">
      <CardHead title="Services" />
      <Ring
        pct={svc.overdue ? 1 : svc.level === 'none' ? 0 : 0.6}
        dashed={svc.level === 'none'}
        stroke={svc.overdue ? 'var(--red)' : svc.level === 'none' ? 'var(--grey)' : 'var(--green)'}
        ink={svc.overdue ? 'var(--red-ink)' : 'var(--ink3)'}
        big={
          prediction?.lastServiceOdometer != null ? formatKm(prediction.lastServiceOdometer) : '—'
        }
        label="Last check-in"
        sub={
          prediction?.lastServiceOdometer != null
            ? 'odometer at last service'
            : 'no service record yet'
        }
      />
    </section>
  );
}

export function OverviewPanel({
  history,
  health,
  livePosition,
  prediction,
  documents,
  recentFuelLogs,
  assignedDriver,
  fleetMaster,
  fleetEdge,
  onGoTab,
}) {
  return (
    <PanelErrorBoundary name="vehicle-overview">
      <div className="v360-panel">
        <UtilisationCard history={history} health={health} onGoTrips={() => onGoTab('trips')} />
        <WhatIsDueCard
          prediction={prediction}
          documents={documents}
          health={health}
          onGoTab={onGoTab}
        />
        <FuelCard recentFuelLogs={recentFuelLogs} onGoFuel={() => onGoTab('fuel')} />
        <DriverCard
          assignedDriver={assignedDriver}
          fleetMaster={fleetMaster}
          fleetEdge={fleetEdge}
          health={health}
          livePosition={livePosition}
        />
        <ServicesCard prediction={prediction} />
        <ActivityCard history={history} />
        <InfoCard documents={documents} onGoDocuments={() => onGoTab('documents')} />
      </div>
    </PanelErrorBoundary>
  );
}
