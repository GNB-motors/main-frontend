import { describe, it, expect } from 'vitest';
import { rupees, sortByMarginAsc, tripPnlRow } from './tripPnlModel';

const PNL_WITH_UNKNOWN_TOLL = {
  trip: { id: 't2', registrationNumber: 'BR 01 BB 2222', window: { to: '2026-11-02' } },
  distanceKm: 220,
  revenueInr: null,
  revenueNote: 'No WeightSlipTrip revenue recorded for this trip — profit cannot be computed.',
  costs: [
    { type: 'fuel', amountInr: 4200, assumed: false, source: 'fuel_logs' },
    {
      type: 'toll',
      amountInr: null,
      assumed: false,
      source: 'toll_ledger',
      note: 'UNKNOWN — no toll data for this trip. Not zero.',
    },
  ],
  totalCostInr: 4200,
  totalCostComplete: false,
  unknownCostTypes: ['toll'],
  profitInr: null,
  marginPct: null,
};

describe('tripPnlRow', () => {
  it('never turns a missing cost into ₹0', () => {
    const row = tripPnlRow(PNL_WITH_UNKNOWN_TOLL);

    expect(row.cost).toBeNull();
    expect(rupees(row.cost)).toBe('—');
    expect(rupees(row.cost)).not.toContain('₹0');
    expect(row.costReason).toContain('no toll data for this trip');
    expect(row.margin).toBeNull();
    expect(row.revenueReason).toContain('No WeightSlipTrip revenue recorded');
  });

  it('keeps the API source labels of the priced cost lines', () => {
    const row = tripPnlRow(PNL_WITH_UNKNOWN_TOLL);
    expect(row.sources).toEqual(['fuel_logs']);
  });
});

describe('sortByMarginAsc', () => {
  it('puts the worst margin first and the unknown margin last', () => {
    const rows = [{ margin: 12 }, { margin: -4 }, { margin: 30 }, { margin: null }];
    expect(sortByMarginAsc(rows).map((r) => r.margin)).toEqual([-4, 12, 30, null]);
  });

  it('does not read a missing margin as zero', () => {
    const rows = [{ margin: 0 }, { margin: null }];
    expect(sortByMarginAsc(rows).map((r) => r.margin)).toEqual([0, null]);
  });
});
