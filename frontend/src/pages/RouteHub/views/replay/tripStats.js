import spanText from './replaySpan.js';

export default function tripStats(trip) {
  return trip
    ? [
        [
          'split',
          trip.distanceSource === 'road' ? 'Road distance' : 'Straight-line distance',
          `${Math.round(trip.km)} km`,
          'var(--nova-rage-600)',
        ],
        ['clock', 'Time span', spanText(trip.durationMin), '#187A32'],
        ['gauge', 'Avg speed', `${trip.avg} km/h`, '#C56200'],
        ['zap', 'Peak', `${trip.peak} km/h`, '#C2323A'],
      ]
    : [];
}
