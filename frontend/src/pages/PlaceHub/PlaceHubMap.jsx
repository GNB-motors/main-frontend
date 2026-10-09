import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  MarkerF,
  MarkerClustererF,
  CircleF,
  PolygonF,
  PolylineF,
} from '@react-google-maps/api';
import { boundsOf } from './intelligence/placeIntelligenceModel.js';
import PlaceHubService from './PlaceHubService.js';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from '../LiveTracking/liveTracking.shared.js';
import {
  styleOfType,
  PROVENANCE_COLOR,
  IDLE_COLOR,
  idleTone,
  DRAIN_COLOR,
  DRAFT_COLOR,
  CONTEXT_COLOR,
  STOP_COLOR,
  RISK_COLOR,
  POI_COLOR,
  poiBucket,
} from './placeHubStyle.js';
import { durationLabel, hoursLabel } from './placeHubModel.js';
import { compactInr } from '../../utils/formatMoney.js';

const MAP_STYLE = { width: '100%', height: '100%' };
const INDIA = { lat: 22.5, lng: 82 };
/** Below this zoom a few-hundred-metre circle is a speck; draw the pin only. */
const SHAPE_MIN_ZOOM = 11;
/** Above this zoom places a kilometre apart no longer overlap; show every pin. */
const CLUSTER_MAX_ZOOM = 12;

// Satellite keeps its own colours; only the clutter goes.
const SATELLITE_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

function clusterStyle(size, textSize, { fill, text }) {
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="${fill}" fill-opacity="0.2"/><circle cx="${r}" cy="${r}" r="${r - 6}" fill="${fill}" stroke="#ffffff" stroke-width="2"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    width: size,
    height: size,
    textColor: text,
    textSize,
    fontWeight: '700',
    fontFamily: 'inherit',
  };
}

// Neutral, so a cluster is never mistaken for one place type's colour.
const clusterStyles = (tone) => [
  clusterStyle(34, 12, tone),
  clusterStyle(40, 12, tone),
  clusterStyle(46, 13, tone),
];
const CLUSTER_STYLES_LIGHT = clusterStyles({ fill: '#1e293b', text: '#ffffff' });
const CLUSTER_STYLES_DARK = clusterStyles({ fill: '#cbd5e1', text: '#0f172a' });
const CLUSTER_OPTIONS = { gridSize: 52, maxZoom: CLUSTER_MAX_ZOOM, averageCenter: true };

const PIN_PATH = 'M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z';
const DIAMOND_PATH = 'M 0 -7 L 7 0 L 0 7 L -7 0 z';

function pinIcon(color, { selected = false, hollow = false, risk = false } = {}) {
  return {
    path: PIN_PATH,
    fillColor: hollow ? '#ffffff' : color,
    fillOpacity: 1,
    strokeColor: risk ? RISK_COLOR : hollow ? color : '#ffffff',
    strokeWeight: risk ? 3 : hollow ? 2.5 : 1.5,
    scale: selected ? 1.5 : 1.1,
    anchor: new window.google.maps.Point(12, 24),
  };
}

function dotIcon(color, scale, { selected = false, opacity = 0.85 } = {}) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: opacity,
    strokeColor: selected ? '#0b1220' : '#ffffff',
    strokeWeight: selected ? 3 : 1.5,
    scale,
  };
}

function diamondIcon(color, selected) {
  return {
    path: DIAMOND_PATH,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: selected ? 1.6 : 1.1,
  };
}

/** Marker size from a value's share of the biggest one: area tracks money. */
const scaleFor = (value, max, lo = 7, hi = 20) =>
  max > 0 ? lo + (hi - lo) * Math.sqrt(Math.max(0, value) / max) : lo;

/* ─── Layers (memoised so a selection change repaints two markers, not all) ── */

