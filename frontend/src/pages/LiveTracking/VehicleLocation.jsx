import PlaceLabel from '../../components/ui/PlaceLabel.jsx';

export default function VehicleLocation({ vehicle, showMap = false, compact = false, fallback = null }) {
  if (vehicle.area) return <span>{vehicle.area}</span>;
  if (
    !vehicle.hasFix ||
    !Number.isFinite(vehicle.lat) ||
    !Number.isFinite(vehicle.lng) ||
    Math.abs(vehicle.lat) > 90 ||
    Math.abs(vehicle.lng) > 180
  ) {
    return <span>GPS position unavailable</span>;
  }
  return (
    <PlaceLabel
      lat={vehicle.lat}
      lng={vehicle.lng}
      showMap={showMap}
      fallbackLinkLabel={compact || fallback ? null : 'View current location'}
      fallbackText={fallback || (compact ? (vehicle.status === 'moving' ? 'On the road' : 'Location not named') : null)}
    />
  );
}
