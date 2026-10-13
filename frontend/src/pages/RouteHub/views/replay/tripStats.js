import { hm } from '../../routeHubFormat';

export default function tripStats(trip) {
  return trip
    ? [
        [
          'split',
          trip.distanceSource === 'road' ? 'Distance on roads' : 'Distance (straight-line)',
          `${trip.km.toFixed(1)} km`,
          'var(--nova-rage-600)',
        ],
        ['clock', 'Duration', hm(trip.durationMin), '#187A32'],
        ['gauge', 'Avg speed', `${trip.avg} km/h`, '#C56200'],
        ['zap', 'Peak speed', `${trip.peak} km/h`, '#C2323A'],
      ]
    : [];
}
