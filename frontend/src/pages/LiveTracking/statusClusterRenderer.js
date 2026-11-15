const COLORS = { moving: '#0C9F41', stopped: '#9333EA', idling: '#F97316', offline: '#9CA3AF' };

export function statusClusterSvg(markers = []) {
  const counts = { moving: 0, stopped: 0, idling: 0, offline: 0 };
  for (const marker of markers) {
    const key = String(marker.fleetStatus || 'offline').toLowerCase();
    counts[Object.hasOwn(counts, key) ? key : 'offline'] += 1;
  }
  const total = markers.length || 1;
  let offset = 0;
  const segments = Object.entries(counts).filter(([, count]) => count).map(([status, count]) => {
    const share = count / total * 100;
    const segment = `<circle cx="24" cy="24" r="19" pathLength="100" fill="none" stroke="${COLORS[status]}" stroke-width="4" stroke-dasharray="${share} ${100-share}" stroke-dashoffset="-${offset}" transform="rotate(-90 24 24)"/>`;
    offset += share;
    return segment;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="19" fill="white"/>${segments}</svg>`;
}

export function createStatusClusterRenderer(isDimmed = () => false) {
  return { render({ count, position, markers }) {
    const maps = window.google.maps;
    return new maps.Marker({ position, opacity: isDimmed() ? 0.4 : 1, icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(statusClusterSvg(markers))}`, scaledSize: new maps.Size(40, 40), anchor: new maps.Point(20, 20) }, label: { text: String(count), color: '#253b5c', fontSize: '12px', fontWeight: '700' }, title: `${count} vehicles. Click to zoom in.`, zIndex: 600 });
  } };
}
