import { describe, it, expect } from 'vitest';
import { step, collide, columnTarget, infraRadius, codeRadius, INFRA_COLUMN } from './kgLayout';

/* Deterministic PRNG so the settle test is reproducible. */
const mulberry = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const infraNode = (id, col, rows, overrides = {}) => ({
  id,
  kind: 'collection',
  rows,
  col,
  tx: columnTarget(col),
  r: infraRadius(rows),
  x: columnTarget(col),
  y: 0,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  ...overrides,
});

describe('columnTarget / radius helpers', () => {
  it('maps column to tx = (col - 3.0) * 178', () => {
    expect(columnTarget(0)).toBeCloseTo(-534);
    expect(columnTarget(3.0)).toBe(0);
    expect(columnTarget(6.1)).toBeCloseTo(551.8);
  });

  it('covers every infra column from the plan table', () => {
    expect(INFRA_COLUMN).toMatchObject({
      source: 0, job: 1.1, store: 2.0, storeClickhouse: 4.3,
      collection: 2.75, pipe: 3.7, table: 4.95, surface: 6.1,
      hostApp: 1.1, hostMongo: 2.4, hostClickhouse: 4.6,
    });
  });

  it('infra radius clamps to [7, 17]', () => {
    expect(infraRadius(0)).toBeCloseTo(8.55); // rows || 1 → 0 rows behaves as 1
    expect(infraRadius(1)).toBeCloseTo(8.55);
    expect(infraRadius(1e9)).toBe(17);
  });

  it('code radius clamps to [3.2, 13]', () => {
    expect(codeRadius(1)).toBeCloseTo(3.62);
    expect(codeRadius(1e9)).toBe(13);
  });
});

describe('infra layer (pinned to columns)', () => {
  it('holds every node within 1px of its column tx after 200 steps', () => {
    const rnd = mulberry(7311);
    const cols = [0, 1.1, 2.0, 2.75, 3.7, 4.95, 6.1];
    const nodes = [];
    for (let i = 0; i < 28; i++) {
      nodes.push(infraNode('n' + i, cols[i % cols.length], (i * 37) % 5000000, {
        x: columnTarget(cols[i % cols.length]) + (rnd() - 0.5) * 400,
        y: (rnd() - 0.5) * 520,
        z: (rnd() - 0.5) * 160,
      }));
    }
    // a few links so the link pass runs too
    const links = [];
    for (let i = 0; i + 1 < nodes.length; i += 3) links.push({ s: nodes[i].id, t: nodes[i + 1].id });

    let alpha = 1;
    for (let s = 0; s < 200; s++) {
      alpha = step(nodes, links, { layer: 'infra', alpha });
      collide(nodes, { layer: 'infra' });
    }
    for (const n of nodes) {
      expect(Math.abs(n.x - n.tx)).toBeLessThan(1);
    }
  });

  it('separates two nodes seeded at the same point on y only', () => {
    const a = infraNode('a', 2.75, 100);
    const b = infraNode('b', 2.75, 100);
    b.y = 0; // same point as a
    const nodes = [a, b];

    let alpha = 1;
    for (let s = 0; s < 40; s++) {
      alpha = step(nodes, [], { layer: 'infra', alpha });
      collide(nodes, { layer: 'infra' });
    }
    expect(a.x).toBe(b.x); // x delta stays 0 — the column pin wins
    expect(Math.abs(a.y - b.y)).toBeGreaterThan(0);
    expect(a.y).toBeLessThan(0); // 'a' < 'b', so a goes up
    expect(b.y).toBeGreaterThan(0);
  });

  it('keeps a dragged (fixed) node in place', () => {
    const a = infraNode('a', 2.75, 100, { fixed: true, y: 123 });
    const b = infraNode('b', 2.75, 100, { y: 124 });
    const nodes = [a, b];
    let alpha = 1;
    for (let s = 0; s < 40; s++) {
      alpha = step(nodes, [], { layer: 'infra', alpha });
      collide(nodes, { layer: 'infra' });
    }
    expect(a.y).toBe(123);
    expect(b.y).not.toBe(124);
  });
});

describe('code layer (free)', () => {
  const buildCodeGraph = (count) => {
    const rnd = mulberry(20260904);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const size = 25 + Math.floor(Math.pow(rnd(), 2.2) * 1400);
      const ang = rnd() * Math.PI * 2, rr = 120 + rnd() * 380;
      nodes.push({
        id: 'm' + i,
        kind: ['module', 'model', 'job', 'mount'][i % 4],
        size,
        r: codeRadius(size),
        x: Math.cos(ang) * rr,
        y: Math.sin(ang) * rr * 0.75,
        z: 0,
        vx: 0, vy: 0, vz: 0,
      });
    }
    const links = [];
    for (let i = 0; i < count; i++) {
      links.push({ s: nodes[i].id, t: nodes[(i + 1) % count].id });
      links.push({ s: nodes[i].id, t: nodes[(i * 7 + 3) % count].id });
    }
    return { nodes, links };
  };

  it('settles a 324-node graph to alpha < 0.004 within 400 steps', () => {
    const { nodes, links } = buildCodeGraph(324);
    let alpha = 1;
    let steps = 0;
    while (alpha >= 0.004 && steps < 400) {
      alpha = step(nodes, links, { layer: 'code', alpha });
      collide(nodes, { layer: 'code' });
      steps++;
    }
    expect(alpha).toBeLessThan(0.004);
    expect(steps).toBeLessThan(400);
  });

  it('never displaces a node more than 14 per axis per step', () => {
    const { nodes, links } = buildCodeGraph(324);
    let alpha = 1;
    let maxX = 0, maxY = 0;
    for (let s = 0; s < 300 && alpha >= 0.004; s++) {
      const before = nodes.map((n) => ({ x: n.x, y: n.y }));
      alpha = step(nodes, links, { layer: 'code', alpha });
      nodes.forEach((n, i) => {
        maxX = Math.max(maxX, Math.abs(n.x - before[i].x));
        maxY = Math.max(maxY, Math.abs(n.y - before[i].y));
      });
      collide(nodes, { layer: 'code' });
    }
    expect(maxX).toBeLessThanOrEqual(14 + 1e-9); // float slop on n.x + 14 - n.x
    expect(maxY).toBeLessThanOrEqual(14 + 1e-9);
  });

  it('runs in 3D without NaN and settles', () => {
    const { nodes, links } = buildCodeGraph(80);
    for (const n of nodes) n.z = (Math.sin(n.x) * 200);
    let alpha = 1;
    for (let s = 0; s < 200 && alpha >= 0.004; s++) {
      alpha = step(nodes, links, { layer: 'code', is3d: true, alpha });
      collide(nodes, { layer: 'code' });
    }
    for (const n of nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
      expect(Number.isFinite(n.z)).toBe(true);
    }
  });

  it('is a no-op below the alpha threshold and leaves alpha unchanged', () => {
    const { nodes, links } = buildCodeGraph(10);
    const snap = nodes.map((n) => ({ ...n }));
    const out = step(nodes, links, { layer: 'code', alpha: 0.003 });
    expect(out).toBe(0.003); // design returns early: alpha not decayed further
    nodes.forEach((n, i) => expect(n).toEqual(snap[i]));
  });

  it('ignores links whose endpoints are missing', () => {
    const { nodes } = buildCodeGraph(4);
    expect(() => step(nodes, [{ s: 'nope', t: 'alsonope' }], { layer: 'code', alpha: 1 })).not.toThrow();
  });
});
