/* Which fleet markers the Live map draws. Selecting a truck focuses the map on
   it, so every other truck is hidden while one is selected. Replay hides them
   all too, because the replay marker is the truck at that point in history.
   With nothing selected, the whole fleet shows. */
export default function focusedMapVehicles(mapVehicles, { selectedId, replayOn }) {
  if (replayOn) return [];
  if (selectedId != null) return mapVehicles.filter((vehicle) => vehicle.id === selectedId);
  return mapVehicles;
}
