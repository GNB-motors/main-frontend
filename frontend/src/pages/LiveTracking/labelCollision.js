const priority = { moving: 0, idling: 1, stopped: 2, offline: 3 };

// Labels are 104 by 19 px, centred on each marker and offset below it.
export function visibleVehicleLabels(vehicles, selectedId, project) {
  const boxes = [];
  const visible = new Set();
  const sorted = [...vehicles].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || (priority[a.status] ?? 4) - (priority[b.status] ?? 4) || (a.ago ?? Infinity) - (b.ago ?? Infinity));
  for (const v of sorted) {
    const point = project(v);
    if (!point) continue;
    const box = { x: point.x - 52, y: point.y + 16, right: point.x + 52, bottom: point.y + 35 };
    if (boxes.some(other => box.x < other.right && box.right > other.x && box.y < other.bottom && box.bottom > other.y)) continue;
    boxes.push(box);
    visible.add(v.id);
  }
  return visible;
}
