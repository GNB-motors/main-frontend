import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { formatINR, formatKm, formatNum, formatPct } from '../../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../../utils/dateUtils';
import Empty from './Empty';
import {
  DASH,
  centreRows,
  pickPrediction,
  pickTyreRow,
  predictionFacts,
  riskTone,
  tyreBandTone,
  tyreFacts,
} from './serviceInsightsModel';

/**
 * The three service questions the vehicle page was missing: what is left of
 * the tyres, where the nearest workshop is by road, and what the predictive
 * sweep says about the next service.
 *
 * Each answer comes from its own endpoint and is read defensively — a figure
 * that was never measured prints as a dash with the reason beside it.
 */

/** Tyres: km run on the set, its cost per km, and how much life is left. */
export function TyreStatusCard({ vehicleId, registrationNumber }) {
  const tyres$ = useApi(
    (signal) => FleetDataService.getTyreStatus({ vehicleId, registrationNumber }, signal),
    [vehicleId, registrationNumber],
    { enabled: Boolean(vehicleId || registrationNumber) },
  );

  const facts = tyreFacts(pickTyreRow(tyres$.data, { vehicleId, registrationNumber }));

  return (
    <section className="v360-card">
      <p className="v360-card-title">Tyres</p>

      {tyres$.error ? (
        <Empty
          title="Couldn't load tyre status"
          hint={tyres$.error?.message || 'The tyres API did not answer.'}
        />
      ) : !facts ? (
        <Empty
          title="No tyre set on record"
          hint="A tyre set is fitted from the tyre-management screen; until then there is nothing to cost per km."
        />
      ) : (
        <>
          <span className={`v360-pill v360-pill--${tyreBandTone(facts.band)}`}>
            <span className="v360-pill-dot" aria-hidden="true" />
            {facts.band ? String(facts.band).replace(/_/g, ' ').toLowerCase() : 'band unknown'}
          </span>

          <dl className="v360-kv">
            <dt>Km run on this set</dt>
            <dd>{facts.kmRun == null ? DASH : formatKm(facts.kmRun)}</dd>
            <dt>Cost per km</dt>
            <dd className={facts.costPerKm == null ? 'is-dim' : undefined}>
              {facts.costPerKm == null
                ? `${DASH} · ${facts.costPerKmReason}`
                : `${formatINR(facts.costPerKm, { decimals: 2 })}/km`}
            </dd>
            <dt>Life used</dt>
            <dd className={facts.lifeUsed == null ? 'is-dim' : undefined}>
              {facts.lifeUsed == null
                ? `${DASH} · ${facts.lifeUsedReason}`
                : formatPct(facts.lifeUsed)}
            </dd>
            <dt>Remaining</dt>
            <dd className={facts.remaining == null ? 'is-dim' : undefined}>
              {facts.remaining == null
                ? `${DASH} · ${facts.remainingReason}`
                : formatKm(facts.remaining)}
            </dd>
            <dt>Running a day</dt>
            <dd className={facts.perDay == null ? 'is-dim' : undefined}>
              {facts.perDay == null
                ? `${DASH} · ${facts.perDayReason}`
                : `${formatNum(facts.perDay)} km/day`}
            </dd>
            <dt>Odometer</dt>
            <dd className={facts.odometer == null ? 'is-dim' : undefined}>
              {facts.odometer == null
                ? `${DASH} · ${facts.odometerReason}`
                : formatKm(facts.odometer)}
              {facts.source ? <span className="is-dim"> · {String(facts.source).toLowerCase()}</span> : null}
            </dd>
            <dt>Replacement projected</dt>
            <dd className={facts.projectedReplacementDate ? undefined : 'is-dim'}>
              {facts.projectedReplacementDate
                ? formatDateIST(facts.projectedReplacementDate)
                : `${DASH} · ${facts.projectedReplacementReason}`}
            </dd>
            {facts.tyreCount != null ? (
              <>
                <dt>Tyres on the set</dt>
                <dd>{formatNum(facts.tyreCount)}</dd>
              </>
            ) : null}
          </dl>
        </>
      )}
    </section>
  );
}

