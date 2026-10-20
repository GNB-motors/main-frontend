import { L, useLayerGroup, pinIcon, truckIcon } from '../../routeHubMap';
import { fmtT } from '../../routeHubFormat';
import { addRoadLayers } from '../../../../lib/roadTrailLeaflet';
import { overspeedStretches } from '../../overspeedReplay';
import { EVC, OVERSPEED_STRETCH } from './replayConstants.js';
import sampleAt from './sampleAt.js';

export default function useReplayLayers({
  mapRef,
  trip,
  limitKmh,
  runRef,
  truckRef,
  setPlaying,
  setT,
}) {
  useLayerGroup(
    mapRef,
    (group, map) => {
      if (!trip) return;
      if (trip.roadLayers.length) {
        addRoadLayers(L, group, trip.roadLayers, { color: '#9A9AA5', fleetColor: '#c4b5fd' });
      } else {
        L.polyline(trip.path, {
          color: '#9A9AA5',
          weight: 4,
          opacity: 0.6,
          dashArray: '2 8',
          lineCap: 'round',
        }).addTo(group);
      }
      // Over the limit: the stretch itself, along the road, so the map shows where.
      overspeedStretches(trip, trip.overspeed).forEach(({ event, onRoad, paths }) => {
        const at = new Date(event.startAt);
        L.polyline(paths, {
          color: OVERSPEED_STRETCH,
          weight: 7,
          opacity: 0.85,
          lineCap: 'round',
          dashArray: onRoad ? null : '6 6',
        })
          .bindTooltip(
            `Over ${limitKmh} km/h · peak ${event.maxSpeedKmh} km/h · ${fmtT(at)}${
              onRoad ? '' : ' (GPS fixes, no matched road)'
            }`,
            { className: 'tag', sticky: true },
          )
          .on('click', () => {
            setPlaying(false);
            setT(Math.max(0, Math.min(1, (at - trip.startAt) / (trip.durationMin * 60000 || 1))));
          })
          .addTo(group);
      });

      runRef.current = L.polyline([trip.path[0]], {
        color: '#2F58EE',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
      }).addTo(group);

      trip.events.forEach((e) => {
        const at = sampleAt(trip, e.t).ll;
        if (e.type === 'start' || e.type === 'end') {
          L.marker(at, { icon: pinIcon(EVC[e.type], e.type === 'start' ? 'truck' : 'pin', 22) })
            .bindTooltip(e.title, { className: 'tag', direction: 'top', offset: [0, -10] })
            .addTo(group);
        } else {
          L.circleMarker(at, {
            radius: 7,
            color: '#fff',
            weight: 2.5,
            fillColor: EVC[e.type],
            fillOpacity: 1,
          })
            .bindTooltip(e.title, { className: 'tag', direction: 'top' })
            .on('click', () => {
              setPlaying(false);
              setT(e.t);
            })
            .addTo(group);
        }
      });

      truckRef.current = L.marker(trip.path[0], { zIndexOffset: 1000, icon: truckIcon() }).addTo(
        group,
      );
      map.fitBounds(L.latLngBounds(trip.path), { padding: [60, 60] });
    },
    [trip, limitKmh],
  );
}
