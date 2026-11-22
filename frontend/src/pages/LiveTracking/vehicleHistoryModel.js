import { fleetDestination } from '../../utils/redesign/fleetDestination';
import { tripLink } from '../../utils/redesign/links';
import { tripKm } from '../Vehicle360/panels/vehicleTripsModel';

const located = (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng);

export function vehicleHistoryRows(data, tab, registrationNumber) {
  if (tab === 'routes') {
    return (data?.items || [])
      .filter((trip) => trip._id)
      .map((trip) => ({
        id: `trip:${trip._id}`,
        title: `${trip.pickup?.name || 'Pickup not named'} → ${trip.drop?.name || 'Drop not identified'}`,
        at: trip.pickup?.departedAt || trip.pickup?.arrivedAt,
        endAt: trip.drop?.arrivedAt,
        km: tripKm(trip).total,
        to: tripLink(trip._id),
        description: 'Open this trip',
        points: [trip.pickup, trip.drop, ...(trip.extraDrops || [])].filter(located),
      }));
  }
  return (data?.items || [])
    .filter((item) => item.kind === 'VISIT')
    .map((item, index) => {
      const linkedTrip = fleetDestination(item.trip?.to);
      // A visit without a linked trip can still open its own recorded window.
      // Do not guess which delivery it belongs to from a nearby place name.
      const start = Date.parse(item.arrivedAt);
      const end = Date.parse(item.departedAt);
      const replay =
        Number.isFinite(start) && Number.isFinite(end) && end > start
          ? `/live-tracking?${new URLSearchParams({
              v: registrationNumber,
              from: item.arrivedAt,
              to: item.departedAt,
              at: item.arrivedAt,
            })}`
          : null;
      return {
        id: `visit:${item.arrivedAt}:${item.place?.id || index}`,
        title: item.place?.name || 'Place not identified',
        at: item.arrivedAt,
        endAt: item.departedAt,
        durationMin: item.dwellMin,
        to: linkedTrip || replay,
        description: linkedTrip
          ? 'Open this trip'
          : replay
            ? 'No linked trip · View this visit'
            : 'No linked trip',
        points: located(item.place) ? [item.place] : [],
      };
    });
}

export function vehicleHistoryPlaces(rows) {
  return rows.flatMap((row) =>
    row.points.map((point, index) => ({
      id: `${row.id}:${index}`,
      name: point.name || row.title,
      type: point.category || 'OTHER',
      status: 'CONFIRMED',
      lat: point.lat,
      lng: point.lng,
      to: row.to,
    })),
  );
}
