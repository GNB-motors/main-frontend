import { describe, it, expect } from 'vitest';
import { mileageLine, pumpOf } from './chatDraft';

const trendRow = (trend, computed = 3.4) => ({ mileage: { computed, trend } });

describe('mileageLine', () => {
  it('shows the mileage over the last fills of the truck, and its usual', () => {
    const line = mileageLine(
      trendRow({
        from: '2026-11-01',
        to: '2026-11-10',
        fills: 5,
        km: 460,
        litres: 120,
        kmpl: 2.9,
        usual: 3.1,
        usualSource: 'CYCLES',
        deltaPct: 2.5,
        verdict: 'ok',
      }),
    );
    expect(line.text).toBe('Mileage, last 5 fills (1 Nov–10 Nov): 2.9 km/L · usual 3.1 · OK');
    expect(line.kind).toBe('neutral');
    expect(line.source).toBe('CYCLES');
  });

  it('warns when the last fills are well below the usual of the truck', () => {
    const line = mileageLine(
      trendRow({
        from: '2026-11-01',
        to: '2026-11-10',
        fills: 5,
        km: 460,
        litres: 160,
        kmpl: 2.9,
        usual: 3.1,
        deltaPct: -6.5,
        verdict: 'low',
      }),
    );
    expect(line.text).toBe(
      'Mileage, last 5 fills (1 Nov–10 Nov): 2.9 km/L · usual 3.1 · low: 6.5% below usual — watch this truck',
    );
    expect(line.kind).toBe('warn');
  });

  it('warns when the last fills are far above the usual', () => {
    const line = mileageLine(
      trendRow({
        from: '2026-11-01',
        to: '2026-11-10',
        fills: 3,
        kmpl: 25.5,
        usual: 5.9,
        deltaPct: 330,
        verdict: 'too_high',
      }),
    );
    expect(line.text).toBe(
      'Mileage, last 3 fills (1 Nov–10 Nov): 25.5 km/L · usual 5.9 · far above usual — some km or litres are wrong',
    );
    expect(line.kind).toBe('warn');
  });

  it('says there are not enough fills yet when the server gives no verdict', () => {
    const line = mileageLine(
      trendRow({ from: '2026-11-10', to: '2026-11-10', fills: 1, kmpl: 3.4, verdict: null }),
    );
    expect(line.text).toBe('Mileage, last 1 fill (10 Nov–10 Nov): 3.4 km/L · Not enough fills yet');
  });

  it('names the driver of those last fills', () => {
    const line = mileageLine(
      trendRow({
        from: '2026-11-01',
        to: '2026-11-10',
        fills: 5,
        kmpl: 2.9,
        usual: 3.1,
        verdict: 'ok',
        driver: { driverId: 'd1', name: 'Ramesh' },
      }),
    );
    expect(line.text).toBe(
      'Mileage, last 5 fills (1 Nov–10 Nov): 2.9 km/L · usual 3.1 · OK · driver Ramesh',
    );
  });

  it('never judges a single fill on its own', () => {
    const line = mileageLine({
      mileage: { computed: 3.4, vsAverage: { average: 3.9, n: 8, verdict: 'low' } },
    });
    expect(line).toBeNull();
  });

  it('keeps the days of the trend the way the server wrote them', () => {
    const line = mileageLine(
      trendRow({ from: '1 Nov', to: '10 Nov', fills: 5, kmpl: 2.9, usual: 3.1, verdict: 'ok' }),
    );
    expect(line.text).toContain('(1 Nov–10 Nov)');
  });
});

describe('pumpOf', () => {
  it('uses the friendly label when a matched place has no name', () => {
    expect(
      pumpOf({
        pump: {
          name: null,
          label: 'Fuel pump near Medinipur, West Bengal',
          lat: 22.44,
          lng: 87.33,
          source: 'ORG',
        },
      }).name,
    ).toBe('Fuel pump near Medinipur, West Bengal');
  });

  it('shows nothing when there is no pump at all', () => {
    expect(pumpOf({ pump: { name: null, lat: null, lng: null, source: null } }).name).toBe('');
  });
});

describe('mileageLine — a trend the server could not measure', () => {
  it('says why instead of "Not enough fills yet"', () => {
    const line = mileageLine({
      mileage: {
        trend: {
          from: '2026-10-20',
          to: '2026-11-03',
          fills: 8,
          km: null,
          kmpl: null,
          usual: 5.05,
          verdict: null,
          note: 'odometer reading looks wrong',
        },
      },
    });
    expect(line.text).toMatch(/odometer reading looks wrong/);
    expect(line.text).not.toMatch(/Not enough fills yet/);
    expect(line.kind).toBe('warn');
  });
});
