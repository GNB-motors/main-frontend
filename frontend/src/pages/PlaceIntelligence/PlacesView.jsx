import { useDeferredValue, useState } from 'react';
import { Search, CircleCheck, MapPinOff } from 'lucide-react';
import useApi from '../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PlaceCard from './PlaceCard';
import PlaceDetail from './PlaceDetail';
import PlacesMap from './PlacesMap';
import MapLegend from './MapLegend';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import useSiteAnswer from './useSiteAnswer';
import typeStyle from './placeTypes';
import {
  PLACE_FILTERS,
  bboxAround,
  effectiveType,
  filterPlaces,
  hasRisk,
  messageOf,
  placeTitle,
} from './placeIntelligenceModel';

const toPoint = (s) => ({ lat: s.centroidLat, lng: s.centroidLng });

/**
 * The places screen: the list on the left (review queue or a filter over every
 * place), the map and the opened place on the right. Answering a place in the
 * review queue moves straight on to the next one.
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
  const bbox = bboxAround(sites.map(toPoint));
  const zonesQ = useApi(
    (signal) => PlaceIntelligenceService.listGlobalPlaces({ bbox, types: 'DARK_ZONE' }, { signal }),
    [bbox],
    { enabled: Boolean(bbox) },
  );

  const queue = queueQ.data?.items || [];
  const auditIds = new Set(queue.filter((i) => i.isAudit).map((i) => i.site._id));
  const list =
    filter === 'review'
      ? filterPlaces(
          queue.map((i) => i.site),
          'all',
          q,
        )
      : filterPlaces(sites, filter, q);
  const activeId = list.some((s) => s._id === selectedId) ? selectedId : list[0]?._id || null;
  const active = list.find((s) => s._id === activeId) || null;

  const answer = useSiteAnswer((answeredId) => {
    if (filter === 'review') {
      const i = list.findIndex((s) => s._id === answeredId);
      const next = list[i + 1] || list[i - 1];
      setSelectedId(next ? next._id : null);
    }
    onChanged();
  });

  const counts = {
    review: queueQ.data?.total ?? queue.length,
    ...Object.fromEntries(PLACE_FILTERS.map((f) => [f.key, filterPlaces(sites, f.key).length])),
  };
  const segs = [{ key: 'review', label: 'Needs your answer' }, ...PLACE_FILTERS];

  const markers = list.map((s) => {
    const { type } = effectiveType(s);
    return {
      id: s._id,
      ...toPoint(s),
      color: typeStyle(type).color,
      hollow: s.status !== 'CONFIRMED',
      risk: hasRisk(s),
      radiusM: s.radiusM,
      title: placeTitle(s),
      type,
    };
  });
  const zones = zonesQ.data || [];
  const legendTypes = [...new Set(markers.map((m) => m.type))];

  const loading = (filter === 'review' ? queueQ : sitesQ).loading && !list.length;
  const error = sitesQ.error || queueQ.error;

  const listBody = () => {
    if (loading) return <PanelLoading />;
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
    return list.map((s) => (
      <PlaceCard
        key={s._id}
        site={s}
        selected={s._id === activeId}
        onSelect={setSelectedId}
        isAudit={filter === 'review' && auditIds.has(s._id)}
      />
    ));
  };

  return (
    <>
      <div className="pi-toolbar">
        <div className="pi-seg" role="tablist" aria-label="Which places">
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
        <label className="pi-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, town or type"
            aria-label="Search places"
          />
        </label>
      </div>
      <div className="pi-layout pi-layout--three">
        <section className="pi-list" aria-label="Places">
          {listBody()}
        </section>
        <section className="pi-detail-col">
          {active ? (
            <PlaceDetail siteId={active._id} fallback={active} version={version} answer={answer} />
          ) : null}
        </section>
        <section className="pi-map-col">
          <PlacesMap
            markers={markers}
            selectedId={activeId}
            onSelect={setSelectedId}
            zones={zones}
            legend={
              markers.length ? (
                <MapLegend
                  types={legendTypes}
                  showZones={zones.length > 0}
                  showRisk={markers.some((m) => m.risk)}
                />
              ) : null
            }
          />
        </section>
      </div>
    </>
  );
}
