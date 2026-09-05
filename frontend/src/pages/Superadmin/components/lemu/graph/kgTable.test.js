import {
  STATE_ORDER, rowState, scaleOf, evidenceAt, stamp,
  hopDistances, compareNodes, sortNodes,
} from './kgTable';

const node = (over = {}) => ({ id: 'store:x', kind: 'store', label: 'x', ...over });

describe('rowState — real state only (§0 C2)', () => {
  it('passes the three real states through', () => {
    expect(rowState(node({ state: 'measured' }))).toBe('measured');
    expect(rowState(node({ state: 'declared' }))).toBe('declared');
    expect(rowState(node({ state: 'unreachable' }))).toBe('unreachable');
  });

  it('code-layer nodes carry no state and read measured (the manifest scan measured them)', () => {
    expect(rowState(node())).toBe('measured');
    expect(rowState(node({ state: null }))).toBe('measured');
  });

  it('diff ghosts (state: removed) read hollow, never measured', () => {
    expect(rowState(node({ state: 'removed', ghost: true }))).toBe('declared');
  });
});

describe('STATE_ORDER — attention sorts to the top', () => {
  it('is unreachable -> declared -> measured', () => {
    expect(STATE_ORDER.unreachable).toBeLessThan(STATE_ORDER.declared);
    expect(STATE_ORDER.declared).toBeLessThan(STATE_ORDER.measured);
  });
});

describe('scaleOf — never invented (§0 C5)', () => {
  it('a measured code module reports modules[].totalLoc', () => {
    expect(scaleOf(node({ kind: 'module', state: 'measured', meta: { totalLoc: 4213 } }))).toBe(4213);
  });

  it('non-measured nodes have no scale, even with a totalLoc', () => {
    expect(scaleOf(node({ kind: 'module', state: 'declared', meta: { totalLoc: 4213 } }))).toBeNull();
  });

  it('measured infra nodes have no single scale field -> null', () => {
    expect(scaleOf(node({ kind: 'collection', state: 'measured', metrics: { collectionCount: 7 } }))).toBeNull();
  });

  it('measured modules without a numeric totalLoc -> null', () => {
    expect(scaleOf(node({ kind: 'module', state: 'measured', meta: {} }))).toBeNull();
    expect(scaleOf(node({ kind: 'module', state: 'measured' }))).toBeNull();
  });
});

describe('evidenceAt — evTs <- evidence.at (§0 C2)', () => {
  it('prefers the node own evidence timestamp', () => {
    expect(evidenceAt(node({ state: 'measured', evidence: { at: '2026-09-04T04:02:11Z' } })))
      .toBe('2026-09-04T04:02:11Z');
  });

  it('code-layer nodes fall back to the manifest scan time', () => {
    expect(evidenceAt(node(), '2026-09-03T10:00:00Z')).toBe('2026-09-03T10:00:00Z');
  });

  it('state-bearing nodes never borrow the manifest scan time', () => {
    expect(evidenceAt(node({ state: 'declared' }), '2026-09-03T10:00:00Z')).toBeNull();
  });

  it('returns null when nothing real exists', () => {
    expect(evidenceAt(node())).toBeNull();
    expect(evidenceAt(null)).toBeNull();
  });
});

describe('stamp — UTC, design line ~470', () => {
  it('formats as YYYY-MM-DD HH:MM:SS', () => {
    expect(stamp('2026-09-04T04:02:11Z')).toBe('2026-09-04 04:02:11');
    expect(stamp('2026-01-09T14:02:11+05:30')).toBe('2026-01-09 08:32:11');
  });

  it('returns null for missing/unparseable input', () => {
    expect(stamp(null)).toBeNull();
    expect(stamp('not-a-date')).toBeNull();
  });
});

