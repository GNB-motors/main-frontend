import { useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import DataTooltip from '../../../components/ui/DataTooltip';
import { formatKm, formatNum } from '../../../utils/formatters';
import { formatDateTimeIST, formatDateIST } from '../../../utils/dateUtils';
import { tourStops } from '../../ErpTrips/detail/laneFactsModel';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import {
  pickCurrentTour,
  sortTrips,
  tripKm,
  tripRoute,
  tripTime,
  tourSummary,
} from './vehicleTripsModel';
import './overview/referenceOverview.css';
import './vehicleTrips.css';

const MANAGEMENT = '/trip-management';
const complete = (trip) => ['COMPLETE', 'CONFIRMED'].includes(trip.status);
const category = (trip) =>
  complete(trip)
    ? 'complete'
    : trip.status === 'OPEN'
      ? 'open'
      : trip.status === 'NEEDS_REVIEW'
        ? 'review'
        : 'other';
const statusLabel = (trip) =>
  ({ complete: 'Complete', open: 'Open', review: 'Needs review' })[category(trip)] ||
  String(trip.status || 'Unknown')
    .replace(/_/g, ' ')
    .toLowerCase();
const stamp = (value) =>
  value && Number.isFinite(new Date(value).getTime()) ? new Date(value).getTime() : null;

export default function TripsPanel({ vehicleId, registrationNumber }) {
  const [filter, setFilter] = useState('all');
  const trips$ = useApi(
    (signal) => FleetDataService.getAutoTrips({ vehicleId, limit: 20 }, signal),
    [vehicleId],
    { enabled: Boolean(vehicleId), scopeKey: vehicleId },
  );
  const tours$ = useApi(
    (signal) => FleetDataService.getVehicleTours({ vehicleId, limit: 10 }, signal),
    [vehicleId],
    { enabled: Boolean(vehicleId), scopeKey: vehicleId },
  );
  const trips = sortTrips(trips$.data?.items).filter(
    (trip) => !['DISMISSED', 'SUPERSEDED'].includes(trip.status),
  );
  const tour = pickCurrentTour(tours$.data?.tours);
  const stops = tourStops(tour);
  const summary = tourSummary(tour, stops);
  const filtered = trips.filter((trip) => filter === 'all' || category(trip) === filter);
  const review = trips.filter(
    (trip) => trip.status === 'NEEDS_REVIEW' || (complete(trip) && !tripRoute(trip).to),
  );
  const timed = trips.filter((trip) => tripTime(trip) != null);
  const end = Date.now();
  const start = Math.min(end - 86400000, ...timed.map(tripTime));
  const span = end - start;
  const distances = trips.map((trip) => tripKm(trip).total).filter((value) => value != null);
  const total = distances.length ? distances.reduce((sum, value) => sum + value, 0) : null;
  const error = trips$.error || tours$.error;
  return (
    <PanelErrorBoundary name="vehicle-trips">
      <div className="vdo-overview vtrips">
        {!vehicleId ? (
          <section className="vdo-card">
            <h3>No fleet-master vehicle record</h3>
            <p>A vehicle record is needed to resolve trips and cycles.</p>
          </section>
        ) : (
          <div className="vtrips-columns">
            {tours$.loading && !tours$.data ? (
              <OverviewCardSkeleton />
            ) : (
              <section className="vdo-card vtrips-cycle">
                <div className="vtrips-head">
                  <div>
                    <h3>Live cycle</h3>
                    <span className={`vtrips-status vtrips-status--${tour ? 'open' : 'other'}`}>
                      {tours$.error ? 'Cycle unavailable' : tour ? 'Open cycle' : 'No open cycle'}
                    </span>
                  </div>
                  <Link to={MANAGEMENT}>Trip management →</Link>
                </div>
                <div className="vtrips-headline">
                  <small>{tour ? 'Current route' : 'Cycle standing'}</small>
                  <strong>
                    {tours$.error
                      ? 'Couldn’t load cycle'
                      : tour
                        ? `${summary.from || 'Origin unresolved'}${summary.to ? ` → ${summary.to}` : ''}`
                        : 'No open cycle'}
                  </strong>
                  <p>
                    {tour && summary.startedAt
                      ? `Started ${formatDateTimeIST(summary.startedAt)}`
                      : 'An open cycle is recorded when the truck leaves a confirmed base.'}
                  </p>
                </div>
                {tour ? (
                  <div className="vtrips-cycle-facts">
                    {[
                      [
                        'Cycle distance',
                        summary.km == null ? 'Not measured yet' : formatKm(summary.km),
                      ],
                      ['Laden', summary.ladenKm == null ? '—' : formatKm(summary.ladenKm)],
                      ['Empty', summary.emptyKm == null ? '—' : formatKm(summary.emptyKm)],
                      ['Resolved legs', formatNum(stops.length)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <small>{label}</small>
                        <b>{value}</b>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="vtrips-timeline-block">
                  <small>
                    Recent records · {trips.length} trips
                    {total != null ? ` · ${formatKm(total)} measured` : ''}
                  </small>
                  <div className="vtrips-timeline">
                    <div className="vtrips-timeline-track" />
                    {timed.map((trip, index) => {
                      const left = Math.max(
                        0,
                        Math.min(99, ((tripTime(trip) - start) / span) * 100),
                      );
                      const ended = stamp(trip.drop?.arrivedAt || trip.completedAt);
                      const width =
                        ended != null && ended > tripTime(trip)
                          ? Math.min(100 - left, ((ended - tripTime(trip)) / span) * 100)
                          : null;
                      const route = tripRoute(trip);
                      return (
                        <button
                          key={trip._id || index}
                          className={`vtrips-timeline-bar vtrips-timeline-bar--${category(trip)}`}
                          style={{ left: `${left}%`, width: width != null ? `${width}%` : '6px' }}
                          aria-label={`${route.from || 'Unknown pickup'} to ${route.to || 'No drop'} · ${statusLabel(trip)}`}
                        >
                          <DataTooltip
                            className={`vtrips-tooltip${left > 50 ? ' vtrips-tooltip--end' : ''}`}
                            aria-hidden="true"
                            label={statusLabel(trip)}
                            value={tripKm(trip).total == null ? '—' : formatKm(tripKm(trip).total)}
                            details={[
                              `${route.from || 'Unknown pickup'} → ${route.to || 'No drop'}`,
                              formatDateTimeIST(tripTime(trip)),
                            ]}
                          />
                        </button>
                      );
                    })}
                    <i />
                  </div>
                  <div className="vtrips-ticks">
                    {[0, 0.25, 0.5, 0.75, 1].map((part) => (
                      <span key={part}>
                        {part === 1 ? 'Today' : formatDateIST(new Date(start + span * part))}
                      </span>
                    ))}
                  </div>
                  <div className="vtrips-legend">
                    <span>● Complete</span>
                    <span>◌ Needs review</span>
                    <span>● Open</span>
                  </div>
                </div>
                <div className="vtrips-insight">
                  <span className="vtrips-eyebrow">✧ Records to review</span>
                  {error ? (
                    <p>Some trip or cycle records could not be loaded.</p>
                  ) : review.length ? (
                    <>
                      <p>{review.length} recent records need review or have no confirmed drop.</p>
                      {review.slice(0, 3).map((trip, index) => (
                        <div className="vtrips-review" key={trip._id || index}>
                          <span>
                            {tripRoute(trip).from || 'Pickup unresolved'}
                            <small>
                              {!tripRoute(trip).to ? 'Drop place not recorded' : statusLabel(trip)}
                            </small>
                          </span>
                          <Link to={MANAGEMENT}>Review →</Link>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>
                      {trips.length
                        ? 'No review flags or missing drops in the loaded records.'
                        : 'No trip records available to review.'}
                    </p>
                  )}
                </div>
                <Link className="vtrips-button" to={MANAGEMENT}>
                  Open trip management →
                </Link>
              </section>
            )}
            {trips$.loading && !trips$.data ? (
              <OverviewCardSkeleton />
            ) : (
              <section className="vdo-card vtrips-recent">
                <div className="vtrips-head">
                  <h3>Recent trips</h3>
                  <Link to={MANAGEMENT}>Trip management →</Link>
                </div>
                <div className="vtrips-filters" role="group" aria-label="Filter trips">
                  {[
                    ['all', 'All'],
                    ['review', 'Needs review'],
                    ['complete', 'Complete'],
                    ['open', 'Open'],
                  ].map(([key, label]) => (
                    <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                      {label}{' '}
                      <span>
                        {trips.filter((trip) => key === 'all' || category(trip) === key).length}
                      </span>
                    </button>
                  ))}
                </div>
                {trips$.error ? (
                  <p className="vtrips-empty">Couldn’t load trips. Please try again.</p>
                ) : !filtered.length ? (
                  <p className="vtrips-empty">
                    No {filter === 'all' ? 'recent' : filter === 'review' ? 'review' : filter} trips
                    in the loaded records.
                  </p>
                ) : (
                  <div className="vtrips-table-wrap">
                    <table className="vtrips-table">
                      <thead>
                        <tr>
                          <th>Trip</th>
                          <th>Started</th>
                          <th>Distance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((trip, index) => {
                          const route = tripRoute(trip);
                          const distance = tripKm(trip).total;
                          return (
                            <tr key={trip._id || index}>
                              <td>
                                <span>{route.from || 'Unknown pickup'}</span>{' '}
                                <span className="vtrips-arrow">→</span>{' '}
                                {route.to || <span className="vtrips-no-drop">No drop</span>}
                              </td>
                              <td>
                                {tripTime(trip) != null ? formatDateTimeIST(tripTime(trip)) : '—'}
                              </td>
                              <td>{distance == null ? '—' : formatKm(distance)}</td>
                              <td>
                                <span className={`vtrips-status vtrips-status--${category(trip)}`}>
                                  {statusLabel(trip)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
        <section className="vdo-card">
          <h3>How this was worked out</h3>
          <p>
            A trip is a plant-to-plant run detected from GPS stops and matched pickup and drop
            places. A cycle is the base-to-base tour containing those runs.
          </p>
          <div className="vtrips-process">
            {['GPS stops', 'Pickup & drop matched', 'Trip', 'Cycle · base to base'].map(
              (label, index) => (
                <span key={label}>
                  {index ? <i>→</i> : null}
                  <b>{label}</b>
                </span>
              ),
            )}
          </div>
          <div className="vtrips-facts">
            {[
              ['Vehicle', registrationNumber || '—'],
              ['Trips loaded', trips$.error ? 'Unavailable' : trips.length],
              [
                'Drop place recorded',
                `${trips.filter((trip) => tripRoute(trip).to).length} of ${trips.length}`,
              ],
              [
                'Cycle status',
                tours$.error
                  ? 'Unavailable'
                  : tours$.loading
                    ? 'Loading'
                    : tour
                      ? 'Open'
                      : 'No open cycle',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
