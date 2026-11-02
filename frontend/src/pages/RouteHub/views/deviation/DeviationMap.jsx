import { useEffect, useMemo } from 'react';
import { L, useLeafletMap, useLayerGroup, pinIcon } from '../../routeHubMap';
import { mapModel } from './deviationMapModel.js';
import { deviationDetailModel } from './deviationDetailModel.js';
import { cssToken } from '../../../../utils/redesign/tone';

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
 * The trip as driven, the usual road, and the part that came off it.
 *
 * The layer order is exact: the usual road UNDER the road as driven, and
 * the off-road part ON TOP of it. The colours are the redesign's tokens,
 * read from the stylesheet so there is one source of truth.
 */
export default function DeviationMap({ detail, zoom }) {
  const { containerRef, mapRef } = useLeafletMap({ preferCanvas: true });

  // The redesign's colours: the usual road grey, the driven road blue, the
  // off-road part red.
  const colours = useMemo(
    () => ({
      usual: cssToken('--rd-usual-road', '#9ca3af'),
      driven: cssToken('--rd-leg-loaded', '#2563eb'),
      detour: cssToken('--rd-detour', '#dc2626'),
    }),
    [],
  );

  useLayerGroup(
    mapRef,
    (group) => {
      const model = mapModel(detail);
      if (!model) return;
      const redesigned = deviationDetailModel(detail, null);

      model.band.forEach((p) => L.circleMarker(p, STYLE.band).addTo(group));

      // 1. The usual road: grey, 8 px, 70%.
      if (redesigned.usualRoute && redesigned.usualRoute.length > 1) {
        L.polyline(redesigned.usualRoute, {
          color: colours.usual,
          weight: 8,
          opacity: 0.7,
          lineCap: 'round',
        }).addTo(group);
      } else if (model.usual.length) {
        L.polyline(model.usual, STYLE.usual).addTo(group);
      }

      // 2. The road as driven: blue, 4 px.
      model.approach.forEach((line) =>
        L.polyline(line, { ...STYLE.approach, weight: 4 }).addTo(group),
      );
      model.laden.forEach((line) =>
        L.polyline(line, { ...STYLE.laden, color: colours.driven, weight: 4 }).addTo(group),
      );

      // 3. The part off the usual road: red, 5 px.
      const offRoute =
        redesigned.offRoute && redesigned.offRoute.length > 1 ? redesigned.offRoute : model.detour;
      if (offRoute.length > 1) {
        L.polyline(offRoute, { ...STYLE.detourHalo, color: colours.detour }).addTo(group);
        L.polyline(offRoute, { ...STYLE.detour, color: colours.detour }).addTo(group);
      }

      // 4. Where it left the usual road and where it came back: white
      //    circles with a red edge.
      if (redesigned.exitPoint) {
        L.circleMarker([redesigned.exitPoint.lat, redesigned.exitPoint.lng], {
          radius: 7,
          color: colours.detour,
          weight: 3,
          fillColor: '#ffffff',
          fillOpacity: 1,
        })
          .bindTooltip(
            `Left the usual road${redesigned.exitAt ? ` · ${clockLabel(redesigned.exitAt)}` : ''}`,
            { direction: 'top', offset: [0, -10] },
          )
          .addTo(group);
      }
      if (redesigned.rejoinPoint) {
        L.circleMarker([redesigned.rejoinPoint.lat, redesigned.rejoinPoint.lng], {
          radius: 7,
          color: colours.detour,
          weight: 3,
          fillColor: '#ffffff',
          fillOpacity: 1,
        })
          .bindTooltip(
            `Back on it${redesigned.rejoinAt ? ` · ${clockLabel(redesigned.rejoinAt)}` : ''}`,
            { direction: 'top', offset: [0, -10] },
          )
          .addTo(group);
      }

      // The stops while off the usual road: facts, pinned where they were.
      redesigned.stopsDuring.forEach((stop) => {
        if (stop.lat == null || stop.lng == null) return;
        L.circleMarker([stop.lat, stop.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: colours.detour,
          fillOpacity: 1,
        })
          .bindTooltip(
            `${stop.placeName ?? 'Stopped'}${stop.durationMin != null ? ` · ${stop.durationMin} min` : ''}`,
            { direction: 'top', offset: [0, -10] },
          )
          .addTo(group);
      });

      model.markers.forEach((m) => {
        const [color, glyph, size] = MARKER[m.kind];
        L.marker(m.at, { icon: pinIcon(color, glyph, size), title: m.label })
          .bindTooltip(m.label, { direction: 'top', offset: [0, -10] })
          .addTo(group);
      });
    },
    [detail, colours],
  );

  useEffect(() => {
    const map = mapRef.current;
    const points = mapModel(detail)?.bounds?.[zoom];
    if (!map || !points || !points.length) return;
    map.flyToBounds(L.latLngBounds(points), { padding: [50, 50], duration: 0.6, maxZoom: 14 });
  }, [detail, zoom, mapRef]);

  return <div className="lmap" ref={containerRef} />;
}

/** The time of day, for the exit and rejoin labels. */
function clockLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