describe('hopDistances — BFS from the selection', () => {
  const links = [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
    { source: 'c', target: 'd' },
    { source: 'x', target: 'y' }, // disconnected island
  ];

  it('reports shortest symmetric distance for every reachable node', () => {
    const hops = hopDistances(links, 'b');
    expect(hops.get('b')).toBe(0);
    expect(hops.get('a')).toBe(1);
    expect(hops.get('c')).toBe(1);
    expect(hops.get('d')).toBe(2);
    expect(hops.has('x')).toBe(false);
  });

  it('returns an empty map without a selection', () => {
    expect(hopDistances(links, null).size).toBe(0);
    expect(hopDistances([], 'a').get('a')).toBe(0);
  });

  it('terminates on cycles', () => {
    const cyclic = [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }];
    const hops = hopDistances(cyclic, 'a');
    expect(hops.get('a')).toBe(0);
    expect(hops.get('b')).toBe(1);
    expect(hops.size).toBe(2);
  });
});

describe('compareNodes / sortNodes — the design sort, real fields', () => {
  const nodes = [
    node({ id: 'a', label: 'alpha', state: 'measured' }),
    node({ id: 'b', label: 'bravo', state: 'unreachable' }),
    node({ id: 'c', label: 'charlie', state: 'declared' }),
  ];

  it('state ascending puts unreachable first, then declared, then measured', () => {
    const sorted = sortNodes(nodes, 'state', 1);
    expect(sorted.map((n) => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('direction flips the whole order', () => {
    const sorted = sortNodes(nodes, 'state', -1);
    expect(sorted.map((n) => n.id)).toEqual(['a', 'c', 'b']);
  });

  it('name sorts by label, case-sensitive locale order', () => {
    const sorted = sortNodes(nodes, 'name', 1);
    expect(sorted.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('scale ascending puts unscaled nodes (0) before scaled ones', () => {
    const withScale = [
      node({ id: 'm1', label: 'm1', kind: 'module', state: 'measured', meta: { totalLoc: 500 } }),
      node({ id: 'm2', label: 'm2', kind: 'module', state: 'measured', meta: { totalLoc: 5 } }),
      node({ id: 's1', label: 's1', state: 'measured' }),
    ];
    expect(sortNodes(withScale, 'scale', 1).map((n) => n.id)).toEqual(['s1', 'm2', 'm1']);
  });

  it('err sorts by errorCount ascending', () => {
    const withErr = [node({ id: 'e2', errorCount: 9 }), node({ id: 'e1', errorCount: 1 }), node({ id: 'e0' })];
    expect(sortNodes(withErr, 'err', 1).map((n) => n.id)).toEqual(['e0', 'e1', 'e2']);
  });

  it('ev sorts by real evidence time; missing evidence reads 0 (oldest first)', () => {
    const withEv = [
      node({ id: 'v2', state: 'measured', evidence: { at: '2026-09-04T00:00:00Z' } }),
      node({ id: 'v1', state: 'measured', evidence: { at: '2026-09-01T00:00:00Z' } }),
    ];
    expect(sortNodes(withEv, 'ev', 1).map((n) => n.id)).toEqual(['v1', 'v2']);
  });

  it('ev falls back to the manifest scan time for code-layer nodes', () => {
    const a = node({ id: 'old' });
    const b = node({ id: 'new', state: 'measured', evidence: { at: '2026-09-05T00:00:00Z' } });
    const ctx = { measuredAt: '2026-09-01T00:00:00Z' };
    expect(compareNodes(a, b, 'ev', ctx)).toBeLessThan(0);
  });

  it('hop sorts reachable nodes by distance; unreachable sink below', () => {
    const links = [{ source: 'sel', target: 'near' }, { source: 'near', target: 'far' }];
    const rows = [
      node({ id: 'far' }), node({ id: 'sel' }), node({ id: 'near' }), node({ id: 'off' }),
    ];
    const ctx = { hops: hopDistances(links, 'sel') };
    expect(sortNodes(rows, 'hop', 1, ctx).map((n) => n.id)).toEqual(['sel', 'near', 'far', 'off']);
  });

  it('does not mutate the input array', () => {
    const input = [nodes[2], nodes[0], nodes[1]];
    sortNodes(input, 'name', 1);
    expect(input.map((n) => n.id)).toEqual(['c', 'a', 'b']);
  });
});
