import { describe, it, expect } from 'vitest';
import {
  nf,
  stampUTC,
  selfMeasuredSurface,
  detailText,
  valueFromDetail,
  evidenceVariant,
  requireCounts,
  metricsRows,
  ownedFunctionRows,
  errorWindowLabel,
  mirrorPanel,
} from './drawerModel';

const topoNode = (over = {}) => ({
  id: 'collection:vehicles',
  kind: 'collection',
  label: 'vehicles',
  state: 'declared',
  evidence: null,
  metrics: {},
  declaredBy: 'manifest.models[].collectionName',
  ...over,
});

describe('nf / stampUTC', () => {
  it('renders — for missing values and groups thousands', () => {
    expect(nf(null)).toBe('—');
    expect(nf(undefined)).toBe('—');
    expect(nf(1234567)).toBe('1,234,567');
  });

  it('stamps UTC timestamps verbatim', () => {
    expect(stampUTC('2026-09-04T09:41:00Z')).toBe('2026-09-04 09:41:00 UTC');
    expect(stampUTC(null)).toBe('—');
    expect(stampUTC('not-a-date')).toBe('—');
  });
});

describe('selfMeasuredSurface (§0 C6b)', () => {
  it('is true for a surface with selfMeasured', () => {
    expect(selfMeasuredSurface(topoNode({ id: 'surface:/api/lemu', kind: 'surface', selfMeasured: true }))).toBe(true);
  });

  it('is true for a legacy surface carrying self', () => {
    expect(selfMeasuredSurface(topoNode({ id: 'surface:/api/lemu', kind: 'surface', self: true }))).toBe(true);
  });

  it('is false for a host carrying self (this is our host, not self-measured)', () => {
    expect(selfMeasuredSurface(topoNode({ id: 'host:i-0', kind: 'host', self: true, state: 'measured' }))).toBe(false);
  });

  it('is false without the flag', () => {
    expect(selfMeasuredSurface(topoNode({ id: 'surface:/api/x', kind: 'surface' }))).toBe(false);
  });
});

describe('detailText / valueFromDetail', () => {
  it('joins non-null entries and drops nulls', () => {
    expect(detailText({ ops: 12, fail: 0, lastSeen: null })).toBe('ops: 12 · fail: 0');
  });

  it('returns null for empty or missing detail', () => {
    expect(detailText(null)).toBeNull();
    expect(detailText({})).toBeNull();
  });

  it('picks the headline value by known key', () => {
    expect(valueFromDetail({ n: 4300, err: 2 })).toBe('4,300 calls');
    expect(valueFromDetail({ ops: 88 })).toBe('88 ops');
    expect(valueFromDetail({ unknown: 1 })).toBeNull();
  });
});

describe('evidenceVariant (§0 C2)', () => {
  it('measured → MEASUREMENT ROW with real at/source/detail', () => {
    const v = evidenceVariant(topoNode({
      state: 'measured',
      evidence: { at: '2026-09-04T09:41:00Z', source: 'systempulses.collections', detail: { ops: 12, fail: 0 } },
    }));
    expect(v.tone).toBe('ok');
    expect(v.title).toBe('MEASUREMENT ROW');
    expect(v.ts).toBe('2026-09-04 09:41:00 UTC');
    expect(v.query).toBe('ops: 12 · fail: 0');
    expect(v.value).toBe('12 ops');
    expect(v.source).toBe('systempulses.collections');
    expect(v.method).toBeNull();
  });

  it('declared → NO ROW ON RECORD, ts never, verbatim copy, source = declaredBy', () => {
    const v = evidenceVariant(topoNode({}));
    expect(v.tone).toBe('hollow');
    expect(v.title).toBe('NO ROW ON RECORD');
    expect(v.ts).toBe('never');
    expect(v.value).toBe('nothing measured — not zero, not healthy');
    expect(v.query).toBe('declared by manifest.models[].collectionName');
    expect(v.source).toBe('manifest.models[].collectionName');
  });

  it('self-measured surface → real explanation with the traffic count (§0 C6)', () => {
    const v = evidenceVariant(topoNode({
      id: 'surface:/api/lemu',
      kind: 'surface',
      selfMeasured: true,
      metrics: { n: 4300, err: 0 },
    }));
    expect(v.tone).toBe('hollow');
    expect(v.value).toContain('self-measured');
    expect(v.value).toContain('4,300 requests');
  });

  it('unreachable → PROBE FAILED, fault tone, no value', () => {
    const v = evidenceVariant(topoNode({
      state: 'unreachable',
      evidence: { at: '2026-09-04T09:40:00Z', source: 'warehouse_liveness', detail: { error: 'socket disconnected' } },
    }));
    expect(v.tone).toBe('fault');
    expect(v.title).toBe('PROBE FAILED');
    expect(v.value).toBe('no value');
    expect(v.query).toContain('socket disconnected');
  });
});

