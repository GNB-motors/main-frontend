import liveReplay from './liveReplay.js';
import { toLayers } from '../../lib/roadTrail.js';

/**
 * The truck's own word that it was standing: zero speed, or a PARKED state when
 * the fix has no speed. No distance threshold is guessed here — GPS jitter of a
 * parked truck is exactly what this collapses. `gapType` is NOT used: it
 * describes the gap before a fix, and moving fixes carry 'stationary' too
 * (WB11N9262, 5 Nov: 7 km/h and 12 km/h fixes tagged stationary).
 */
const isStationary = (p) => {
  const speed = p.speed == null ? null : Number(p.speed);
  if (speed != null && Number.isFinite(speed)) return speed === 0;
  return p.state === 'PARKED';
};

const byTime = (a, b) => Date.parse(a.eventDateTime) - Date.parse(b.eventDateTime);

/**
 * Collapse each run of consecutive stationary fixes into one point at the run's
 * centre, so a truck parked inside a plant draws one stop, not dotted jitter in
 * every direction (WB11N9262 at AMBUJA DHULAGOR, 5 Nov).
 * @returns {{ points: object[], stops: {lat:number,lng:number,from:string,to:string,fixes:number}[] }}
 */
export function collapseStops(points = []) {
  const valid = (points || [])
    .filter((p) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)) && p.eventDateTime)
    .slice()
    .sort(byTime);
  const out = [];
  const stops = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    const lat = run.reduce((s, p) => s + Number(p.latitude), 0) / run.length;
    const lng = run.reduce((s, p) => s + Number(p.longitude), 0) / run.length;
    const first = run[0];
    const last = run.at(-1);
    out.push({ ...first, latitude: lat, longitude: lng });
    stops.push({ lat, lng, from: first.eventDateTime, to: last.eventDateTime, fixes: run.length });
    run = [];
  };
  for (const p of valid) {
    if (isStationary(p)) run.push(p);
    else {
      flush();
      out.push(p);
    }
  }
  const endsStanding = run.length > 0;
  flush();
  // The truck is standing at its last stop right now (its own marker shows it).
  if (endsStanding) stops[stops.length - 1].current = true;
  return { points: out, stops };
}

export function buildPassiveTrail(points, road) {
  const { points: moves, stops } = collapseStops(points);
  const model = liveReplay.build(moves);
  const roadLayers = road?.mode === 'MATCHED' ? toLayers(road) : [];
  const gaps = [];
  for (let i = 1; i < model.fixes.length; i += 1) {
    if (liveReplay.breakBefore(model.fixes[i])) gaps.push({ pattern: 'dotted', path: [model.fixes[i - 1], model.fixes[i]].map(p => ({ lat: p.latitude, lng: p.longitude })) });
  }
  const paths = roadLayers.length ? roadLayers : model.segments.filter(s => s.coords.length > 1).map(s => ({ pattern: 'dotted', path: s.coords }));
  return { paths: [...paths, ...gaps], points: model.pts.map(([lat, lng]) => ({ lat, lng })), stops };
}
