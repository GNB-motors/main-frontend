import { useMemo } from 'react';
import { Route } from 'lucide-react';
import renderIconSvg from './renderIconSvg.jsx';

export default function RoutesListView({
  routes,
  kind = 'movement',
  query = '',
  selectedId,
  onPick,
  onHide,
}) {
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...routes.legs]
      .filter((leg) => !q || leg.title.toLowerCase().includes(q))
      .sort((a, b) => (b.traversals || 0) - (a.traversals || 0));
  }, [routes.legs, query]);
  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>{kind === 'delivery' ? 'Delivery routes' : 'All movements'}</h2>
          <div className="fsub">
            {routes.isLoading
              ? 'Loading routes…'
              : routes.error
                ? 'Routes unavailable'
                : `${rows.length} ${kind === 'delivery' ? 'delivery routes' : 'movement legs'}`}
          </div>
        </div>
        <button
          type="button"
          className="btn btn--sm btn--icon"
          aria-label="Hide routes list"
          onClick={onHide}
        >
          {renderIconSvg('chevRight', 16)}
        </button>
      </div>
      {kind === 'delivery' ? (
        <p className="lt-route-list-note">
          Pickup → drop, learned from completed loaded trips. Configured SAP routes stay visible
          before their first trip.
        </p>
      ) : (
        <p className="lt-route-list-note">
          All travel between places. One trip may include several movement passes.
        </p>
      )}
      {routes.unmatchedCount > 0 && (
        <p className="lt-route-list-note">
          {routes.unmatchedCount} routes have no mapped road path yet. Select one to see its known
          endpoints.
        </p>
      )}
      <div className="flist" aria-busy={routes.isLoading}>
        {routes.error ? (
          <div className="fempty" role="status">
            Could not load routes.{' '}
            <button type="button" className="btn btn--sm" onClick={routes.reload}>
              Retry routes
            </button>
          </div>
        ) : !routes.isLoading && !rows.length ? (
          <div className="fempty">
            {query ? 'No routes match your search.' : 'No fleet routes yet.'}
          </div>
        ) : (
          rows.map((leg) => (
            <button
              type="button"
              className="pcard lt-route-card"
              key={leg._id}
              aria-pressed={String(selectedId) === String(leg._id)}
              onClick={() => onPick(String(leg._id))}
            >
              <Route size={16} aria-hidden="true" />
              <span className="pcard__main">
                <b>{leg.title}</b>
                <span>
                  {[
                    leg.traversals != null
                      ? `${leg.traversals} ${kind === 'delivery' ? 'trips' : 'passes'}`
                      : null,
                    leg.stats?.km?.p50 != null ? `${Math.round(leg.stats.km.p50)} km` : null,
                    leg.stats?.minutes?.p50 != null
                      ? `${Math.round(leg.stats.minutes.p50)} min`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
