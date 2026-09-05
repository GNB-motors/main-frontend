import { degradedDetail, degradedTitle, degradedExplainer, affectName, GENERIC_EXPLAINER, DEGRADED_EXPLAINERS } from './degradedExplain';

describe('degradedExplain', () => {
  it('maps known backend steps to plain names', () => {
    expect(degradedTitle('imds')).toBe('Instance identity (IMDS)');
    expect(degradedTitle('redis-probe')).toBe('Redis TCP probe');
    expect(degradedTitle('warehouse-disabled')).toBe('Warehouse (ClickHouse) tier');
    expect(degradedTitle('clickhouse-query')).toBe('ClickHouse liveness query');
  });

  it('falls back to the raw step string for unknown steps', () => {
    expect(degradedTitle('scan-sources')).toBe('scan-sources');
    expect(degradedTitle('')).toBe('unknown step');
    expect(degradedTitle(undefined)).toBe('unknown step');
  });

  it('imds explainer states the dev fallback is expected', () => {
    expect(degradedExplainer('imds')).toMatch(/expected, not a fault/);
    expect(degradedExplainer('imds')).toMatch(/hostname/);
  });

  it('redis-probe explainer names the TCP probe and its 600 ms budget', () => {
    expect(degradedExplainer('redis-probe')).toMatch(/TCP/);
    expect(degradedExplainer('redis-probe')).toMatch(/600 ms/);
  });

  it('unknown steps get the honest generic explainer', () => {
    expect(degradedExplainer('mystery')).toBe(GENERIC_EXPLAINER);
    expect(GENERIC_EXPLAINER).toMatch(/last known state/);
  });

  it('detail rows cover the real fields (step, reason, affects)', () => {
    const rows = degradedDetail(
      { step: 'redis-probe', reason: 'timeout after 600ms', affects: ['store:redis'] },
      { nodes: [{ id: 'store:redis', label: 'Redis' }], generatedAt: '2026-09-05T10:00:00.000Z' },
    );
    const byK = Object.fromEntries(rows.map((r) => [r.k, r.v]));
    expect(byK['probe / dependency']).toBe('Redis TCP probe');
    expect(byK['what happened']).toBe('timeout after 600ms');
    expect(byK['reported at']).toBe('2026-09-05 10:00:00 UTC');
    expect(byK.affects).toBe('Redis');
    expect(byK.context).toBe(DEGRADED_EXPLAINERS['redis-probe']);
  });

  it('omits rows the entry lacks (C3 discipline): no timestamp, no affects, no recovery', () => {
    const rows = degradedDetail({ step: 'imds', reason: 'no instance metadata; using hostname' });
    const keys = rows.map((r) => r.k);
    expect(keys).toContain('probe / dependency');
    expect(keys).toContain('what happened');
    expect(keys).not.toContain('reported at');
    expect(keys).not.toContain('affects');
    expect(keys).not.toContain('recovery');
    expect(keys).toContain('context');
  });

  it('empty affects array omits the affects row entirely', () => {
    const rows = degradedDetail({ step: 'warehouse-disabled', reason: 'disabled', affects: [] });
    expect(rows.some((r) => r.k.startsWith('affects'))).toBe(false);
  });

  it('affects fall back to the bare id suffix when the node is not in the payload', () => {
    expect(affectName('collection:livevehiclepositions', [])).toBe('livevehiclepositions');
    expect(affectName('store:redis', [{ id: 'store:redis', label: 'Redis' }])).toBe('Redis');
    expect(affectName(null, [])).toBe(null);
  });

  it('renders future recovery/note fields only when the backend emits them', () => {
    const withRec = degradedDetail({ step: 'x', reason: 'r', recovery: 'retried OK' });
    expect(withRec.find((r) => r.k === 'recovery')?.v).toBe('retried OK');
  });

  it('tolerates a null entry', () => {
    expect(degradedDetail(null)).toEqual([]);
    expect(degradedDetail(undefined)).toEqual([]);
  });
});
