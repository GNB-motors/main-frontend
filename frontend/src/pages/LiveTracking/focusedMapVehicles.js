/* Which fleet markers the Live map draws. Selecting a truck focuses the map on
   it, so every other truck is hidden while one is selected. Replay hides them
   all too, because the replay marker is the truck at that point in history.
   With nothing selected, the whole fleet shows. */
export default function focusedMapVehicles(mapVehicles, { replayOn }) {
  if (replayOn) return [];
  return mapVehicles;
}
