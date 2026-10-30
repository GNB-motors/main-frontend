import { useEffect } from 'react';
import { L, useLeafletMap, useLayerGroup, pinIcon } from '../../routeHubMap';
import { mapModel } from './deviationMapModel.js';

const STYLE = {
  band: { radius: 3, stroke: false, fillColor: '#8B8B8C', fillOpacity: 0.3 },
  usual: { color: '#5D5D5E', weight: 3, opacity: 0.7, dashArray: '2 7', lineCap: 'round' },
  approach: { color: '#828BAE', weight: 3, opacity: 0.85, dashArray: '6 6', lineCap: 'round' },
  laden: { color: '#2F58EE', weight: 4, opacity: 0.8, lineCap: 'round' },
  detourHalo: { color: '#C2323A', weight: 14, opacity: 0.16 },
  detour: { color: '#C2323A', weight: 5, opacity: 0.95, lineCap: 'round' },
};

const MARKER = {
  pickup: ['#187A32', 'building', 24],
  drop: ['#1E1E20', 'pin', 24],
  exit: ['#C56200', 'alert', 22],
  maxOff: ['#C2323A', 'target', 22],
  rejoin: ['#187A32', 'check', 22],
};

/**
 * The trip as driven (empty run dashed, loaded run solid), the usual route as
 * grey dots (the cells it was checked against) plus a dotted typical drive, and the detour in red with where it left, its farthest point and
 * where it came back. `zoom` is 'detour' or 'trip'.
 */
export default function DeviationMap({ detail, zoom }) {
  const { containerRef, mapRef } = useLeafletMap({ preferCanvas: true });

  useLayerGroup(
    mapRef,
    (group) => {
      const model = mapModel(detail);
      if (!model) return;
      model.band.forEach((p) => L.circleMarker(p, STYLE.band).addTo(group));
      if (model.usual.length) L.polyline(model.usual, STYLE.usual).addTo(group);
      model.approach.forEach((line) => L.polyline(line, STYLE.approach).addTo(group));
      model.laden.forEach((line) => L.polyline(line, STYLE.laden).addTo(group));
      if (model.detour.length > 1) {
        L.polyline(model.detour, STYLE.detourHalo).addTo(group);
        L.polyline(model.detour, STYLE.detour).addTo(group);
      }
      model.markers.forEach((m) => {
        const [color, glyph, size] = MARKER[m.kind];
        L.marker(m.at, { icon: pinIcon(color, glyph, size), title: m.label })
          .bindTooltip(m.label, { direction: 'top', offset: [0, -10] })
          .addTo(group);
      });
    },
    [detail],
  );

  useEffect(() => {
    const map = mapRef.current;
    const points = mapModel(detail)?.bounds?.[zoom];
    if (!map || !points || !points.length) return;
    map.flyToBounds(L.latLngBounds(points), { padding: [50, 50], duration: 0.6, maxZoom: 14 });
  }, [detail, zoom, mapRef]);

  return <div className="lmap" ref={containerRef} />;
}
