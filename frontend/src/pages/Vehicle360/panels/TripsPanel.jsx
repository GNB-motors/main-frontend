import { Link } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatKm, formatNum } from '../../../utils/formatters';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { tourStops, formatStopTime } from '../../ErpTrips/detail/laneFactsModel';
import Empty from './Empty';
import {
  DASH,
  pickCurrentTour,
  sortTrips,
  tripKm,
  tripRoute,
  tripStatusTone,
  tripTime,
  tourSummary,
} from './vehicleTripsModel';

/**
 * Trips tab — the truck's own running, read from the two sources that
 * describe it: the detected trip (plant → plant) and the tour, the
 * warehouse-to-warehouse cycle the trip sits inside.
 *
 * The tour is the honest unit of distance. An open cycle carries no distance
 * yet — a half-finished cycle is not a measurable number — so it is shown as
 * a position with "not measured until the cycle closes", never as 0 km.
 */
export default function TripsPanel({ vehicleId, registrationNumber }) {
  const trips$ = useApi(
    (signal) => FleetDataService.getAutoTrips({ vehicleId, limit: 20 }, signal),
    [vehicleId],
    { enabled: Boolean(vehicleId) },
  );
  const tours$ = useApi(
    (signal) => FleetDataService.getVehicleTours({ vehicleId, limit: 10 }, signal),
    [vehicleId],
    { enabled: Boolean(vehicleId) },
  );

  const trips = sortTrips(trips$.data?.items);
  const tour = pickCurrentTour(tours$.data?.tours);
  const stops = tourStops(tour);
  const summary = tourSummary(tour, stops);

  return (
    <PanelErrorBoundary name="vehicle-trips">
      <div className="v360-panel v360-panel--halves">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Live cycle</p>
            <Link to="/trip-management" className="v360-link">
              Trip management →
            </Link>
          </div>

          {!vehicleId ? (
            <Empty
              title="No vehicle id on this record"
              hint="Trips are looked up by vehicle id, and this registration is not on the fleet master."
            />
          ) : tours$.error ? (
            <Empty
              title="Couldn't load the cycle"
              hint={tours$.error?.message || 'The tours API did not answer.'}
            />
          ) : tour ? (
            <>
              <span className="v360-pill v360-pill--warn">
                <span className="v360-pill-dot" aria-hidden="true" />
                Out now
              </span>

              <p className="v360-figure">
                <span className="v360-figure-value">
                  {summary.from || DASH} {summary.to ? `→ ${summary.to}` : ''}
                </span>
                <span className="v360-figure-note">
                  {summary.startedAt
                    ? `left ${formatDateTimeIST(summary.startedAt)}`
                    : 'start time not recorded'}
                </span>
              </p>

              <dl className="v360-kv">
                <dt>Distance so far</dt>
                <dd className={summary.km == null ? 'is-dim' : undefined}>
                  {summary.km == null ? `${DASH} · ${summary.kmReason}` : formatKm(summary.km)}
                </dd>
                <dt>Laden</dt>
                <dd>{summary.ladenKm == null ? DASH : formatKm(summary.ladenKm)}</dd>
                <dt>Empty</dt>
                <dd>{summary.emptyKm == null ? DASH : formatKm(summary.emptyKm)}</dd>
                <dt>Legs</dt>
                <dd>{formatNum(summary.legs)}</dd>
              </dl>

              {stops.length ? (
                <table className="v360-table">
                  <thead>
                    <tr>
                      <th>Leg</th>
                      <th>Left</th>
                      <th>Arrived</th>
                      <th className="is-num">Km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((leg, index) => (
                      <tr key={`${leg.from}-${leg.to}-${index}`}>
                        <td>
                          {leg.from} → {leg.to}
                        </td>
                        <td>{formatStopTime(leg.departedAt) || DASH}</td>
                        <td>{formatStopTime(leg.arrivedAt) || DASH}</td>
                        <td className="is-num">{leg.km == null ? DASH : formatKm(leg.km)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="v360-card-lede">
                  The cycle is open but no leg has been resolved yet — the yard this truck left
                  from has not been confirmed.
                </p>
              )}
            </>
          ) : (
            <Empty
              title="Parked — no open cycle"
              hint="A cycle opens when the truck leaves a yard and closes when it comes back. Nothing is open right now."
            />
          )}
        </section>

        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Recent trips</p>
            <Link to="/trip-management" className="v360-link">
              Trip management →
            </Link>
          </div>

          {trips$.error ? (
            <Empty
              title="Couldn't load trips"
              hint={trips$.error?.message || 'The auto-trips API did not answer.'}
            />
          ) : !trips.length ? (
            <Empty
              title="No detected trip yet"
              hint="Trips are detected from GPS stops and confirmed pickup/drop places — they are never declared by hand."
            />
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>When</th>
                  <th className="is-num">Km</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const route = tripRoute(trip);
                  const km = tripKm(trip);
                  return (
                    <tr key={trip._id || `${route.from}-${route.to}-${tripTime(trip)}`}>
                      <td>
                        {route.from || DASH} → {route.to || DASH}
                      </td>
                      <td>
                        {trip.pickup?.departedAt
                          ? formatDateTimeIST(trip.pickup.departedAt)
                          : DASH}
                      </td>
                      <td className="is-num">{km.total == null ? DASH : formatKm(km.total)}</td>
                      <td>
                        <span className={`v360-pill v360-pill--${tripStatusTone(trip.status)}`}>
                          {String(trip.status || 'UNKNOWN').replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="v360-card" style={{ gridColumn: '1 / -1' }}>
          <p className="v360-card-title">How this was worked out</p>
          <p className="v360-card-lede">
            A trip is a plant-to-plant run detected from GPS stops and confirmed pickup and
            drop places. The cycle above is the warehouse-to-warehouse tour that contains it —
            the truck may run several trips before it comes home.
          </p>
          <dl className="v360-kv">
            <dt>Vehicle</dt>
            <dd className="is-dim">{registrationNumber || DASH}</dd>
            <dt>Trips read</dt>
            <dd>{formatNum(trips.length)}</dd>
            <dt>Cycle status</dt>
            <dd className="is-dim">{tour ? 'open' : 'closed'}</dd>
          </dl>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
