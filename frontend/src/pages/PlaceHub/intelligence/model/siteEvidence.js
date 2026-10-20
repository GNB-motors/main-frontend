import { PURPOSE_LABEL } from './siteVocabulary.js';

const EVIDENCE_TEXT = {
  'FUEL|G2': (n) => `Tank level rose on ${n} stop${n === 1 ? '' : 's'}`,
  'FUEL|G5': (n) => `${n} fuel bill${n === 1 ? ' was' : 's were'} logged here`,
  'LOAD|G3': (n) => `Trucks left heavier than they came ${n} time${n === 1 ? '' : 's'}`,
  'LOAD|G5': (n) => `${n} ERP trip${n === 1 ? ' was' : 's were'} loaded here`,
  'LOAD|G1': (n) => `${n} stop${n === 1 ? '' : 's'} had the length and hours of loading`,
  'UNLOAD|G3': (n) => `Trucks left lighter than they came ${n} time${n === 1 ? '' : 's'}`,
  'UNLOAD|G5': (n) => `${n} ERP trip${n === 1 ? ' was' : 's were'} delivered here`,
  'UNLOAD|G1': (n) => `${n} stop${n === 1 ? '' : 's'} had the length and hours of unloading`,
  'SERVICE|G5': (n) => `${n} service record${n === 1 ? ' points' : 's point'} here`,
  'OVERNIGHT|G1': (n) => `Trucks stayed overnight ${n} time${n === 1 ? '' : 's'}`,
  'REST|G1': (n) => `${n} stop${n === 1 ? ' was' : 's were'} meal- or rest-length breaks`,
  'QUEUE|G1': (n) => `${n} short wait${n === 1 ? '' : 's'} in a queue`,
};

/** Sensor and records are hard proof; timing patterns alone are a clue. */
const GROUP_KIND = { G1: 'pattern', G2: 'sensor', G3: 'sensor', G5: 'record', G6: 'map' };

/**
 * The engine's reasons as sentences, strongest proof first:
 * [{ id, text, kind: 'sensor'|'record'|'pattern'|'map'|'gap' }].
 */
export function evidenceLines(engine) {
  if (!engine) return [];
  const rank = { sensor: 0, record: 1, map: 2, pattern: 3 };
  const lines = (engine.evidence || [])
    .filter((e) => e && e.stops > 0)
    .map((e) => {
      const key = `${e.purpose}|${e.group}`;
      const kind = GROUP_KIND[e.group] || 'pattern';
      const text = EVIDENCE_TEXT[key]
        ? EVIDENCE_TEXT[key](e.stops)
        : e.group === 'G6'
          ? `Maps list a ${(PURPOSE_LABEL[e.purpose] || e.purpose).toLowerCase()} place here`
          : `${e.stops} stop${e.stops === 1 ? '' : 's'} looked like ${(PURPOSE_LABEL[e.purpose] || e.purpose).toLowerCase()}`;
      return { id: key, text, kind };
    })
    .sort((a, b) => rank[a.kind] - rank[b.kind]);
  const n = engine.unexplainedStops || 0;
  if (n > 0)
    lines.push({
      id: 'unexplained',
      text: `${n} stop${n === 1 ? '' : 's'} nothing explains`,
      kind: 'gap',
    });
  return lines;
}

/**
 * What trucks do here, as shares of stops (drops slivers under 3%). A flat
 * spread is the prior talking, not the trucks, so it is not shown at all.
 */
export function purposeShares(engine) {
  const alpha = engine?.purposeAlpha;
  if (!alpha) return [];
  const total = Object.values(alpha).reduce((s, v) => s + (Number(v) || 0), 0);
  if (!total) return [];
  const shares = Object.entries(alpha).map(([purpose, v]) => ({
    purpose,
    v: (Number(v) || 0) / total,
  }));
  if (Math.max(...shares.map((x) => x.v)) < 0.25) return [];
  return Object.entries(alpha)
    .map(([purpose, v]) => ({
      purpose,
      label: PURPOSE_LABEL[purpose] || purpose,
      share: (Number(v) || 0) / total,
    }))
    .filter((p) => p.share >= 0.03)
    .sort((a, b) => b.share - a.share);
}
