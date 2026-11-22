import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Route } from 'lucide-react';
import useApi from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
import { fleetViewService } from '../../services/fleetViewService';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import PlaceRouteSkeletons from './PlaceRouteSkeletons.jsx';
import { vehicleHistoryPlaces, vehicleHistoryRows } from './vehicleHistoryModel';

const PAGE_SIZE = 200;

/** The vehicle's stored history, independent of the Track replay window. */
export default function VehicleHistoryPanel({
  registrationNumber,
  vehicleId,
  tab,
  query = '',
  onMapPlaces,
}) {
  const [page, setPage] = useState(1);
  const routes = tab === 'routes';
  const missingVehicle = routes && !vehicleId;
  const { data, loading, error, refetch } = useApi(
    (signal) =>
      routes
        ? AutoTripService.list(
            {
              vehicleId,
              page,
              limit: PAGE_SIZE,
              ...(query.trim() ? { search: query.trim() } : {}),
            },
            { signal },
          )
        : fleetViewService.getTripsHistory({
            vehicle: registrationNumber,
            page,
            limit: PAGE_SIZE,
            signal,
          }),
    [registrationNumber, vehicleId, tab, page, query],
    {
      enabled: !missingVehicle,
      scopeKey: JSON.stringify([registrationNumber, vehicleId, tab, page, query]),
    },
  );
  const rows = useMemo(
    () => vehicleHistoryRows(data, tab, registrationNumber),
    [data, tab, registrationNumber],
  );
  const shown = useMemo(
    () =>
      routes || !query.trim()
        ? rows
        : rows.filter((row) => row.title.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, routes, query],
  );
  const places = useMemo(() => vehicleHistoryPlaces(shown), [shown]);
  useEffect(() => {
    onMapPlaces?.({ registrationNumber, tab, places });
  }, [registrationNumber, tab, places, onMapPlaces]);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  return (
    <section className="lt-journey-panel" aria-label="Vehicle history" aria-busy={loading}>
      <header className="lt-journey-heading">
        <div className="lt-journey-title">
          <h3>{routes ? 'Recorded trips' : 'Visited places'}</h3>
          <span className="lt-journey-count">{routes ? (data?.total ?? '—') : shown.length}</span>
        </div>
        <p className="lt-journey-intro">
          Full recorded history for this vehicle.{' '}
          {routes
            ? 'Select a route to open its trip.'
            : 'Each visit opens its linked trip, or its own replay when no trip is linked.'}
        </p>
      </header>
      {missingVehicle ? (
        <p className="lt-journey-message">
          A linked fleet vehicle record is needed to load its trips. Recorded visits are available
          under Places.
        </p>
      ) : loading ? (
        <PlaceRouteSkeletons kind={routes ? 'route' : 'place'} label="Loading vehicle history" />
      ) : error || data?.held ? (
        <div className="lt-journey-message" role="alert">
          <p>Could not load this vehicle’s history.</p>
          <button type="button" className="btn btn--sm" onClick={refetch}>
            Retry history
          </button>
        </div>
      ) : (
        <>
          {!shown.length ? (
            <p className="lt-journey-message">
              {query
                ? 'No matching results on this page.'
                : routes
                  ? 'No trips recorded.'
                  : 'No visits on this history page.'}
            </p>
          ) : (
            <ul className="lt-journey-list">
              {shown.map((row) => {
                const content = (
                  <>
                    <span className="lt-journey-icon" aria-hidden="true">
                      {routes ? <Route size={16} /> : <MapPin size={16} />}
                    </span>
                    <span className="lt-journey-content">
                      <strong className="lt-journey-name">{row.title}</strong>
                      {row.at ? (
                        <span className="lt-journey-time">
                          <time dateTime={row.at}>{formatIst(row.at, { withDate: true })}</time>
                          {row.endAt ? (
                            <>
                              {' '}
                              →{' '}
                              <time dateTime={row.endAt}>
                                {formatIst(row.endAt, { withDate: true })}
                              </time>
                            </>
                          ) : null}
                        </span>
                      ) : null}
                      <span className="lt-journey-metrics">
                        {row.km != null ? <span>{row.km.toLocaleString('en-IN')} km</span> : null}
                        {row.durationMin != null ? (
                          <span>{formatDuration(row.durationMin)}</span>
                        ) : null}
                      </span>
                      <span className="lt-journey-detail">{row.description}</span>
                    </span>
                    {row.to ? <ChevronRight size={15} aria-hidden="true" /> : null}
                  </>
                );
                return (
                  <li key={row.id} className="lt-journey-item">
                    {row.to ? (
                      <Link className="lt-journey-row" to={row.to}>
                        {content}
                      </Link>
                    ) : (
                      <div className="lt-journey-row">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {totalPages > 1 ? (
            <nav className="lt-history-pagination" aria-label="Vehicle history pages">
              <button
                type="button"
                className="btn btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn--sm"
                disabled={page >= totalPages || (!routes && page >= 50)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}
          {!routes && page >= 50 && totalPages > page ? (
            <p className="lt-journey-message" role="status">
              More visits are available.{' '}
              <Link
                to={`/auto-trips?${new URLSearchParams({ tab: 'history', vehicle: registrationNumber })}`}
              >
                Open trip history to narrow the dates.
              </Link>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
