import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatINR, formatKm, formatLitres, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { buildDueItems, distanceInWindow, daysSince } from './vehicle360Logic';

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

/** Every open obligation on the vehicle, worst first. */
function WhatIsDueCard({ prediction, documents, health, onGoTab }) {
  const items = buildDueItems({ prediction, documents, health });
  const worst = items[0]?.tone;

  return (
    <section className={`v360-card ${worst === 'red' ? 'v360-card--alert' : ''}`.trim()}>
      <CardHead title="What is due" />
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

export function OverviewPanel({ history, health, prediction, documents, recentFuelLogs, onGoTab }) {
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
      </div>
    </PanelErrorBoundary>
  );
}