describe('requireCounts (§0 C5)', () => {
  const edges = [
    { from: 'module:a', to: 'module:b', kind: 'require' },
    { from: 'module:c', to: 'module:a', kind: 'require' },
    { from: 'module:a', to: 'model:x', kind: 'model' },
  ];

  it('counts require edges in each direction only', () => {
    expect(requireCounts('module:a', edges)).toEqual({ imports: 1, importedBy: 1 });
  });

  it('returns zeros with no edges', () => {
    expect(requireCounts('module:a', [])).toEqual({ imports: 0, importedBy: 0 });
  });
});

describe('metricsRows', () => {
  it('module → LINES from totalLoc, FUNCTIONS from functionCount, require-edge counts', () => {
    const rows = metricsRows(
      { _id: 'module:a', totalLoc: 93, functionCount: 7 },
      'module',
      [{ from: 'module:a', to: 'module:b', kind: 'require' }, { from: 'module:c', to: 'module:a', kind: 'require' }],
    );
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ['LINES', '93'],
      ['FUNCTIONS', '7'],
      ['IMPORTS', '1'],
      ['IMPORTED BY', '1'],
    ]);
  });

  it('never sizes a module from functions[].loc', () => {
    const rows = metricsRows({ _id: 'module:a', totalLoc: 93 }, 'module', []);
    expect(rows.find((r) => r.label === 'LINES').value).toBe('93');
  });

  it('declared node → four dashes with the design sub-labels', () => {
    const rows = metricsRows(topoNode({ kind: 'surface', id: 'surface:/api/x' }), 'surface', []);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.value === '—' && r.ok === false)).toBe(true);
    expect(rows.map((r) => r.sub)).toEqual(['no measurement', 'never recorded', 'unmeasured', 'unmeasured']);
  });

  it('self-measured surface shows the traffic count, not a zero', () => {
    const rows = metricsRows(
      topoNode({ id: 'surface:/api/lemu', kind: 'surface', selfMeasured: true, metrics: { n: 4300, err: 12 } }),
      'surface',
    );
    expect(rows[0]).toMatchObject({ label: 'REQUESTS 24H', value: '4,300' });
    expect(rows[1]).toMatchObject({ label: 'ERRORS 24H', value: '12' });
  });

  it('measured collection → real ops/fail', () => {
    const rows = metricsRows(
      topoNode({ state: 'measured', evidence: { at: 'x', source: 's' }, metrics: { ops: 1200, fail: 3, lastSeen: '2026-09-04T09:00:00Z' } }),
      'collection',
      [],
      { rel: () => '1h ago' },
    );
    expect(rows.map((r) => r.label)).toEqual(['OPS 24H', 'FAILED', 'LAST SEEN']);
    expect(rows[2].value).toBe('1h ago');
  });

  it('route reads the latest pulse bucket and degrades to — on pulse error', () => {
    const ok = metricsRows({ _id: 'route:GET:/x' }, 'route', [], { latestPulse: { n: 42, err: 1, p50: 12, p95: 90 } });
    expect(ok.map((r) => r.value)).toEqual(['42', '1', '12ms', '90ms']);
    const bad = metricsRows({ _id: 'route:GET:/x' }, 'route', [], { pulseStatus: 'error' });
    expect(bad.every((r) => r.value === '—')).toBe(true);
  });
});

