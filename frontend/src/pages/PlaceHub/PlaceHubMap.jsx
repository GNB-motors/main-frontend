import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerClustererF } from '@react-google-maps/api';
import { boundsOf } from './intelligence/model/mapBounds.js';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from '../LiveTracking/mapStyles.js';
import { IDLE_COLOR, idleTone, DRAIN_COLOR, STOP_COLOR } from './placeHubStyle.js';
import { hoursLabel } from './model/placeLabels.js';
import { formatInrCompact } from '../../utils/formatters.js';
import {
  CLUSTER_STYLES_LIGHT,
  CLUSTER_STYLES_DARK,
  CLUSTER_OPTIONS,
  detachClusterer,
} from './map/clusterer.js';
import PlaceShape from './map/PlaceShape.jsx';
import PlaceMarker from './map/PlaceMarker.jsx';
import ClusterRepaint from './map/ClusterRepaint.jsx';
import ContextShape from './map/ContextShape.jsx';
import ScaledDot from './map/ScaledDot.jsx';
import LiveIdleMarker from './map/LiveIdleMarker.jsx';
import HotspotShape from './map/HotspotShape.jsx';
import DraftLayer from './map/DraftLayer.jsx';
import usePoiLayer from './map/usePoiLayer.js';
import PoiLayer from './map/PoiLayer.jsx';
import RouteLayer from './map/RouteLayer.jsx';

const MAP_STYLE = { width: '100%', height: '100%' };
const INDIA = { lat: 22.5, lng: 82 };
/** Below this zoom a few-hundred-metre circle is a speck; draw the pin only. */
const SHAPE_MIN_ZOOM = 11;

// Satellite keeps its own colours; only the clutter goes.
const SATELLITE_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

/** Marker size from a value's share of the biggest one: area tracks money. */
const scaleFor = (value, max, lo = 7, hi = 20) =>
  max > 0 ? lo + (hi - lo) * Math.sqrt(Math.max(0, value) / max) : lo;

/**
 * The one map behind every Place Hub tab. What it draws depends on the tab;
 * a draft (add / edit) draws on top of any tab and takes over map clicks.
 */
