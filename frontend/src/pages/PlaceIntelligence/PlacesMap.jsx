import { useEffect, useRef, useState } from 'react';
import { GoogleMap, MarkerF, CircleF, PolygonF, useLoadScript } from '@react-google-maps/api';
import { Maximize2, Factory } from 'lucide-react';
import { boundsOf } from './placeIntelligenceModel';
import PlaceIntelligenceService from './PlaceIntelligenceService';

const MAP_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: false,
  styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
};
const INDIA = { lat: 22.5, lng: 82 };
const RISK_RED = '#c62828';
const ZONE = {
  fillColor: '#475569',
  fillOpacity: 0.18,
  strokeColor: '#475569',
  strokeOpacity: 0.6,
  strokeWeight: 1,
};

function markerIcon(m, selected) {
  const base = m.small ? 5 : 8;
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: selected ? base + 3 : base,
    fillColor: m.hollow ? '#ffffff' : m.color,
    fillOpacity: 1,
    strokeColor: m.hollow ? m.color : '#ffffff',
    strokeWeight: m.hollow ? 3 : 2,
  };
}

// Map knowledge (FR 2026-10-07): what the system learned is on the ground,
// from OpenStreetMap and Google, drawn on our own map. Villages are left to
// the base map; plants get their outline.
const POI_COLOR = {
  PLANT: '#8d6e63',
  INDUSTRIAL: '#7e57c2',
  LOGISTICS: '#1e88e5',
  ROADSIDE: '#9e9e9e',
};
const BUCKET_OF = {
  CEMENT_PLANT: 'PLANT',
  STEEL_PLANT: 'PLANT',
  POWER_PLANT: 'PLANT',
  FACTORY: 'PLANT',
  MINE_QUARRY: 'PLANT',
  INDUSTRIAL_AREA: 'INDUSTRIAL',
  WAREHOUSE: 'LOGISTICS',
  RAIL_GOODS: 'LOGISTICS',
  PORT: 'LOGISTICS',
  MARKET: 'LOGISTICS',
  FUEL_STATION: 'ROADSIDE',
  TRUCK_STOP: 'ROADSIDE',
  WORKSHOP: 'ROADSIDE',
  WEIGHBRIDGE: 'ROADSIDE',
  TOLL: 'ROADSIDE',
};
const POI_MIN_ZOOM = 10;

