/* Which fleet markers the Live map draws. Trail and Replay are about one truck,
   so every other truck is hidden while either is up: Trail keeps the selected
   truck's live marker beside its path; Replay hides it too, because the replay
   marker is the truck at that point in history. */
export default function focusedMapVehicles(mapVehicles, { selectedId, isTrailVisible, replayOn }) {
  if (replayOn) return [];
  if (isTrailVisible && selectedId) return mapVehicles.filter((v) => v.id === selectedId);
  return mapVehicles;
}
