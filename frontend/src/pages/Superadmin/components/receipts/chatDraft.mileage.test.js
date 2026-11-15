import { describe, it, expect } from 'vitest';
import { mileageLine, pumpOf } from './chatDraft';

const row = (vsAverage, computed = 3.4) => ({ mileage: { computed, vsAverage } });

describe('mileageLine', () => {
  it('says how far below the truck\'s own usual a fill is', () => {
    const line = mileageLine(
      row({ average: 3.9, n: 8, source: 'CYCLES', deltaPct: -12.8, verdict: 'worse' }),
    );
    expect(line.text).toBe("3.4 km/L · 12.8% below this truck's usual 3.9 (8 fills)");
    expect(line.kind).toBe('warn');
  });

  it('never calls a fill outside the truck\'s own range better or worse', () => {
    const line = mileageLine(
      row(
        {
          average: 4.11,
          n: 3,
          source: 'CYCLES',
          deltaPct: 282.8,
          verdict: 'outside_range',
          range: { low: 3.8, high: 4.4 },
        },
        15.72,
      ),
    );
    expect(line.text).toBe(
      "15.72 km/L · doesn't fit this truck's past fills (3.8–4.4 km/L) — check the km and litres",
    );
    expect(line.text).not.toMatch(/above|better/);
    expect(line.kind).toBe('warn');
  });

  it('names the fuel profile when the usual has no fill count', () => {
    const line = mileageLine(
      row({ average: 4.5, n: null, source: 'PROFILE', deltaPct: 11.1, verdict: 'better' }, 5),
    );
    expect(line.text).toBe("5 km/L · 11.1% above this truck's usual 4.5 (its fuel profile)");
  });

  it('keeps the measured value and says there is no comparison', () => {
    const line = mileageLine(row({ average: null, n: null, deltaPct: null, verdict: null }));
    expect(line.text).toBe('3.4 km/L · Comparison not available');
  });

  it('says low when a fill is more than 5% under the usual (owner rule)', () => {
    const line = mileageLine(
      row({ average: 3.9, n: 8, source: 'CYCLES', deltaPct: -12.8, verdict: 'low' }),
    );
    expect(line.text).toBe("3.4 km/L · low: 12.8% below this truck's usual 3.9 (8 fills)");
    expect(line.kind).toBe('warn');
  });

  it('says OK when a fill is at or above the usual', () => {
    const line = mileageLine(
      row({ average: 2.87, n: 2, source: 'CYCLES', deltaPct: 4.85, verdict: 'ok' }, 3.01),
    );
    expect(line.text).toBe("3.01 km/L · OK: at or above this truck's usual 2.87 (2 fills)");
    expect(line.kind).toBe('neutral');
  });

  it('calls a fill far above the usual wrong, never good', () => {
    const line = mileageLine({
      mileage: {
        computed: 25.46,
        computedFrom: 'CAPTION',
        vsAverage: { average: 5.92, n: 5, source: 'CYCLES', deltaPct: 330, verdict: 'too_high' },
      },
    });
    expect(line.text).toBe(
      "25.46 km/L (km from the message) · far above this truck's usual 5.92 (5 fills) — the km or litres are wrong (a top-up?)",
    );
    expect(line.kind).toBe('warn');
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
