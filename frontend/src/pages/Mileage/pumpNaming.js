export function refuelCoords(row) {
  const lat = row.coords?.lat ?? row.raw?.sensor?.lat;
  const lng = row.coords?.lng ?? row.raw?.sensor?.lng;
  return typeof lat === 'number' &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}
