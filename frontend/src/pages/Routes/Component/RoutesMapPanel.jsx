import React, { useEffect, useMemo, useRef } from 'react';
import { GoogleMap, PolylineF } from '@react-google-maps/api';
import { decodePolyline, unionBounds } from '../../../components/RouteCreator/routeGeometry';
import { INDIA_CENTER } from '../../LiveTracking/liveTracking.shared.js';

const MAP_STYLE = { width: '100%', height: '340px', borderRadius: '0.75rem' };

const DEFAULT_STROKE = { strokeColor: '#2563eb', strokeOpacity: 0.8, strokeWeight: 4 };
const LEARNED_STROKE = { strokeColor: '#0284c7', strokeOpacity: 0.85, strokeWeight: 4 };
const PLANNED_STROKE = { strokeColor: '#7c3aed', strokeOpacity: 0.8, strokeWeight: 4 };
const HIGHLIGHT_STROKE = { strokeColor: '#B8460F', strokeOpacity: 1, strokeWeight: 6 };

// Prefer the Maps geometry library when the script was loaded with it; the
// pure decoder covers the case where another loader won the script URL.
const decodePath = (encoded) => {
  if (window.google?.maps?.geometry?.encoding) {
    return window.google.maps.geometry.encoding
      .decodePath(encoded)
      .map((p) => ({ lat: p.lat(), lng: p.lng() }));
  }
  return decodePolyline(encoded);
};

/**
 * RoutesMapPanel — draws every route whose persisted geometry carries an
 * encoded polyline. Routes without geometry render no path (the list row says
 * so); hovering a row passes its id in to highlight that route's path.
 */
const RoutesMapPanel = ({ routes = [], highlightedId = null, isLoaded = false }) => {
  const mapRef = useRef(null);

  const paths = useMemo(() => {
    const byId = new Map();
    for (const route of routes) {
      const encoded = route?.geometry?.encodedPolyline;
      if (!encoded) continue;
      const path = decodePath(encoded);
      if (path.length > 0) {
        byId.set(route._id, {
          path,
          provider: route?.geometry?.provider,
          name: route.name,
        });
      }
    }
    return byId;
  }, [routes]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const bounds = unionBounds(routes.map((r) => r.geometry?.bounds));
    if (bounds) {
      mapRef.current.fitBounds(new window.google.maps.LatLngBounds(bounds), 48);
      return;
    }
    if (paths.size > 0) {
      const latLngBounds = new window.google.maps.LatLngBounds();
      paths.forEach(({ path }) => path.forEach((p) => latLngBounds.extend(p)));
      mapRef.current.fitBounds(latLngBounds, 48);
    }
  }, [routes, paths, isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="routes-map-panel relative">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={INDIA_CENTER}
        zoom={5}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {[...paths].map(([id, { path, provider }]) => {
          let options = provider === 'DERIVED_FROM_TRACK' ? LEARNED_STROKE : PLANNED_STROKE;
          if (id === highlightedId) options = HIGHLIGHT_STROKE;
          return <PolylineF key={id} path={path} options={options} />;
        })}
      </GoogleMap>

      {/* Corridor Provenance Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[11px] flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="w-3 h-1 bg-sky-600 rounded-full inline-block" />
          Learned from Telemetry (
          {routes.filter((r) => r.geometry?.provider === 'DERIVED_FROM_TRACK').length})
        </span>
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="w-3 h-1 bg-purple-600 rounded-full inline-block" />
          Planned Baseline
        </span>
      </div>
    </div>
  );
};

export default RoutesMapPanel;
