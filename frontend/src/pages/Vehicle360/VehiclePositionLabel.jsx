import PlaceLabel from '../../components/ui/PlaceLabel';
import { vehicleLocationName } from './panels/overview/referenceOverviewModel';

export default function VehiclePositionLabel({ position }) {
  const name = vehicleLocationName(position);
  const { latitude, longitude } = position || {};
  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  if (!valid || name !== 'Location not named') return name;
  return <PlaceLabel lat={latitude} lng={longitude} showMap={false} fallbackText={name} />;
}
