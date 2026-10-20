import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CycleSlipsTable from './CycleSlipsTable';

const SLIPS = [
  {
    id: 's1',
    role: 'FULL_TANK_START',
    refuelTime: '2026-10-09T17:45:00Z',
    station: 'CASH OIL(FARAKKA)',
    odometer: 91749.1,
    litres: 30.04,
    rate: 99,
    amount: 2974,
  },
  {
    id: 'e1',
    role: 'FULL_TANK_END',
    refuelTime: '2026-10-09T19:45:00Z',
    station: 'CASH OIL(FARAKKA)',
    odometer: 91808.1,
    litres: 160,
    rate: 99,
    amount: 15840,
  },
];

const renderTable = (props) =>
  render(
    <MemoryRouter>
      <CycleSlipsTable {...props} />
    </MemoryRouter>,
  );

describe('CycleSlipsTable', () => {
  it('lists the opening and closing full tanks with odometer and litres, and links the slips page', () => {
    renderTable({ slips: SLIPS, cycle: { live: true, intervalId: 'iv1' } });
    expect(screen.getByText('Full tank (start)')).toBeInTheDocument();
    expect(screen.getByText('Full tank (end)')).toBeInTheDocument();
    expect(screen.getByText('30.04 L')).toBeInTheDocument();
    expect(screen.getAllByText('160.00 L')).toHaveLength(2); // the row and the diesel-used total
    expect(screen.getByRole('link', { name: /View slips/ })).toHaveAttribute(
      'href',
      '/mileage-tracking/iv1',
    );
  });

  it('says a register cycle has no slips and offers no link', () => {
    renderTable({ slips: [], cycle: { live: true, intervalId: null } });
    expect(screen.getByText(/comes from the uploaded oil register/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
