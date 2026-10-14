const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function windowForRange(range, from, to) {
  const now = new Date();
  if (range === 'today') return { from: startOfDay(now), to: now };
  if (range === 'yesterday') {
    const y = startOfDay(new Date(now.getTime() - 86400000));
    return { from: y, to: new Date(y.getTime() + 86400000 - 1) };
  }
  if (range === '7d') return { from: startOfDay(new Date(now.getTime() - 6 * 86400000)), to: now };
  return { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) };
}

/**
 * The replay window for a picked ERP trip.
 *
 * Prefers the warehouse anchors — the yard exit and return are the trip's real
 * boundaries. Falls back to the ERP timestamps, padded by an hour either side, so an
 * un-anchored trip still shows the approach and the park rather than cutting the
 * trail off at a typed timestamp.
 */
export function tripWindow(t) {
  const a = t?.warehouseAnchors || {};
  if (a.exitedAt && a.arrivedAt) {
    return { from: new Date(a.exitedAt), to: new Date(a.arrivedAt) };
  }
  const start = a.exitedAt || t?.dispatchedAt || t?.tripDate;
  const end = a.arrivedAt || t?.tripClosedAt || t?.unloadedAt || new Date();
  const PAD_MS = 3600 * 1000;
  return {
    from: new Date(new Date(start).getTime() - PAD_MS),
    to: new Date(new Date(end).getTime() + PAD_MS),
  };
}
