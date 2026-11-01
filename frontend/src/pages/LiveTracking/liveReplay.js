import sampleAt from '../RouteHub/views/replay/sampleAt.js';

// Gap flags split observed trail segments and distance totals, independent of visual playback.
const breakBefore = (p) => Boolean(p.break || p.gap || p.gapType || p.sparse);

function build(points = []) {
  const fixes = points
    .filter((p) => p.latitude != null && p.longitude != null && p.eventDateTime)
    .map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      at: Date.parse(p.eventDateTime),
    }))
    .filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Math.abs(p.latitude) <= 90 &&
        Number.isFinite(p.longitude) &&
        Math.abs(p.longitude) <= 180 &&
        Number.isFinite(p.at),
    )
    .sort((a, b) => a.at - b.at)
    .filter((p, i, all) => i === 0 || p.at !== all[i - 1].at);
  const segments = [];
  fixes.forEach((p, i) => {
    if (!i || breakBefore(p)) segments.push({ start: i, coords: [] });
    segments.at(-1).coords.push({ lat: p.latitude, lng: p.longitude });
  });
  const span = fixes.length ? Math.max(1, fixes.at(-1).at - fixes[0].at) : 1;
  const clock = {
    fixes: fixes.map((p) => ({
      ll: [p.latitude, p.longitude],
      at: new Date(p.at),
      t: (p.at - fixes[0].at) / span,
      speed: p.speed == null ? null : Math.round(p.speed),
      km: 0,
    })),
  };
  return { fixes, segments, clock, pts: fixes.map((p) => [p.latitude, p.longitude]) };
}

function sample(model, fraction) {
  const { fixes, clock, pts } = model;
  if (fixes.length < 2) return null;
  const frame = sampleAt(clock, fraction);
  const position = { lat: frame.ll[0], lng: frame.ll[1] };
  const path = pts
    .slice(0, frame.upto)
    .map(([lat, lng]) => ({ lat, lng }))
    .concat(position);
  return {
    at: frame.at.getTime(),
    position,
    paths: [{ key: fixes[0].eventDateTime, path }],
    speed: frame.speed,
  };
}

export default { build, sample, breakBefore };
