import spanText from './replaySpan.js';
import { isNoMovement, NO_MOVEMENT } from './replayMovement.js';

/**
 * The four figures above the replay canvas.
 *
 * A vehicle that never moved is a real answer: the distance says so in words
 * ("No movement in this period") and the measured 0 km stays beside it as a
 * labelled figure, so nobody reads a bare "0 km" as a broken measurement. A
 * measurement nobody took stays "—" instead of becoming a zero.
 */
export default function tripStats(trip) {
  if (!trip) return [];

  const km = Number.isFinite(Number(trip.km)) ? Number(trip.km) : null;
  const still = isNoMovement(trip);
  const distanceLabel = trip.distanceSource === 'road' ? 'Road distance' : 'Straight-line distance';

  return [
    [
      'split',
      distanceLabel,
      still ? NO_MOVEMENT : km == null ? '—' : `${Math.round(km)} km`,
      'var(--nova-rage-600)',
      still ? `${Math.round(km ?? 0)} km measured` : null,
    ],
    ['clock', 'Time span', spanText(trip.durationMin), '#187A32'],
    [
      'gauge',
      'Avg speed',
      trip.avg == null ? '—' : `${trip.avg} km/h`,
      '#C56200',
      still ? 'the vehicle never moved' : null,
    ],
    [
      'zap',
      'Peak',
      trip.peak == null ? '—' : `${trip.peak} km/h`,
      '#C2323A',
      still ? 'no speed was recorded' : null,
    ],
  ];
}
