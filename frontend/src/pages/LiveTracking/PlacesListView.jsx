import { useMemo } from 'react';
import renderIconSvg from './renderIconSvg.jsx';
import TrackPlacesFilter from './TrackPlacesFilter.jsx';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { vehicleCountsByPlace } from './trackPlaces.js';

/* The Places tab: the same confirmed places as the map layer, searchable,
   with how many trucks are inside each one right now. Places with trucks in
   them come first. */
export default function PlacesListView({ trackPlaces, vehicles, onPick, onHide }) {
  const { listPlaces, places, loading, loaded, query, setQuery } = trackPlaces;
  const here = useMemo(() => vehicleCountsByPlace(listPlaces, vehicles), [listPlaces, vehicles]);
  const rows = useMemo(
    () => [...listPlaces].sort((a, b) => (here.get(b.id) || 0) - (here.get(a.id) || 0)),
    [listPlaces, here],
  );

  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>Places</h2>
          <div className="fsub">
            {!loaded
              ? 'Loading…'
              : rows.length === places.length
                ? `${places.length} confirmed places`
                : `${rows.length} of ${places.length} places`}
          </div>
        </div>
        <button
          className="btn btn--sm btn--icon"
          title="Hide list"
          aria-label="Hide list"
          onClick={onHide}
        >
          {renderIconSvg('chevRight', 16)}
        </button>
      </div>

      <div className="fsearch">
        {renderIconSvg('search', 16)}
        <input
          type="search"
          placeholder="Search place, type, area…"
          autoComplete="off"
          aria-label="Search places"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="pl-filter">
        <TrackPlacesFilter
          loading={trackPlaces.loading}
          notice={trackPlaces.notice}
          counts={trackPlaces.counts}
          hiddenGroups={trackPlaces.hiddenGroups}
          toggleGroup={trackPlaces.toggleGroup}
          retry={trackPlaces.retry}
        />
      </div>

      <div className="flist" aria-busy={loading}>
        {loaded && rows.length === 0 ? (
          <div className="fempty">
            {places.length === 0
              ? 'No confirmed places yet. Add them in Place Hub.'
              : 'No places match.'}
          </div>
        ) : (
          rows.map((p) => {
            const n = here.get(p.id) || 0;
            return (
              <button key={p.id} type="button" className="pcard" onClick={() => onPick(p)}>
                <span className="pcard__dot" style={{ background: styleOfType(p.type).color }} />
                <span className="pcard__main">
                  <b>{p.name}</b>
                  <span>{[placeTypeLabel(p.type), p.subtitle].filter(Boolean).join(' · ')}</span>
                </span>
                <span className={`pcard__here ${n ? 'is-busy' : ''}`}>
                  {n} {n === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
