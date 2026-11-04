import liveReplay from './liveReplay.js';
import { toLayers } from '../../lib/roadTrail.js';

export function buildPassiveTrail(points, road) {
  const model = liveReplay.build(points || []);
  const roadLayers = road?.mode === 'MATCHED' ? toLayers(road) : [];
  const gaps = [];
  for (let i = 1; i < model.fixes.length; i += 1) {
    if (liveReplay.breakBefore(model.fixes[i])) gaps.push({ pattern: 'dotted', path: [model.fixes[i - 1], model.fixes[i]].map(p => ({ lat: p.latitude, lng: p.longitude })) });
  }
  const paths = roadLayers.length ? roadLayers : model.segments.filter(s => s.coords.length > 1).map(s => ({ pattern: 'dotted', path: s.coords }));
  return { paths: [...paths, ...gaps], points: model.pts.map(([lat, lng]) => ({ lat, lng })) };
}