export default function PlaceHubMap({
  isLoaded,
  loadError,
  isDark,
  satellite,
  tab,
  places,
  contextPlaces,
  idleLive,
  idleSpots,
  hotspots,
  drainCells,
  stopGroups = [],
  showPoi = false,
  hiddenPlaceId,
  selectedId,
  onSelect,
  draft,
  onDraftChange,
  routes,
  fitPoints,
  fitKey,
  focus,
}) {
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(5);
  const lastFitKey = useRef(null);
  const drafting = Boolean(draft);
  const { pois, load: loadPois } = usePoiLayer(map, showPoi);

  const options = useMemo(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      styles: satellite ? SATELLITE_STYLES : isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      draggableCursor: drafting ? 'crosshair' : undefined,
    }),
    [isDark, satellite, drafting],
  );

  useEffect(() => {
    if (map) map.setMapTypeId(satellite ? 'hybrid' : 'roadmap');
  }, [map, satellite]);

  useEffect(() => {
    if (!map || lastFitKey.current === fitKey) return;
    const b = boundsOf(fitPoints);
    if (!b) return;
    lastFitKey.current = fitKey;
    if (b.north - b.south < 0.01 && b.east - b.west < 0.01) {
      map.setCenter({ lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 });
      map.setZoom(14);
      return;
    }
    map.fitBounds(b, 64);
  }, [map, fitKey, fitPoints]);

  useEffect(() => {
    if (!map || !focus) return undefined;
    // Wait a frame or two: opening the detail column resizes the map, and a
    // pan computed against the old size lands off-centre.
    const timer = setTimeout(() => {
      map.panTo({ lat: focus.lat, lng: focus.lng });
      if (focus.zoom && (map.getZoom() || 0) < focus.zoom) map.setZoom(focus.zoom);
    }, 60);
    return () => clearTimeout(timer);
    // A focus is consumed once per key; re-panning on unrelated renders would
    // fight the user dragging the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focus?.key]);

  const onMapClick = useCallback(
    (e) => {
      if (!draft) return;
      const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (draft.shape === 'polygon') {
        if (!draft.polygonDone) onDraftChange({ polygon: [...draft.polygon, p] });
      } else {
        onDraftChange({ center: p });
      }
    },
    [draft, onDraftChange],
  );

  if (loadError)
    return (
      <div className="ph-map-empty">The map could not load. Check your connection and refresh.</div>
    );
  if (!isLoaded) return <div className="ph-map-empty ph-shimmer" aria-busy="true" />;

  const showCircles = zoom >= SHAPE_MIN_ZOOM;
  // While drafting, every click belongs to the draft — even one that lands on
  // an existing place, which is exactly where a new fence is often drawn.
  const interactive = !drafting;
  const clusterStylesNow = isDark && !satellite ? CLUSTER_STYLES_DARK : CLUSTER_STYLES_LIGHT;
  const maxIdle = Math.max(0, ...idleSpots.map((s) => s.rupees));
  const maxDrain = Math.max(0, ...drainCells.map((c) => c.rupees || c.events));
  const maxStop = Math.max(0, ...stopGroups.map((g) => g.minutes));

  return (
    <GoogleMap
      mapContainerStyle={MAP_STYLE}
      center={INDIA}
      zoom={5}
      options={options}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
      onZoomChanged={() => map && setZoom(map.getZoom() || 5)}
      onIdle={loadPois}
      onClick={onMapClick}
    >
      {showPoi && <PoiLayer pois={pois} />}
      {tab === 'routes' && routes && (
        <RouteLayer map={map} {...routes} isDark={isDark || satellite} zoom={zoom} />
      )}

      {tab === 'places' &&
        places.map((p) =>
          p.id === hiddenPlaceId ? null : (
            <PlaceShape
              key={`s-${p.id}`}
              place={p}
              selected={p.id === selectedId}
              showCircle={showCircles || p.id === selectedId}
              interactive={interactive}
              onSelect={onSelect}
            />
          ),
        )}
      {tab === 'places' && (
        <MarkerClustererF
          options={CLUSTER_OPTIONS}
          styles={clusterStylesNow}
          title="Zoom in to see these places"
          onUnmount={detachClusterer}
        >
          {(clusterer) => (
            <>
              {places.map((p) =>
                p.id === hiddenPlaceId ? null : (
                  <PlaceMarker
                    key={`m-${p.id}`}
                    place={p}
                    selected={p.id === selectedId}
                    interactive={interactive}
                    onSelect={onSelect}
                    clusterer={clusterer}
                  />
                ),
              )}
              <ClusterRepaint
                clusterer={clusterer}
                styles={clusterStylesNow}
                places={places}
                hiddenPlaceId={hiddenPlaceId}
              />
            </>
          )}
        </MarkerClustererF>
      )}

      {tab !== 'places' &&
        tab !== 'routes' &&
        contextPlaces.map((p) => (
          <ContextShape key={`c-${p.id}`} place={p} showCircle={showCircles} />
        ))}

      {tab === 'idling' &&
        idleSpots.map((s) => (
          <ScaledDot
            key={s.id}
            id={s.id}
            lat={s.lat}
            lng={s.lng}
            color={IDLE_COLOR[idleTone(s.excessShare)]}
            scale={scaleFor(s.rupees, maxIdle)}
            title={`${s.events} idles · ${formatInrCompact(s.rupees)} burned`}
            selected={s.id === selectedId}
            interactive={interactive}
            onSelect={onSelect}
          />
        ))}
      {tab === 'idling' &&
        idleLive.map((e) => (
          <LiveIdleMarker
            key={`live-${e._id}`}
            event={e}
            selected={`live:${e._id}` === selectedId}
            interactive={interactive}
            onSelect={onSelect}
          />
        ))}

      {tab === 'stops' &&
        stopGroups.map((g) => (
          <ScaledDot
            key={g.id}
            id={g.id}
            lat={g.lat}
            lng={g.lng}
            color={STOP_COLOR}
            scale={scaleFor(g.minutes, maxStop)}
            title={`${hoursLabel(g.minutes / 60)} unexplained · ${g.stops.length} stops`}
            selected={g.id === selectedId}
            interactive={interactive}
            onSelect={onSelect}
          />
        ))}

      {tab === 'fuel' &&
        drainCells.map((c) => (
          <ScaledDot
            key={c.id}
            id={c.id}
            lat={c.lat}
            lng={c.lng}
            color={DRAIN_COLOR}
            scale={scaleFor(c.rupees || c.events, maxDrain)}
            title={`${c.events} fuel drops · ${formatInrCompact(c.rupees)}`}
            selected={c.id === selectedId}
            interactive={interactive}
            onSelect={onSelect}
          />
        ))}
      {tab === 'fuel' &&
        hotspots.map((h) =>
          h.id === hiddenPlaceId ? null : (
            <HotspotShape
              key={h.id}
              hotspot={h}
              selected={h.id === selectedId}
              interactive={interactive}
              onSelect={onSelect}
            />
          ),
        )}

      {draft && <DraftLayer draft={draft} onDraftChange={onDraftChange} />}
    </GoogleMap>
  );
}
