/** Resolve recorded axle data without guessing from model names or vehicle weight. */
export function vehicleAxles(vehicle) {
  const count = vehicle?.axleCount == null ? null : Number(vehicle.axleCount);
  if (Number.isInteger(count) && count >= 2 && count <= 10) return count;
  const text = String(vehicle?.axleClass || '');
  const explicit = text.match(/\b(\d+)\s*[- ]?axl?e?s?\b/i);
  if (explicit && Number(explicit[1]) >= 2 && Number(explicit[1]) <= 10) return Number(explicit[1]);
  const drive = text.match(/\b(\d+)\s*[x×]\s*\d+\b/i);
  if (drive && Number(drive[1]) >= 4 && Number(drive[1]) <= 20 && Number(drive[1]) % 2 === 0)
    return Number(drive[1]) / 2;
  return null;
}
