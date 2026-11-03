import { describe, expect, it } from 'vitest';
import { buildFuelTrend, buildOverview, digestNumber, shiftDay } from './fleetOverviewModel';

const card = (key, values, extra = {}) => ({
  key,
  status: 'ok',
  items: Object.entries(values).map(([label, value]) => ({ label, value })),
  ...extra,
});

describe('fleet overview data', () => {
  it('keeps missing sources unknown, including a partial pending-action count', () => {
    const model = buildOverview({ story: [card('questions', { 'Places waiting': '4' })] });
    expect(model.pending).toBeNull();
    expect(model.critical).toBeNull();
    expect(model.loadedKm).toBeNull();
    expect(digestNumber('—')).toBeNull();
    expect(digestNumber(null)).toBeNull();
  });

  it('uses actual severity and distance cells and puts critical action categories first', () => {
    const model = buildOverview({
      reconnect: [{ accountName: 'Fleet A' }],
      story: [
        card(
          'issues',
          { Critical: '3', Caution: '2', 'Open issues': '7' },
          { link: { to: '/intelligence?tab=issues' } },
        ),
        card('loaded', { 'Distance covered': '4,820 km' }),
        card('empty', { 'Empty running': '1,240 km' }),
        card('questions', { 'Places waiting': '4' }),
        card('reconnect', {}),
        card('fuel', { 'Trucks affected': '2' }, { tone: 'act' }),
      ],
    });
    expect(model).toMatchObject({
      critical: 3,
      caution: 2,
      open: 7,
      loadedKm: 4820,
      emptyKm: 1240,
      pending: 5,
    });
    expect(model.attention[0].id).toBe('issues');
    expect(model.attention.at(-1).id).toBe('questions');
    expect(model.attention[0].to).toBe('/intelligence?tab=issues');
  });

  it('does not show values from unavailable or held source data', () => {
    const model = buildOverview({
      story: [
        card('issues', { Critical: '0' }, { status: 'error' }),
        card('loaded', { 'Distance covered': '0 km' }, { status: 'no_data' }),
      ],
    });
    expect(model.critical).toBeNull();
    expect(model.loadedKm).toBeNull();
    expect(buildFuelTrend({ held: true }, '2026-11-04')).toEqual([]);
  });

  it('keeps real zero values and rejects unqualified driver performance cells', () => {
    expect(
      buildOverview({
        reconnect: [],
        story: [
          card('issues', { Critical: '0' }),
          card('questions', { 'Places waiting': '0' }),
          card('reconnect', {}),
        ],
      }),
    ).toMatchObject({ critical: 0, pending: 0 });
    const model = buildOverview(null, {
      actions: [],
      driverLeaderboard: {
        boards: [
          {
            rows: [
              { rank: 1, subjectId: 'bad', score: { value: 91, source: 'insufficient_data' } },
              { rank: 2, subjectId: 'good', score: { value: 84, source: 'measured' } },
            ],
          },
        ],
      },
    });
    expect(model.drivers.map((driver) => driver.id)).toEqual(['good']);
  });

  it('does not show zero legacy issues while loading or after a source fails', () => {
    expect(buildOverview(null, { actions: [], loading: true }).critical).toBeNull();
    expect(buildOverview(null, { actions: [], error: true }).pending).toBeNull();
  });

  it('keeps fuel gaps and incomplete days null, and groups cycle ends in IST', () => {
    const rows = buildFuelTrend(
      {
        items: [
          { to: '2026-11-01T18:45:00Z', dieselL: 30 },
          { to: '2026-11-02T10:00:00Z', dieselL: 20 },
          { to: '2026-11-03T10:00:00Z', dieselL: null },
          { to: '2026-11-03T12:00:00Z', dieselL: 40 },
          { to: '2026-11-04T12:00:00Z', dieselL: 0 },
        ],
      },
      '2026-11-04',
    );
    expect(rows.find((r) => r.day === '2026-11-01').litres).toBeNull();
    expect(rows.find((r) => r.day === '2026-11-02').litres).toBe(50);
    expect(rows.find((r) => r.day === '2026-11-03').litres).toBeNull();
    expect(rows.find((r) => r.day === '2026-11-04').litres).toBe(0);
    expect(shiftDay('2026-11-01', -1)).toBe('2026-10-31');
  });
});