describe('ownedFunctionRows', () => {
  it('sorts by startLine and renders name · loc · file:line', () => {
    const rows = ownedFunctionRows([
      { functionName: 'b', loc: 93, file: 'a.js', startLine: 21 },
      { functionName: 'a', loc: 93, file: 'a.js', startLine: 7 },
      { functionName: 'anon', loc: 40, file: 'b.js' },
    ]);
    expect(rows.map((r) => r.name)).toEqual(['a', 'b', 'anon']);
    expect(rows[0]).toEqual({ name: 'a', loc: '93', ref: 'a.js:7' });
    expect(rows[2].ref).toBe('b.js');
  });
});

describe('errorWindowLabel (P4)', () => {
  it('formats days and hours', () => {
    expect(errorWindowLabel(720)).toBe('30 d');
    expect(errorWindowLabel(24)).toBe('1 d');
    expect(errorWindowLabel(6)).toBe('6 h');
  });

  it('falls back to the backend default the page actually uses', () => {
    expect(errorWindowLabel(undefined)).toBe('30 d');
  });
});

describe('mirrorPanel (§0 C3)', () => {
  const topology = {
    nodes: [
      { id: 'pipe:cdc', kind: 'pipe', state: 'measured' },
      { id: 'table:vehicles', kind: 'table', state: 'measured' },
    ],
    edges: [
      { from: 'collection:vehicles', to: 'pipe:cdc', kind: 'mirrors' },
      { from: 'pipe:cdc', to: 'table:vehicles', kind: 'mirrors' },
    ],
  };

  it('collection → direction, table and pipe rows from real edges', () => {
    const p = mirrorPanel(topoNode({}), topology);
    expect(p.ok).toBe(true);
    expect(p.name).toBe('clickhouse · vehicles');
    expect(p.rows).toContainEqual({ k: 'direction', v: 'mongo → clickhouse' });
    expect(p.rows).toContainEqual({ k: 'pipe', v: 'measured' });
  });

  it('table → liveness rows, omitting absent fields', () => {
    const p = mirrorPanel(
      topoNode({
        kind: 'table', id: 'table:vehicles', label: 'vehicles', state: 'measured',
        metrics: {
          liveness: { ok: false, checkedAt: '2026-09-04T09:00:00Z', error: 'socket disconnected' },
          completeness: { windowTo: '2026-09-04T08:00:00Z', missingRows: 12 },
          correctness: null,
        },
      }),
      topology,
      () => '1h ago',
    );
    expect(p.rows).toContainEqual({ k: 'liveness', v: 'no' });
    expect(p.rows).toContainEqual({ k: 'checked', v: '1h ago' });
    expect(p.rows).toContainEqual({ k: 'completeness.missingRows', v: '12' });
    expect(p.rows.some((r) => r.k.startsWith('correctness'))).toBe(false);
  });

  it('kinds the mirror does not concern get the not-applicable variant', () => {
    const p = mirrorPanel(topoNode({ kind: 'host', id: 'host:x' }), topology);
    expect(p.ok).toBe(false);
    expect(p.rows).toEqual([{ k: 'mirror', v: 'not applicable' }]);
  });

  it('unmirrored collection names the absence instead of inventing rows', () => {
    const p = mirrorPanel(topoNode({ id: 'collection:orphan', label: 'orphan' }), topology);
    expect(p.ok).toBe(false);
    expect(p.rows).toEqual([]);
  });
});
