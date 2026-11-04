import { formatIst } from '../../utils/redesign/format';

export function destinationName(place) {
  if (place?.name && place.name !== 'Unnamed place') return place.name;
  const locality = place?.locality || place?.town || place?.siteAddress?.locality;
  return locality ? `Unnamed stop near ${locality}` : 'Unnamed stop';
}

export function evidence(destination) {
  const match = destination?.reason?.match(/\((\d+) of (\d+) times\)/i);
  if (!match) return '';
  const count = Number(match[1]);
  if (count === 1) return 'seen once — weak guess';
  if (count === 2) return 'seen twice — weak guess';
  return `seen ${count} of ${match[2]} times${count >= 5 ? ' — strong guess' : ''}`;
}

export function heldReason(data) {
  const basis = data?.basis?.text || '';
  if (/last fix.*is not near any of this org.s places/i.test(basis)) {
    return 'On the road between places — we’ll guess once it reaches or leaves a known place';
  }
  return data?.why?.text || data?.heldWhy?.text || basis || data?.noPredictionWhy?.text || 'Not enough information to guess yet.';
}

export function destinationHeading(destination) {
  const eta = destination?.eta?.at;
  const time = eta && new Date(eta).getTime() > Date.now() ? ` · ETA ${formatIst(eta)}` : '';
  const km = destination?.route?.km;
  return `→ ${destinationName(destination?.place)}${time}${Number.isFinite(km) ? ` · ${Math.round(km)} km` : ''}`;
}

export function routeLines(data, open, position) {
  if (!data || data.held || !Array.isArray(data.destinations)) return [];
  return data.destinations.slice(0, open ? 3 : 1).flatMap((destination, index) => {
    const points = destination.route?.polyline;
    if (!Array.isArray(points) || points.length < 2 || !points.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) return [];
    let start = 0;
    if (Number.isFinite(position?.lat) && Number.isFinite(position?.lng)) {
      let best = Infinity;
      points.forEach(([lat, lng], i) => {
        const distance = (lat - position.lat) ** 2 + ((lng - position.lng) * Math.cos(position.lat * Math.PI / 180)) ** 2;
        if (distance < best) { best = distance; start = i; }
      });
    }
    const path = points.slice(start).map(([lat, lng]) => ({ lat, lng }));
    if (path.length < 2) return [];
    return [{ path, index, weak: /weak guess/.test(evidence(destination)), destination }];
  });
}
