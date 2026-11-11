import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import TripPnlTable from './TripPnlTable';

const PRICED = {
  id: 'priced',
  registrationNumber: 'WB 11 AA 1111',
  origin: 'DALMIA OCL',
  destination: 'MAMUDPUR',
  distanceKm: 310,
  runningCostInr: 8360,
  priced: true,
  status: 'COMPLETE',
  at: '2026-11-03T10:00:00.000Z',
};

const UNPRICED = {
  id: 'unpriced',
  registrationNumber: 'WB 11 BB 2222',
  origin: 'JK BUXAR',
  destination: null,
  distanceKm: 120,
  runningCostInr: null,
  priced: false,
  status: 'NEEDS_REVIEW',
  at: '2026-11-02T10:00:00.000Z',
};

describe('TripPnlTable (running cost)', () => {
  it('renders the trips in the order given (backend sorts, newest first)', () => {
    const { container } = render(
      <TripPnlTable trips={[PRICED, UNPRICED]} first={false} error={null} />,
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('WB 11 AA 1111');
    expect(rows[1].textContent).toContain('WB 11 BB 2222');
  });

  it('shows an unpriced trip cost as — with a reason, never ₹0', () => {
    const { container } = render(
      <TripPnlTable trips={[PRICED, UNPRICED]} first={false} error={null} />,
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    const costCell = rows[1].querySelectorAll('td')[3];
    expect(costCell.textContent.trim().startsWith('—')).toBe(true);
    expect(costCell.textContent).toContain('not priced yet');
    expect(container.textContent).not.toContain('₹0');
  });

  it('shows the running cost for a priced trip', () => {
    const { container } = render(<TripPnlTable trips={[PRICED]} first={false} error={null} />);
    const costCell = container.querySelectorAll('tbody tr td')[3];
    expect(costCell.textContent).toContain('8,360');
  });
});
