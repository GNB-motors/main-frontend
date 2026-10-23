import { useEffect, useRef, useState } from 'react';
import { decodePolyline6 } from '../../../lib/polyline6.js';
import { routeColor, routeWidth } from '../model/routes.js';
import { placeTitle } from '../intelligence/model/siteSummary.js';
import { effectiveType } from '../intelligence/model/siteType.js';
import typeStyle from '../intelligence/placeTypes.js';
import { kmLabel, minutesLabel } from '../intelligence/model/unitLabels.js';

const pattern = (source, color) =>
  source === 'DRIVEN'
    ? []
    : [
        {
          icon: {
            path: source === 'ENGINE' ? 'M 0,-1 0,1' : 'M 0,0 0,0.1',
            strokeColor: color,
            strokeOpacity: 1,
            scale: source === 'ENGINE' ? 3 : 2,
          },
          offset: '0',
          repeat: source === 'ENGINE' ? '16px' : '10px',
        },
      ];

/** Retain map objects across hover/selection updates. All objects and listeners are detached on exit. */
export default function RouteLayer({
  map,
  lines,
  sites,
  selectedId,
  hoveredId,
  onPick,
  onHover,
  onSite,
  isDark,
  detail,
  showEngine,
  zoom,
}) {
  const objects = useRef([]);
  const callbacks = useRef({ onPick, onHover, onSite });
  callbacks.current = { onPick, onHover, onSite };
  const [tooltip, setTooltip] = useState(null);
  const ink = isDark ? '#e2e8f0' : '#1e293b';
  const land = isDark ? '#0d111e' : '#ffffff';

  useEffect(() => {
    if (!map) return undefined;
    const max = Math.max(1, ...lines.map((l) => l.runs));
    const records = [];
    const listeners = [];
    for (const line of lines.filter((l) => !l.legs[0].inPlant)) {
      const color = routeColor(line.runs, isDark);
      const width = routeWidth(line.runs, max);
      for (const path of line.segments) {
        const casing = new window.google.maps.Polyline({
          map,
          path,
          strokeColor: land,
          strokeWeight: width + 3,
          strokeOpacity: 0,
          clickable: false,
          zIndex: 10000,
        });
        const visible = new window.google.maps.Polyline({
          map,
          path,
          strokeColor: color,
          strokeWeight: width,
          strokeOpacity: line.source === 'DRIVEN' ? 0.75 : 0,
          clickable: false,
          icons: pattern(line.source, color),
          zIndex: line.runs,
        });
        const hit = new window.google.maps.Polyline({
          map,
          path,
          strokeWeight: Math.max(14, width),
          strokeOpacity: 0,
          zIndex: line.runs + 1,
        });
        listeners.push(hit.addListener('click', () => callbacks.current.onPick(line.id)));
        listeners.push(hit.addListener('mouseover', () => callbacks.current.onHover(line.id)));
        listeners.push(
          hit.addListener('mousemove', (event) => {
            const e = event.domEvent;
            if (!e) return;
            const rect = map.getDiv().getBoundingClientRect();
            setTooltip({
              line,
              x: Math.max(8, Math.min(rect.width - 240, e.clientX - rect.left + 12)),
              y: Math.max(8, e.clientY - rect.top - 65),
            });
          }),
        );
        listeners.push(
          hit.addListener('mouseout', () => {
            callbacks.current.onHover(null);
            setTooltip(null);
          }),
        );
        records.push({ line, visible, hit, casing, color, width });
      }
    }
    objects.current = records;
    return () => {
      listeners.forEach((l) => l.remove());
      records.forEach(({ visible, hit, casing }) => {
        visible.setMap(null);
        hit.setMap(null);
        casing.setMap(null);
      });
      objects.current = [];
      setTooltip(null);
    };
  }, [map, lines, isDark, land]);

  useEffect(() => {
    for (const obj of objects.current) {
      const selected = obj.line.legs.some((l) => String(l._id) === selectedId);
      const hovered = obj.line.legs.some((l) => String(l._id) === hoveredId);
      const opacity = selected || hovered ? 1 : selectedId ? 0.15 : 0.75;
      const icons = pattern(obj.line.source, obj.color).map((i) => ({
        ...i,
        icon: { ...i.icon, strokeOpacity: opacity },
      }));
      obj.visible.setOptions({
        strokeOpacity: obj.line.source === 'DRIVEN' ? opacity : 0,
        icons,
        zIndex: selected ? 10002 : hovered ? 9000 : obj.line.runs,
      });
      obj.casing.setOptions({ strokeOpacity: selected ? 1 : 0 });
      obj.hit.setOptions({ zIndex: selected ? 10005 : hovered ? 9001 : obj.line.runs + 1 });
    }
  }, [selectedId, hoveredId, lines, isDark]);

  useEffect(() => {
    if (!map) return undefined;
    const counts = new Map();
    const plantCounts = new Map();
    for (const line of lines)
      for (const leg of line.legs)
        for (const id of new Set([String(leg.fromSiteId), String(leg.toSiteId)])) {
          counts.set(id, (counts.get(id) || 0) + leg.traversals);
          if (leg.inPlant) plantCounts.set(id, (plantCounts.get(id) || 0) + 1);
        }
    const max = Math.max(1, ...counts.values());
    const busiest = new Set(
      [...counts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id),
    );
    const markers = [];
    const listeners = [];
    for (const [id, count] of counts) {
      const site = sites.get(id);
      if (!site || !Number.isFinite(site.lat) || !Number.isFinite(site.lng)) continue;
      const plant = plantCounts.get(id) || 0;
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: site.lat, lng: site.lng },
        title: `${placeTitle(site)}${plant ? ` · ${plant} in-plant legs` : ''}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 4 + 4 * Math.sqrt(count / max) + (plant ? 3 : 0),
          fillColor: typeStyle(effectiveType(site).type).color,
          fillOpacity: plant ? 0.25 : 1,
          strokeColor: plant ? ink : land,
          strokeWeight: plant ? 3 : 2,
          labelOrigin: new window.google.maps.Point(0, -18),
        },
        label: plant
          ? { text: String(plant), color: ink, fontSize: '11px' }
          : zoom >= 11 || (zoom >= 8 && busiest.has(id))
            ? {
                text: placeTitle(site),
                color: ink,
                className: isDark ? 'ph-route-label is-dark' : 'ph-route-label',
                fontSize: '11px',
              }
            : null,
        zIndex: 11000,
      });
      listeners.push(marker.addListener('click', () => callbacks.current.onSite(id)));
      markers.push(marker);
    }
    return () => {
      listeners.forEach((l) => l.remove());
      markers.forEach((m) => m.setMap(null));
    };
  }, [map, lines, sites, zoom, isDark, ink, land]);

  // Selected direction uses its own geometry (including detail) over the shared pair.
  useEffect(() => {
    if (!map || !selectedId) return undefined;
    const line = lines.find((l) => l.legs.some((leg) => String(leg._id) === selectedId));
    const leg = line?.legs.find((l) => String(l._id) === selectedId);
    if (!leg || leg.inPlant) return undefined;
    const selectedDetail = detail?._id === selectedId ? detail : null;
    const paths = selectedDetail?.path?.geomSegments?.length
      ? selectedDetail.path.geomSegments.map(decodePolyline6)
      : leg.segments;
    const color = routeColor(line.runs, isDark);
    const strokes = paths.map(
      (path) =>
        new window.google.maps.Polyline({
          map,
          path,
          strokeColor: color,
          strokeWeight: routeWidth(line.runs, Math.max(1, ...lines.map((l) => l.runs))),
          strokeOpacity: leg.path?.source === 'DRIVEN' ? 1 : 0,
          icons: [
            ...pattern(leg.path?.source, color),
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 2,
                strokeColor: color,
                fillColor: color,
                fillOpacity: 1,
              },
              offset: '60px',
              repeat: '120px',
            },
          ],
          zIndex: 10003,
          clickable: false,
        }),
    );
    if (showEngine && selectedDetail?.engine?.geom)
      strokes.push(
        new window.google.maps.Polyline({
          map,
          path: decodePolyline6(selectedDetail.engine.geom),
          strokeOpacity: 0,
          icons: pattern('ENGINE', isDark ? '#94a3b8' : '#64748b'),
          zIndex: 10004,
          clickable: false,
        }),
      );
    const points = paths.flat();
    const pins = points.length
      ? [points[0], points[points.length - 1]].map(
          (position, i) =>
            new window.google.maps.Marker({
              map,
              position,
              label: i ? 'B' : 'A',
              zIndex: 12000,
              title: i ? 'End' : 'Start',
            }),
        )
      : [];
    return () => {
      strokes.forEach((p) => p.setMap(null));
      pins.forEach((p) => p.setMap(null));
    };
  }, [map, lines, selectedId, detail, showEngine, isDark]);

  return tooltip ? (
    <div className="ph-route-tooltip" style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
      {tooltip.line.legs[0].title}
      {tooltip.line.legs.length > 1 ? ' (both directions)' : ''}
      <br />
      {tooltip.line.runs} runs · usual {minutesLabel(tooltip.line.legs[0].stats?.minutes?.p50)} ·{' '}
      {kmLabel(tooltip.line.legs[0].path?.km)}
      <br />
      {tooltip.line.source === 'NONE'
        ? 'Straight-line link'
        : tooltip.line.source === 'ENGINE'
          ? 'Likely road (engine)'
          : 'Road our trucks drove'}
    </div>
  ) : null;
}