function poiIcon(bucket) {
  return {
    path: 'M -3.5 -3.5 L 3.5 -3.5 L 3.5 3.5 L -3.5 3.5 z',
    scale: 1,
    fillColor: POI_COLOR[bucket] || '#9e9e9e',
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

/** Fetch map knowledge for the visible area (zoomed in enough), newest request wins. */
function usePoiLayer(map, on) {
  const [pois, setPois] = useState([]);
  const ctl = useRef(null);
  const load = () => {
    if (!map || !on) return;
    const zoom = map.getZoom() || 0;
    const b = map.getBounds();
    if (zoom < POI_MIN_ZOOM || !b) {
      setPois([]);
      return;
    }
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    if (ctl.current) ctl.current.abort();
    ctl.current = new AbortController();
    PlaceIntelligenceService.listPoi(
      { south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() },
      { signal: ctl.current.signal },
    )
      .then((d) => setPois((d?.items || []).filter((p) => BUCKET_OF[p.category])))
      .catch(() => {});
  };
  useEffect(() => {
    if (!on) setPois([]);
    else load();
    // load reads the live map; re-run only when switched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, map]);
  return { pois, load };
}

function riskRing() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 14,
    fillOpacity: 0,
    strokeColor: RISK_RED,
    strokeWeight: 2,
  };
}

/**
 * The fleet's places on one map. Solid dot = confirmed, hollow = the engine's
 * guess, red ring = fuel risk, grey squares = signal dead zones. Fits every
 * marker when the set changes; flies to a place when it is selected.
 */
export default function PlacesMap({ markers, selectedId, onSelect, zones = [], legend = null }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });
  const [map, setMap] = useState(null);
  const [poiOn, setPoiOn] = useState(true);
  const { pois, load: loadPois } = usePoiLayer(map, poiOn);
  const lastFitKey = useRef('');
  const markerKey = markers.map((m) => m.id).join('|');

  const fitAll = () => {
    const b = boundsOf(markers);
    if (!map || !b) return;
    if (b.north - b.south < 0.005 && b.east - b.west < 0.005) {
      map.setCenter({ lat: b.north, lng: b.east });
      map.setZoom(15);
      return;
    }
    map.fitBounds(b, 48);
  };

  useEffect(() => {
    if (!map || lastFitKey.current === markerKey) return;
    lastFitKey.current = markerKey;
    fitAll();
    // fitAll reads the markers this key names; re-running on its identity would refit on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, markerKey]);

  const selected = markers.find((m) => m.id === selectedId) || null;
  useEffect(() => {
    if (!map || !selected) return;
    map.panTo({ lat: selected.lat, lng: selected.lng });
    if ((map.getZoom() || 0) < 13) map.setZoom(14);
    // Only a new selection moves the camera, not a refetch of the same place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);

  if (loadError) return <div className="pi-map pi-map-empty">Map could not load</div>;
  return (
    <div className="pi-map">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={INDIA}
          zoom={5}
          options={MAP_OPTIONS}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
          onIdle={loadPois}
        >
          {pois
            .filter((p) => Array.isArray(p.footprint) && p.footprint.length > 3)
            .map((p) => (
              <PolygonF
                key={`fp-${p.source}-${p.sourceId}`}
                paths={p.footprint}
                options={{
                  strokeColor: POI_COLOR[BUCKET_OF[p.category]],
                  strokeOpacity: 0.8,
                  strokeWeight: 1,
                  fillColor: POI_COLOR[BUCKET_OF[p.category]],
                  fillOpacity: 0.06,
                  clickable: false,
                }}
              />
            ))}
          {pois.slice(0, 1500).map((p) => (
            <MarkerF
              key={`poi-${p.source}-${p.sourceId}`}
              position={{ lat: p.lat, lng: p.lng }}
              icon={poiIcon(BUCKET_OF[p.category])}
              title={poiTitle(p)}
              clickable={false}
              zIndex={0}
            />
          ))}
          {zones.map((z) => (
            <PolygonF
              key={z._id}
              paths={(z.polygon || []).map(([lat, lng]) => ({ lat, lng }))}
              options={{ ...ZONE, clickable: false }}
            />
          ))}
          {selected && selected.radiusM ? (
            <CircleF
              center={{ lat: selected.lat, lng: selected.lng }}
              radius={selected.radiusM}
              options={{
                strokeColor: selected.color,
                strokeWeight: 1.5,
                fillColor: selected.color,
                fillOpacity: 0.12,
                clickable: false,
              }}
            />
          ) : null}
          {markers
            .filter((m) => m.risk)
            .map((m) => (
              <MarkerF
                key={`risk-${m.id}`}
                position={{ lat: m.lat, lng: m.lng }}
                icon={riskRing()}
                clickable={false}
                zIndex={1}
              />
            ))}
          {markers.map((m) => (
            <MarkerF
              key={m.id}
              position={{ lat: m.lat, lng: m.lng }}
              icon={markerIcon(m, m.id === selectedId)}
              title={m.title}
              zIndex={m.id === selectedId ? 10 : 2}
              onClick={() => onSelect(m.id)}
            />
          ))}
        </GoogleMap>
      ) : (
        <div className="pi-map-empty">Loading map…</div>
      )}
      {isLoaded && markers.length ? (
        <button
          type="button"
          className="pshell-btn"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            height: 30,
            padding: '0 10px',
            fontSize: 12,
          }}
          onClick={fitAll}
        >
          <Maximize2 size={13} aria-hidden="true" /> Show all
        </button>
      ) : null}
      {isLoaded ? (
        <button
          type="button"
          className="pshell-btn"
          aria-pressed={poiOn}
          title={`Plants, sidings, pumps and dhabas the system learned from the map${
            poiOn && (map?.getZoom?.() || 0) < POI_MIN_ZOOM ? ' — zoom in to see them' : ''
          }`}
          style={{
            position: 'absolute',
            top: 10,
            left: markers.length ? 112 : 10,
            height: 30,
            padding: '0 10px',
            fontSize: 12,
            opacity: poiOn ? 1 : 0.7,
          }}
          onClick={() => setPoiOn((v) => !v)}
        >
          <Factory size={13} aria-hidden="true" /> Map knowledge {poiOn ? 'on' : 'off'}
        </button>
      ) : null}
      {legend}
    </div>
  );
}
