import { describe, it, expect } from 'vitest';
import { hashOf, hoverMeta, prepareSimGraph, PARTICLE_EDGE_CAP } from './kgPrep';

const codeNode = (id, extra = {}) => ({ id, kind: 'module', label: id, ...extra });

describe('hashOf', () => {
  it('is deterministic and order-sensitive', () => {
    expect(hashOf('module:a')).toBe(hashOf('module:a'));
    expect(hashOf('module:a')).not.toBe(hashOf('module:b'));
  });
});

describe('hoverMeta', () => {
  it('reports measured nodes with their real metrics only', () => {
    expect(hoverMeta({ kind: 'table', state: 'measured', metrics: { rows: 42 } })).toBe(
      'table · 42 rows',
    );
    expect(hoverMeta({ kind: 'module', state: 'measured', meta: { totalLoc: 7 } })).toBe(
      'module · 7 loc',
    );
    expect(hoverMeta({ kind: 'module', state: 'measured' })).toBe('module');
  });

  it('names the honest absence for non-measured states and ghosts', () => {
    expect(hoverMeta({ kind: 'model', state: 'declared' })).toBe(
      'model · no measurement on record',
    );
    expect(hoverMeta({ kind: 'store', state: 'unreachable' })).toBe('store · unreachable');
    expect(hoverMeta({ kind: 'model', ghost: true })).toBe(
      'model · removed in the compared manifest',
    );
  });
});

describe('prepareSimGraph — code layer', () => {
  const graph = {
    nodes: [codeNode('a', { meta: { totalLoc: 1000 } }), codeNode('b', { kind: 'model' })],
    links: [{ source: 'a', target: 'b', kind: 'reads' }],
  };

  it('sizes modules by totalLoc and non-modules at the representative size', () => {
    const out = prepareSimGraph({ graph, layer: 'code', mode: '2d', prevKey: 'code|2d' });
    expect(out.simNodes.find((n) => n.id === 'a').r).toBeGreaterThan(
      out.simNodes.find((n) => n.id === 'b').r,
    );
    expect(Number.isFinite(out.simNodes.find((n) => n.id === 'b').r)).toBe(true);
  });

  it('seeds coordinates deterministically from the node id', () => {
    const g1 = prepareSimGraph({ graph, layer: 'code', mode: '2d', prevKey: 'code|2d' });
    const g2 = prepareSimGraph({ graph, layer: 'code', mode: '2d', prevKey: 'code|2d' });
    g1.simNodes.forEach((n, i) => {
      expect(n.x).toBe(g2.simNodes[i].x);
      expect(n.y).toBe(g2.simNodes[i].y);
      expect(n.z).toBe(g2.simNodes[i].z);
    });
  });

  it('keeps existing coordinates and zeroes velocities', () => {
    const placed = {
      nodes: [{ id: 'a', kind: 'module', x: 5, y: -3, z: 2 }],
      links: [],
    };
    const out = prepareSimGraph({ graph: placed, layer: 'code', mode: '2d', prevKey: 'code|2d' });
    expect(out.simNodes[0].x).toBe(5);
    expect(out.simNodes[0].vy).toBe(0);
  });

  it('weights edges by live ops and reports layer/mode changes', () => {
    const out = prepareSimGraph({ graph, layer: 'code', mode: '2d', prevKey: 'infra|2d' });
    expect(out.layerChanged).toBe(true);
    expect(out.modeChanged).toBe(false);
  });
});

describe('prepareSimGraph — infra layer', () => {
  const infraGraph = () => ({
    nodes: [
      { id: 'host:1', kind: 'host', label: 'host:1' },
      { id: 'store:mongo', kind: 'store', label: 'mongo' },
      { id: 'collection:c', kind: 'collection', hostId: 'host:1' },
    ],
    links: [
      { source: 'host:1', target: 'collection:c', kind: 'hosts' },
      { source: 'store:mongo', target: 'collection:c', kind: 'contains' },
      { source: 'collection:c', target: 'store:mongo', kind: 'mirrors' },
    ],
  });

  it('hosts get radius 0 and are not simulated', () => {
    const out = prepareSimGraph({
      graph: infraGraph(),
      layer: 'infra',
      mode: '2d',
      prevKey: 'infra|2d',
    });
    expect(out.simNodes.some((n) => n.id === 'host:1')).toBe(false);
    expect(out.hostById.has('host:1')).toBe(true);
  });

  it('structural links stay in the sim but never reach the draw pass', () => {
    const out = prepareSimGraph({
      graph: infraGraph(),
      layer: 'infra',
      mode: '2d',
      prevKey: 'infra|2d',
    });
    expect(out.simLinks.length).toBe(3);
    const kinds = out.drawLinks.map((l) => l.kind);
    expect(kinds).not.toContain('hosts');
    expect(kinds).not.toContain('contains');
    expect(kinds).toContain('mirrors');
  });

  it('mirrors edges are the CDC spine and carry particles', () => {
    const out = prepareSimGraph({
      graph: infraGraph(),
      layer: 'infra',
      mode: '2d',
      prevKey: 'infra|2d',
    });
    const m = out.drawLinks.find((l) => l.kind === 'mirrors');
    expect(m.traffic).toBe(true);
  });

  it('the particle budget keeps only the busiest edges', () => {
    const nodes = [
      { id: 'a', kind: 'module', live: true },
      { id: 'b', kind: 'module' },
    ];
    const links = [];
    for (let i = 0; i < PARTICLE_EDGE_CAP + 10; i += 1) {
      const t = `t${i}`;
      nodes.push({ id: t, kind: 'model', ops: i });
      links.push({ source: 'a', target: t, kind: 'reads' });
    }
    const out = prepareSimGraph({
      graph: { nodes, links },
      layer: 'code',
      mode: '2d',
      prevKey: 'code|2d',
    });
    const withParticles = out.drawLinks.filter((l) => l.traffic);
    expect(withParticles.length).toBe(PARTICLE_EDGE_CAP);
    expect(withParticles.some((l) => endIdOf(l.target) === 't0')).toBe(false);
  });
});

const endIdOf = (x) => (typeof x === 'object' && x !== null ? x.id : x);