const PlaceShape = memo(function PlaceShape({
  place,
  selected,
  showCircle,
  interactive,
  onSelect,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const options = useMemo(
    () => ({
      strokeColor: color,
      strokeOpacity: proposed ? 0.6 : 0.9,
      strokeWeight: selected ? 3 : 1.5,
      fillColor: color,
      fillOpacity: selected ? 0.22 : 0.08,
      clickable: interactive,
    }),
    [color, proposed, selected, interactive],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  if (place.polygon) return <PolygonF paths={place.polygon} options={options} onClick={click} />;
  if (!showCircle || !place.radiusM) return null;
  return (
    <CircleF
      center={{ lat: place.lat, lng: place.lng }}
      radius={place.radiusM}
      options={options}
      onClick={click}
    />
  );
});

const PlaceMarker = memo(function PlaceMarker({
  place,
  selected,
  interactive,
  onSelect,
  clusterer,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const icon = useMemo(
    () => pinIcon(color, { selected, hollow: proposed, risk: place.risk }),
    [color, selected, proposed, place.risk],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  return (
    <MarkerF
      position={{ lat: place.lat, lng: place.lng }}
      icon={icon}
      title={place.name}
      clickable={interactive}
      zIndex={selected ? 1000 : proposed ? 1 : 10}
      onClick={click}
      clusterer={clusterer}
      noClustererRedraw
    />
  );
});

/**
 * Markers join and leave the clusterer without redrawing it — 200 suggestions
 * would mean 200 full redraws — so it is repainted once per change of set.
 * Rendered after the markers, so their effects have already run. Styles are
 * set here too: the clusterer's own style effect runs after its children's.
 */
function ClusterRepaint({ clusterer, styles, places, hiddenPlaceId }) {
  useEffect(() => {
    clusterer.setStyles(styles);
    clusterer.repaint();
  }, [clusterer, styles, places, hiddenPlaceId]);
  return null;
}

// MarkerClustererF leaves its overlay on the map when it unmounts, so without
// this the cluster bubbles would linger on the Idling and Fuel risk tabs.
function detachClusterer(clusterer) {
  clusterer.clearMarkers();
  clusterer.setMap(null);
}

const ContextShape = memo(function ContextShape({ place, showCircle }) {
  const options = useMemo(
    () => ({
      strokeColor: CONTEXT_COLOR,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      fillColor: CONTEXT_COLOR,
      fillOpacity: 0.06,
      clickable: false,
    }),
    [],
  );
  if (place.polygon) return <PolygonF paths={place.polygon} options={options} />;
  if (!showCircle || !place.radiusM) return null;
  return (
    <CircleF center={{ lat: place.lat, lng: place.lng }} radius={place.radiusM} options={options} />
  );
});

const ScaledDot = memo(function ScaledDot({
  id,
  lat,
  lng,
  color,
  scale,
  title,
  selected,
  interactive,
  onSelect,
}) {
  const icon = useMemo(() => dotIcon(color, scale, { selected }), [color, scale, selected]);
  const click = useCallback(() => onSelect(id), [onSelect, id]);
  return (
    <MarkerF
      position={{ lat, lng }}
      icon={icon}
      title={title}
      clickable={interactive}
      zIndex={selected ? 1000 : Math.round(scale)}
      onClick={click}
    />
  );
});

const LiveIdleMarker = memo(function LiveIdleMarker({ event, selected, interactive, onSelect }) {
  const color = event.legitimacy === 'excess' ? IDLE_COLOR.excess : IDLE_COLOR.legit;
  const icon = useMemo(() => diamondIcon(color, selected), [color, selected]);
  const id = `live:${event._id}`;
  const click = useCallback(() => onSelect(id), [onSelect, id]);
  return (
    <MarkerF
      position={{ lat: Number(event.lat), lng: Number(event.lng) }}
      icon={icon}
      title={`${event.registrationNumber || 'Truck'} · idling ${durationLabel(event.durationMin)}`}
      clickable={interactive}
      zIndex={selected ? 1001 : 500}
      onClick={click}
    />
  );
});

const HotspotShape = memo(function HotspotShape({ hotspot, selected, interactive, onSelect }) {
  const color = hotspot.active ? PROVENANCE_COLOR[hotspot.provenance] : CONTEXT_COLOR;
  const options = useMemo(
    () => ({
      strokeColor: color,
      strokeOpacity: hotspot.active ? 0.9 : 0.5,
      strokeWeight: selected ? 3 : 1.5,
      fillColor: color,
      fillOpacity: selected ? 0.25 : hotspot.active ? 0.12 : 0.05,
      clickable: interactive,
    }),
    [color, hotspot.active, selected, interactive],
  );
  const icon = useMemo(
    () => dotIcon(color, selected ? 9 : 7, { selected, opacity: hotspot.active ? 1 : 0.6 }),
    [color, selected, hotspot.active],
  );
  const click = useCallback(() => onSelect(hotspot.id), [onSelect, hotspot.id]);
  const center = useMemo(
    () => ({ lat: hotspot.lat, lng: hotspot.lng }),
    [hotspot.lat, hotspot.lng],
  );
  return (
    <>
      <CircleF center={center} radius={hotspot.radiusM} options={options} onClick={click} />
      <MarkerF
        position={center}
        icon={icon}
        title={hotspot.name}
        clickable={interactive}
        zIndex={selected ? 1000 : 50}
        onClick={click}
      />
    </>
  );
});

/* ─── The draft being added or edited ────────────────────────────────────── */

function DraftLayer({ draft, onDraftChange }) {
  const circleRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const options = useMemo(
    () => ({
      strokeColor: DRAFT_COLOR,
      strokeOpacity: 1,
      strokeWeight: 2.5,
      fillColor: DRAFT_COLOR,
      fillOpacity: 0.16,
      editable: true,
      zIndex: 2000,
    }),
    [],
  );
  const vertexIcon = useMemo(() => dotIcon('#ffffff', 5, { opacity: 1 }), []);
  const firstVertexIcon = useMemo(() => dotIcon(DRAFT_COLOR, 7, { opacity: 1 }), []);
  const centerIcon = useMemo(() => pinIcon(DRAFT_COLOR, { selected: true }), []);

  // Google fires *_changed for our own setRadius/setCenter too; only a real
  // drag differs from the draft, so equal values are ignored (no render loop).
  const onRadiusChanged = useCallback(() => {
    const c = circleRef.current;
    const d = draftRef.current;
    if (!c || !d) return;
    const r = Math.round(c.getRadius());
    if (r !== Math.round(d.radiusM)) onDraftChange({ radiusM: r });
  }, [onDraftChange]);

  const onCenterChanged = useCallback(() => {
    const c = circleRef.current;
    const d = draftRef.current;
    const p = c?.getCenter();
    if (!p || !d?.center) return;
    if (Math.abs(p.lat() - d.center.lat) > 1e-7 || Math.abs(p.lng() - d.center.lng) > 1e-7) {
      onDraftChange({ center: { lat: p.lat(), lng: p.lng() } });
    }
  }, [onDraftChange]);

  if (draft.shape === 'polygon') {
    const pts = draft.polygon;
    if (draft.polygonDone && pts.length >= 3) {
      return <PolygonF paths={pts} options={{ ...options, editable: false, clickable: false }} />;
    }
    return (
      <>
        {pts.length >= 2 && (
          <PolylineF
            path={pts}
            options={{
              strokeColor: DRAFT_COLOR,
              strokeWeight: 2.5,
              clickable: false,
              zIndex: 2000,
            }}
          />
        )}
        {pts.map((p, i) => (
          <MarkerF
            key={`${p.lat}:${p.lng}:${i}`}
            position={p}
            icon={i === 0 ? firstVertexIcon : vertexIcon}
            zIndex={2001}
            title={i === 0 && pts.length >= 3 ? 'Click to close the outline' : undefined}
            onClick={() => {
              if (i === 0 && pts.length >= 3) onDraftChange({ polygonDone: true });
            }}
          />
        ))}
      </>
    );
  }

  if (!draft.center) return null;
  return (
    <>
      <CircleF
        center={draft.center}
        radius={Number(draft.radiusM) || 0}
        options={options}
        onLoad={(c) => {
          circleRef.current = c;
        }}
        onUnmount={() => {
          circleRef.current = null;
        }}
        onRadiusChanged={onRadiusChanged}
        onCenterChanged={onCenterChanged}
      />
      <MarkerF
        position={draft.center}
        icon={centerIcon}
        draggable
        zIndex={2002}
        title="Drag to move"
        onDragEnd={(e) => onDraftChange({ center: { lat: e.latLng.lat(), lng: e.latLng.lng() } })}
      />
    </>
  );
}

/* ─── Map data: plants, sidings, pumps … learned from OSM / Google ───────── */

const POI_MIN_ZOOM = 10;
const MAX_POI = 1500;

function poiIcon(color) {
  return {
    path: 'M -3.5 -3.5 L 3.5 -3.5 L 3.5 3.5 L -3.5 3.5 z',
    scale: 1,
    fillColor: color,
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 1,
  };
}

function poiTitle(p) {
  const what = (p.category || '').toLowerCase().replace(/_/g, ' ');
  const src = p.source === 'GOOGLE_PLACES' ? 'Google' : 'OpenStreetMap';
  return `${p.name || what} · ${what} · ${src}`;
}

/** What the map data knows inside the visible box, refetched when the map settles. */
function usePoiLayer(map, on) {
  const [pois, setPois] = useState([]);
  const ctl = useRef(null);
  const load = useCallback(() => {
    if (!map || !on) return;
    const b = map.getBounds();
    if ((map.getZoom() || 0) < POI_MIN_ZOOM || !b) {
      setPois([]);
      return;
    }
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    ctl.current?.abort();
    ctl.current = new AbortController();
    PlaceHubService.loadPoi(
      { south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() },
      { signal: ctl.current.signal },
    )
      .then((items) => setPois(items.filter((p) => poiBucket(p.category))))
      .catch(() => {});
  }, [map, on]);
  useEffect(() => {
    if (on) load();
    else {
      ctl.current?.abort();
      setPois([]);
    }
  }, [on, load]);
  useEffect(() => () => ctl.current?.abort(), []);
  return { pois, load };
}

const PoiLayer = memo(function PoiLayer({ pois }) {
  return (
    <>
      {pois
        .filter((p) => Array.isArray(p.footprint) && p.footprint.length > 3)
        .map((p) => {
          const color = POI_COLOR[poiBucket(p.category)];
          return (
            <PolygonF
              key={`fp-${p.source}-${p.sourceId}`}
              paths={p.footprint}
              options={{
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: 0.06,
                clickable: false,
              }}
            />
          );
        })}
      {pois.slice(0, MAX_POI).map((p) => (
        <MarkerF
          key={`poi-${p.source}-${p.sourceId}`}
          position={{ lat: p.lat, lng: p.lng }}
          icon={poiIcon(POI_COLOR[poiBucket(p.category)])}
          title={poiTitle(p)}
          clickable={false}
          zIndex={0}
        />
      ))}
    </>
  );
});

/* ─── Map ────────────────────────────────────────────────────────────────── */

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
            title={`${s.events} idles · ${compactInr(s.rupees)} burned`}
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
            title={`${c.events} fuel drops · ${compactInr(c.rupees)}`}
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
