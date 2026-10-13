/** Position + speed at scrub fraction t, interpolated between bracketing fixes. */
export default function sampleAt(trip, t) {
  const { fixes } = trip;
  const clamped = Math.max(0, Math.min(1, t));
  let hi = fixes.findIndex((f) => f.t >= clamped);
  if (hi <= 0) hi = 1;
  const lo = hi - 1;
  const a = fixes[lo];
  const b = fixes[hi];
  const span = b.t - a.t || 1;
  const f = (clamped - a.t) / span;
  return {
    ll: [a.ll[0] + (b.ll[0] - a.ll[0]) * f, a.ll[1] + (b.ll[1] - a.ll[1]) * f],
    speed: b.speed ?? a.speed ?? 0,
    km: a.km + (b.km - a.km) * f,
    at: new Date(a.at.getTime() + (b.at.getTime() - a.at.getTime()) * f),
    upto: hi,
  };
}