/** The nearest workshops, costed by our road engine from where the truck is. */
export function ServiceCentreCard({ vehicleId, livePosition }) {
  const lat = livePosition?.latitude;
  const lng = livePosition?.longitude;
  const hasFix = lat != null && lng != null;

  const centres$ = useApi(
    (signal) => FleetDataService.getServiceCentres({ lat, lng, vehicleId, limit: 8 }, signal),
    [lat, lng, vehicleId],
    { enabled: hasFix },
  );

  const rows = centreRows(centres$.data?.candidates);
  const uncosted = centreRows(centres$.data?.uncosted);

  return (
    <section className="v360-card">
      <p className="v360-card-title">Nearest service centres</p>

      {!hasFix ? (
        <Empty
          title="No live position"
          hint="Road distance is measured from where the truck is standing, so it needs a live GPS fix."
        />
      ) : centres$.error ? (
        <Empty
          title="Couldn't load service centres"
          hint={centres$.error?.message || 'The service-centres API did not answer.'}
        />
      ) : !rows.length && !uncosted.length ? (
        <Empty
          title="No service centre on file"
          hint={
            centres$.data?.coverage ||
            'That is not the same as there being none on the ground — we only list the ones in our data.'
          }
        />
      ) : (
        <>
          {centres$.data?.coverage ? (
            <p className="v360-card-lede">{centres$.data.coverage}</p>
          ) : null}

          {rows.length ? (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th className="is-num">Road</th>
                  <th className="is-num">Drive</th>
                  <th className="is-num">Detour</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id || row.name}>
                    <td>
                      {row.name || DASH}
                      {row.brand ? <span className="is-dim"> · {row.brand}</span> : null}
                      {row.phone ? <div className="is-dim">{row.phone}</div> : null}
                      {row.roadReason ? <div className="is-dim">{row.roadReason}</div> : null}
                    </td>
                    <td className="is-num">{row.roadKm == null ? DASH : formatKm(row.roadKm)}</td>
                    <td className="is-num">
                      {row.roadMinutes == null ? DASH : `${formatNum(row.roadMinutes)} min`}
                    </td>
                    <td className="is-num">{row.detourKm == null ? DASH : formatKm(row.detourKm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {uncosted.length ? (
            <>
              <p className="v360-card-lede" style={{ marginTop: 12 }}>
                Also nearby, but we could not cost the road to them:
              </p>
              <table className="v360-table">
                <thead>
                  <tr>
                    <th>Centre</th>
                    <th>Why</th>
                  </tr>
                </thead>
                <tbody>
                  {uncosted.map((row) => (
                    <tr key={row.id || row.name}>
                      <td>
                        {row.name || DASH}
                        {row.brand ? <span className="is-dim"> · {row.brand}</span> : null}
                      </td>
                      <td className="is-dim">{row.reasons.join('; ') || 'no road distance on record'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

/** The predictive sweep's row for this vehicle. */
export function MaintenanceSweepCard({ registrationNumber }) {
  const sweep$ = useApi(
    (signal) => FleetDataService.getMaintenancePredictions({}, signal),
    [],
  );

  const facts = predictionFacts(pickPrediction(sweep$.data?.records, registrationNumber));

  return (
    <section className="v360-card">
      <p className="v360-card-title">Service sweep</p>

      {sweep$.error ? (
        <Empty
          title="Couldn't load the sweep"
          hint={sweep$.error?.message || 'The maintenance-predictions API did not answer.'}
        />
      ) : !facts ? (
        <Empty
          title="No forecast for this vehicle"
          hint="The sweep writes a row once the vehicle has enough odometer history to project from."
        />
      ) : (
        <>
          <span className={`v360-pill v360-pill--${riskTone(facts.risk)}`}>
            <span className="v360-pill-dot" aria-hidden="true" />
            {facts.risk ? String(facts.risk).replace(/_/g, ' ').toLowerCase() : 'risk unknown'}
          </span>

          <dl className="v360-kv">
            <dt>Days until due</dt>
            <dd className={facts.days == null ? 'is-dim' : undefined}>
              {facts.days == null ? `${DASH} · ${facts.daysReason}` : formatNum(facts.days)}
            </dd>
            <dt>Km until due</dt>
            <dd className={facts.km == null ? 'is-dim' : undefined}>
              {facts.km == null ? `${DASH} · ${facts.kmReason}` : formatKm(facts.km)}
            </dd>
            <dt>Projected due</dt>
            <dd className={facts.dueDate ? undefined : 'is-dim'}>
              {facts.dueDate ? formatDateIST(facts.dueDate) : `${DASH} · ${facts.dueDateReason}`}
            </dd>
            <dt>Projected due odometer</dt>
            <dd className={facts.dueOdo == null ? 'is-dim' : undefined}>
              {facts.dueOdo == null ? `${DASH} · ${facts.dueOdoReason}` : formatKm(facts.dueOdo)}
            </dd>
            <dt>Current odometer</dt>
            <dd className={facts.currentOdo == null ? 'is-dim' : undefined}>
              {facts.currentOdo == null
                ? `${DASH} · ${facts.currentOdoReason}`
                : formatKm(facts.currentOdo)}
            </dd>
            <dt>Running a day</dt>
            <dd className={facts.perDay == null ? 'is-dim' : undefined}>
              {facts.perDay == null
                ? `${DASH} · ${facts.perDayReason}`
                : `${formatNum(facts.perDay)} km/day`}
            </dd>
            {facts.lastServiceAt ? (
              <>
                <dt>Last service</dt>
                <dd>
                  {formatDateIST(facts.lastServiceAt)}
                  {facts.lastServiceOdometer != null
                    ? ` at ${formatKm(facts.lastServiceOdometer)}`
                    : ''}
                </dd>
              </>
            ) : null}
            {facts.basis ? (
              <>
                <dt>Basis</dt>
                <dd className="is-dim">{String(facts.basis).replace(/_/g, ' ').toLowerCase()}</dd>
              </>
            ) : null}
            {facts.computedAt ? (
              <>
                <dt>Computed</dt>
                <dd className="is-dim">{formatDateTimeIST(facts.computedAt)}</dd>
              </>
            ) : null}
          </dl>
        </>
      )}
    </section>
  );
}

export default function ServiceInsights(props) {
  return (
    <>
      <TyreStatusCard {...props} />
      <ServiceCentreCard {...props} />
      <MaintenanceSweepCard {...props} />
    </>
  );
}
