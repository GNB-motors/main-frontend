import Skel from './Skel.jsx';
import { useMemo } from 'react';
import { Fuel } from 'lucide-react';
import PlaceRouteSkeletons from './PlaceRouteSkeletons.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import TrackPlacesFilter from './TrackPlacesFilter.jsx';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { vehicleCountsByPlace } from './trackPlaces.js';

/* The Places tab: the same confirmed places as the map layer, searchable,
   with how many trucks are inside each one right now. Places with trucks in
   them come first. The search box now lives on the map (F1.3), so this list
   is filtered by that one search. */
export default function PlacesListView({
  trackPlaces,
  vehicles,
  onPick,
  onHide,
  query = '',
  showAllPumps = false,
  onToggleAllPumps,
}) {
  const { listPlaces, places, loading, loaded } = trackPlaces;
  const initialLoading = (loading || !loaded) && !places.length && !trackPlaces.notice;
  const here = useMemo(() => vehicleCountsByPlace(listPlaces, vehicles), [listPlaces, vehicles]);

  // If !showAllPumps, only show petrol pumps that the fleet/user has used (visitCount > 0)
  const basePlaces = useMemo(() => {
    if (showAllPumps) return listPlaces;
    return listPlaces.filter((p) => {
      const isPump = p.type === 'FUEL_PUMP' || p.purpose === 'pump';
      if (!isPump) return true;
      const visits = Number(p.visitCount ?? p.visits ?? 0);
      return visits > 0;
    });
  }, [listPlaces, showAllPumps]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? basePlaces.filter((p) =>
          [p.name, p.type, p.subtitle].filter(Boolean).join(' ').toLowerCase().includes(q),
        )
      : basePlaces;
    return [...matching].sort((a, b) => (here.get(b.id) || 0) - (here.get(a.id) || 0));
  }, [basePlaces, here, query]);

  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>Places</h2>
          <div className="fsub">
            {initialLoading ? (
              <Skel w={108} h={11} />
            ) : rows.length === basePlaces.length ? (
              `${basePlaces.length} confirmed places`
            ) : (
              `${rows.length} of ${basePlaces.length} places`
            )}
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

      <div className="pl-filter">
        <TrackPlacesFilter
          loading={trackPlaces.loading || initialLoading}
          notice={trackPlaces.notice}
          counts={trackPlaces.counts}
          hiddenGroups={trackPlaces.hiddenGroups}
          toggleGroup={trackPlaces.toggleGroup}
          retry={trackPlaces.retry}
        />
      </div>

      {onToggleAllPumps ? (
        <div className="lt-pumps-scope-banner">
          <div className="lt-pumps-scope-info">
            <span className="lt-pumps-scope-icon" aria-hidden="true">
              <Fuel size={15} />
            </span>
            <div className="lt-pumps-scope-text">
              <span className="lt-pumps-scope-title">
                {showAllPumps ? 'All petrol pumps around' : 'Used petrol pumps only'}
              </span>
              <span className="lt-pumps-scope-sub">
                {showAllPumps
                  ? 'Showing all pumps in this area'
                  : 'Turn on to show all petrol pumps around'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Show all petrol pumps around"
            aria-checked={showAllPumps}
            onClick={onToggleAllPumps}
            className="lt-layer-switch"
          >
            <span />
          </button>
        </div>
      ) : null}

      <div className="flist" aria-busy={loading || initialLoading}>
        {initialLoading ? (
          <PlaceRouteSkeletons label="Loading places" />
        ) : loaded && rows.length === 0 ? (
          <div className="fempty">
            {basePlaces.length === 0
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
