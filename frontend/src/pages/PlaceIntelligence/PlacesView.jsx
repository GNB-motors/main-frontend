import { useDeferredValue, useState } from 'react';
import { Search, ArrowLeft, ShieldAlert, MapPinOff, CircleCheck, ChevronRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PlaceDetail from './PlaceDetail';
import PlacesMap from './PlacesMap';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import useSiteAnswer from './useSiteAnswer';
import TypeBadge from './TypeBadge';
import StateChip from './StateChip';
import typeStyle from './placeTypes';
import {
  PLACE_FILTERS,
  effectiveType,
  filterPlaces,
  hasRisk,
  messageOf,
  minutesLabel,
  placeStats,
  placeSubtitle,
  placeTitle,
} from './placeIntelligenceModel';

/**
 * The places screen, as a plain table: one row per place, click a row to go
 * inside and see what it is, why, and answer it (with a small map of that one
 * place). No side-by-side map on the list — keep the list simple to scan.
 */
export default function PlacesView({ filter, onFilter, version, onChanged, initialSelectedId }) {
  const [selectedId, setSelectedId] = useState(initialSelectedId || null);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query);

  const sitesQ = useApi(
    (signal) => PlaceIntelligenceService.listSites({ limit: 200 }, { signal }),
    [version],
  );
  const queueQ = useApi(
    (signal) => PlaceIntelligenceService.reviewQueue({ limit: 100 }, { signal }),
    [version],
  );
  const sites = sitesQ.data?.records || [];
  const queue = queueQ.data?.items || [];
  const list =
    filter === 'review'
      ? filterPlaces(
          queue.map((i) => i.site),
          'all',
          q,
        )
      : filterPlaces(sites, filter, q);

  // The opened place: the detail reads the full record itself; the row is only a fallback.
  const active = list.find((s) => s._id === selectedId) || null;

  const answer = useSiteAnswer(() => onChanged());

  const counts = {
    review: queueQ.data?.total ?? queue.length,
    ...Object.fromEntries(PLACE_FILTERS.map((f) => [f.key, filterPlaces(sites, f.key).length])),
  };
  const segs = [{ key: 'review', label: 'To answer' }, ...PLACE_FILTERS];

  const loading = (filter === 'review' ? queueQ : sitesQ).loading && !list.length;
  const error = sitesQ.error || queueQ.error;

  // ─── Detail ("inside" one place) ──────────────────────────────────────────
  if (selectedId) {
    const markerSite = active;
    const marker = markerSite
      ? {
          id: markerSite._id,
          lat: markerSite.centroidLat,
          lng: markerSite.centroidLng,
          color: typeStyle(effectiveType(markerSite).type).color,
          hollow: markerSite.status !== 'CONFIRMED',
          risk: hasRisk(markerSite),
          radiusM: markerSite.radiusM,
          title: placeTitle(markerSite),
        }
      : null;
    return (
      <div className="pi-detailpage">
        <button type="button" className="pi-back" onClick={() => setSelectedId(null)}>
          <ArrowLeft size={15} aria-hidden="true" /> Back to all places
        </button>
        <div className="pi-detailpage-body">
          <section className="pi-panel pi-detailpage-main" aria-label="Selected place">
            <PlaceDetail siteId={selectedId} fallback={active} version={version} answer={answer} />
          </section>
          <aside className="pi-detail-map" aria-label="Map">
            {marker ? (
              <PlacesMap markers={[marker]} selectedId={selectedId} onSelect={() => {}} />
            ) : (
              <div className="pi-map pi-map-empty">No location for this place</div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ─── Table (all places) ───────────────────────────────────────────────────
  const tableBody = () => {
    if (loading)
      return (
        <div className="pi-table-state">
          <PanelLoading />
        </div>
      );
    if (error)
      return (
        <EmptyPanel
          Icon={MapPinOff}
          title={
            error.status === 404
              ? 'Place Intelligence is off for this fleet'
              : 'Could not load places'
          }
          hint={
            error.status === 404
              ? 'Ask your admin to switch on Fleet Intelligence.'
              : messageOf(error, 'Try again in a minute.')
          }
        />
      );
    if (!list.length && filter === 'review' && !q)
      return (
        <EmptyPanel
          Icon={CircleCheck}
          title="All caught up"
          hint="Every place the system found has an answer. New places show up here after the nightly run."
          action={
            <button type="button" className="pshell-btn" onClick={() => onFilter('all')}>
              See all places
            </button>
          }
        />
      );
    if (!list.length)
      return <EmptyPanel title="No places match" hint="Try another filter or search." />;

    return (
      <div className="pi-table-wrap">
        <table className="pi-table pi-places-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Where</th>
              <th>Status</th>
              <th className="pi-num">Stops</th>
              <th className="pi-num">Trucks</th>
              <th className="pi-num">Typical stop</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const { type } = effectiveType(s);
              const st = placeStats(s);
              const risk = hasRisk(s);
              return (
                <tr
                  key={s._id}
                  className="pi-row"
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedId(s._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(s._id);
                    }
                  }}
                >
                  <td>
                    <span className="pi-rowplace">
                      <TypeBadge type={type} hollow={s.status !== 'CONFIRMED'} />
                      <span className="pi-rowplace-name">
                        {placeTitle(s)}
                        {risk ? (
                          <ShieldAlert
                            size={13}
                            className="pi-rowplace-risk"
                            aria-label="Fuel risk"
                          />
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="pi-rowwhere">{placeSubtitle(s)}</td>
                  <td>
                    <StateChip site={s} />
                  </td>
                  <td className="pi-num">{st.visits ?? '—'}</td>
                  <td className="pi-num">{st.trucks ?? '—'}</td>
                  <td className="pi-num">{minutesLabel(st.medianDwellMin)}</td>
                  <td className="pi-num">
                    <ChevronRight size={16} aria-hidden="true" className="pi-row-go" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="pi-placestab">
      <div className="pi-listhead">
        <label className="pi-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, town or type"
            aria-label="Search places"
          />
        </label>
        <div className="pi-filters" role="tablist" aria-label="Which places">
          {segs.map((f) => (
            <button
              type="button"
              role="tab"
              key={f.key}
              aria-selected={filter === f.key}
              className={filter === f.key ? 'is-active' : ''}
              onClick={() => onFilter(f.key)}
            >
              {f.label}
              <span
                className={`pi-count${f.key === 'review' && counts.review ? ' pi-count--warn' : ''}`}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>
      {tableBody()}
    </div>
  );
}
