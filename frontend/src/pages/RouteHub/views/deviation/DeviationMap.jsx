import { useEffect, useMemo } from 'react';
import { L, useLeafletMap, useLayerGroup, pinIcon } from '../../routeHubMap';
import { mapModel } from './deviationMapModel.js';
import { deviationDetailModel } from './deviationDetailModel.js';
import { cssToken } from '../../../../utils/redesign/tone';

const STYLE = {
  band: { radius: 3, stroke: false, fillColor: '#8B8B8C', fillOpacity: 0.3 },
  usual: { color: '#3468a5', weight: 4, opacity: 0.85, lineCap: 'round' },
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

      if (model.usual.length > 1) L.polyline(model.usual, STYLE.usual).addTo(group);
      if (model.driven.length > 1) L.polyline(model.driven, {
        color: model.judged ? colours.detour : '#77818d', weight: 4, opacity: 0.9,
        dashArray: '2 8', lineCap: 'round',
      }).addTo(group);

      // 4. Where it left the usual road and where it came back: white
      //    circles with a red edge.
      if (model.judged && redesigned.exitPoint) {
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
      if (model.judged && redesigned.rejoinPoint) {
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
      if (model.judged) redesigned.stopsDuring.forEach((stop) => {
        if (stop.lat == null || stop.lng == null) return;
        L.circleMarker([stop.lat, stop.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: colours.detour,
          fillOpacity: 1,
        })
          .bindTooltip(
            textTip(
              `${stop.placeName ?? 'Stopped'}${stop.durationMin != null ? ` · ${stop.durationMin} min` : ''}`,
            ),
            { direction: 'top', offset: [0, -10] },
          )
          .addTo(group);
      });

      model.markers.filter((m) => model.judged || !['exit', 'maxOff', 'rejoin'].includes(m.kind)).forEach((m) => {
        const [color, glyph, size] = MARKER[m.kind];
        L.marker(m.at, { icon: pinIcon(color, glyph, size), title: m.label })
          .bindTooltip(textTip(m.label), { direction: 'top', offset: [0, -10] })
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
// Place names come from data: set them as text so the tooltip never parses them as HTML.
function textTip(label) {
  const el = document.createElement('span');
  el.textContent = label == null ? '' : String(label);
  return el;
}

function clockLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
