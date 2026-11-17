import { useMemo } from 'react';
import PlaceRouteSkeletons from './PlaceRouteSkeletons.jsx';
import { MapPin, Route, ChevronRight } from 'lucide-react';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { journeyPlaces, journeyRoutes } from './vehicleJourneyModel';

export default function VehicleJourneyPanel({
  journey,
  tab,
  query = '',
  onFocus,
  onSeek,
  onOpenPlace,
}) {
  const places = useMemo(() => journeyPlaces(journey.track), [journey.track]);
  const routes = useMemo(() => journeyRoutes(journey.track), [journey.track]);
  const rows = (tab === 'routes' ? routes : places).filter((row) =>
    row.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  if (journey.loading)
    return (
      <div className="lt-journey-message" aria-busy="true">
        <PlaceRouteSkeletons
          kind={tab === 'routes' ? 'route' : 'place'}
          label="Loading this vehicle’s journey"
        />
      </div>
    );
  if (journey.error || journey.held)
    return (
      <div className="lt-journey-message" role="alert">
        <p>
          {journey.held
            ? 'This journey is temporarily unavailable.'
            : 'Could not load this vehicle’s journey.'}
        </p>
        <button type="button" className="btn btn--sm" onClick={journey.refetch}>
          Retry journey
        </button>
      </div>
    );
  return (
    <section className="lt-journey-panel" aria-label="Vehicle journey">
      <header className="lt-journey-heading">
        <div className="lt-journey-title">
          <h3>{tab === 'routes' ? 'Recorded routes' : 'Places on this journey'}</h3>
          <span className="lt-journey-count" aria-label={`${rows.length} results`}>
            {rows.length}
          </span>
        </div>
        <p className="lt-journey-intro">
          {tab === 'routes'
            ? 'Recorded sections for this vehicle and period.'
            : 'Recorded stops and landmarks near this vehicle’s path. Nearby landmarks do not indicate a visit.'}
        </p>
      </header>
      {!rows.length ? (
        <p className="lt-journey-message">
          {query
            ? 'No matching results.'
            : tab === 'routes'
              ? 'No route sections recorded for this period.'
              : 'No stops or landmarks recorded for this period.'}
        </p>
      ) : (
        <ul className="lt-journey-list">
          {rows.map((row) => (
            <li key={row.id} className="lt-journey-item">
              <button
                type="button"
                className="lt-journey-row"
                onClick={() => {
                  if (row.at) onSeek?.(row.at);
                  onFocus?.(row);
                  if (tab !== 'routes') onOpenPlace?.(row);
                }}
              >
                <span className="lt-journey-icon" aria-hidden="true">
                  {tab === 'routes' ? <Route size={16} /> : <MapPin size={16} />}
                </span>
                <span className="lt-journey-content">
                  <span className="lt-journey-kind">
                    {tab === 'routes'
                      ? 'Route section'
                      : row.at
                        ? row.kind === 'point'
                          ? 'Recorded location'
                          : 'Recorded stop'
                        : 'Nearby landmark'}
                  </span>
                  <strong className="lt-journey-name">{row.title}</strong>
                  {row.at ? (
                    <span className="lt-journey-time">
                      <time dateTime={row.at}>{formatIst(row.at, { withDate: true })}</time>
                      {row.endAt ? (
                        <>
                          <span aria-hidden="true"> → </span>
                          <time dateTime={row.endAt}>
                            {formatIst(row.endAt, { withDate: true })}
                          </time>
                        </>
                      ) : null}
                    </span>
                  ) : null}
                  {row.durationMin != null || row.km != null ? (
                    <span className="lt-journey-metrics">
                      {row.durationMin != null ? (
                        <span>{formatDuration(row.durationMin)}</span>
                      ) : null}
                      {row.km != null ? <span>{row.km.toLocaleString('en-IN')} km</span> : null}
                    </span>
                  ) : null}
                  {row.description ? (
                    <span className="lt-journey-detail">{row.description}</span>
                  ) : null}
                </span>
                <ChevronRight className="lt-journey-arrow" size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
