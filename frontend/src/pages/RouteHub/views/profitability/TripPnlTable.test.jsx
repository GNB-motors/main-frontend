import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import TripPnlTable from './TripPnlTable';

const GOOD = {
  trip: { id: 'good', registrationNumber: 'BR 01 AA 1111', window: { to: '2026-11-03' } },
  distanceKm: 100,
  revenueInr: 9000,
  revenueNote: null,
  costs: [{ type: 'fuel', amountInr: 3000, assumed: false, source: 'fuel_logs' }],
  totalCostInr: 3000,
  totalCostComplete: true,
  profitInr: 6000,
  marginPct: 66.7,
};

const WORST = {
  trip: { id: 'worst', registrationNumber: 'BR 01 CC 3333', window: { to: '2026-11-01' } },
  distanceKm: 310,
  revenueInr: 8000,
  revenueNote: null,
  costs: [{ type: 'fuel', amountInr: 8360, assumed: false, source: 'fuel_logs' }],
  totalCostInr: 8360,
  totalCostComplete: true,
  profitInr: -360,
  marginPct: -4.5,
};

const UNKNOWN_COST = {
  trip: { id: 'unknown', registrationNumber: 'BR 01 BB 2222', window: { to: '2026-11-02' } },
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

describe('TripPnlTable', () => {
  it('sorts the worst margin first', () => {
    const { container } = render(
      <TripPnlTable pnls={[GOOD, UNKNOWN_COST, WORST]} first={false} error={null} />,
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('BR 01 CC 3333');
    expect(rows[0].textContent).toContain('-4.5%');
    expect(rows[1].textContent).toContain('BR 01 AA 1111');
    // A trip with no margin sorts last — unknown is not zero.
    expect(rows[2].textContent).toContain('BR 01 BB 2222');
  });

  it('shows a missing cost as — with the reason, never ₹0', () => {
    const { container } = render(
      <TripPnlTable pnls={[GOOD, UNKNOWN_COST, WORST]} first={false} error={null} />,
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    const costCell = rows[2].querySelectorAll('td')[3];

    expect(costCell.textContent.trim().startsWith('—')).toBe(true);
    expect(costCell.textContent).toContain('no toll data for this trip');
    expect(container.textContent).not.toContain('₹0');
  });
});
