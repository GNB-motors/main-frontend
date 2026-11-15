/**
 * Lineage: the trip that replaced this one, and the reason a trip's chain could not be
 * resolved — pure.
 *
 * `supersededBy` is a trip KEY (`<vehicleId>|<ISO time>`), not an _id, so it never goes into
 * a trip URL: the only thing to link to is the truck's trips around that time.
 */
import { tripListHref } from './tripWorkspace';
import { istDayString, shiftDay } from '../../utils/dateUtils';

/** Why a trip needs a second look after a recompute. */
export const NEEDS_REVIEW_LABEL = {
  LINEAGE_SPLIT: 'Split from another trip',
  LINEAGE_MERGE: 'Merged with another trip',
  LINEAGE_ORPHAN: 'Left without a trip chain',
};

/** The reason a trip needs a second look, in plain words. Null when there is none. */
export function needsReviewLabel(trip) {
  const reason = trip?.needsReview;
  if (typeof reason !== 'string' || !reason.trim()) return null;
  return NEEDS_REVIEW_LABEL[reason.trim()] || reason.trim();
}

/** The time in a trip key: the part after its last "|", when that part is a time. */
export function parseTripKey(key) {
  if (typeof key !== 'string') return null;
  const cut = key.lastIndexOf('|');
  const time = cut < 0 ? '' : key.slice(cut + 1);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(time)) return null;
  return { time };
}

/** The truck a trip belongs to: an id, or an object that holds one. */
function vehicleIdOf(trip) {
  const vehicle = trip?.vehicleId;
  if (typeof vehicle === 'string') return vehicle.trim() || null;
  const id = vehicle?._id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

/**
 * The truck's trips around the time of the trip that replaced this one. Null when the
 * trip has no truck, or no time to look around.
 */
export function supersededTripsHref(trip) {
  const vehicleId = vehicleIdOf(trip);
  if (!vehicleId) return null;
  const time =
    parseTripKey(trip?.supersededBy)?.time || trip?.pickup?.at || trip?.pickup?.arrivedAt;
  if (!time) return null;
  const day = istDayString(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const params = new URLSearchParams();
  params.set('vehicleId', vehicleId);
  params.set('range', 'custom');
  params.set('from', shiftDay(day, -1));
  params.set('to', shiftDay(day, 1));
  return tripListHref(params);
}
