import { shiftYmd, periodRangeLabel } from '../Intelligence/intelligenceModel';
import { toISTDateString } from '@/utils/dateUtils';

export const referenceId = (value) => String(value?._id || value?.id || value || '');
export function profileWeeks(today = toISTDateString(new Date())) {
  return Array.from({ length: 4 }, (_, index) => {
    const from = shiftYmd(today, -27 + index * 7);
    return {
      from,
      to: shiftYmd(from, 6),
      label: periodRangeLabel(from, shiftYmd(from, 6)),
    };
  });
}
const number = (value) =>
  value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
export function tripsForDriver(trips, id) {
  return trips.filter((trip) => referenceId(trip.driverId) === id);
}
/** Distance belongs to the week a recorded trip was created; absent odometers stay unknown. */
export function weeklyTripFacts(trips, weeks) {
  return weeks.map((week) => {
    const rows = trips.filter((trip) => {
      const day = toISTDateString(trip.createdAt);
      return day && day >= week.from && day <= week.to;
    });
    const distances = rows.map((trip) => {
      const recorded = number(trip.mileage?.totalDistanceKm);
      if (recorded != null && recorded >= 0) return recorded;
      const start = number(trip.mileage?.startOdometer ?? trip.startOdometer);
      const end = number(trip.mileage?.endOdometer ?? trip.endOdometer);
      return start != null && end != null && end >= start ? end - start : null;
    });
    return {
      ...week,
      trips: rows.length,
      km: distances.every((value) => value != null)
        ? distances.reduce((sum, value) => sum + value, 0)
        : null,
    };
  });
}
/** A four-week total, or null when any week is unmeasured: a partial sum would read as the whole. */
export function weeklyTotal(weeks, key) {
  const values = weeks.map((week) => week[key]);
  return values.every((value) => value != null)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;
}
