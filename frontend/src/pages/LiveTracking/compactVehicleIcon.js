import { createVehicleMarkerIcon } from './vehicleMarkerIcon.js';

/** Live fleet adapter for the truck marker used in Trip Details. */
export function compactVehicleIcon(
  vehicle,
  selected = false,
  showLabel = false,
  zoom = 12,
  cameraHeading = 0,
) {
  const course = Number(vehicle.courseDegrees ?? vehicle.heading ?? 0);
  return createVehicleMarkerIcon({
    status: vehicle.status || 'offline',
    courseDegrees: Number.isFinite(course) ? (((course - cameraHeading) % 360) + 360) % 360 : 0,
    plate: String(vehicle.plate || vehicle.registrationNumber || '').replace(/[<>&"']/g, ''),
    isSelected: selected,
    showLabel,
    forceLabel: showLabel,
    zoom,
  });
}
