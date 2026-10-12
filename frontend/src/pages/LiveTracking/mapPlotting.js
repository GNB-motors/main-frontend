/** Only rows the map can actually plot. */
export const withCoordinates = (positions) =>
  (positions || []).filter((p) => p.latitude != null && p.longitude != null);

/** Frame every plotted vehicle at once instead of a fixed country-wide zoom. */
export const fitMapToPositions = (map, located) => {
  if (!map || !window.google || !located?.length) return;

  if (located.length === 1) {
    map.setCenter({ lat: located[0].latitude, lng: located[0].longitude });
    map.setZoom(12);
    return;
  }

  const bounds = new window.google.maps.LatLngBounds();
  located.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
  map.fitBounds(bounds, 60);
};

/**
 * Compute the list of vehicles rendered on the map.
 * Ensures the actively selected vehicle NEVER vanishes from the map if
 * the user toggles a filter tab (e.g. from Moving to Stopped) or if its status changes.
 */
export const computeMapVehicles = (filteredVehicles = [], selectedVehicle = null) => {
  if (!selectedVehicle || !selectedVehicle.hasFix) return filteredVehicles;
  const isIncluded = filteredVehicles.some((v) => v.id === selectedVehicle.id);
  if (!isIncluded) {
    return [selectedVehicle, ...filteredVehicles];
  }
  return filteredVehicles;
};
