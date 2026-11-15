import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ReplayToolbar from './ReplayToolbar';
const vehicles = [
  {
    _id: 'v1',
    registrationNumber: 'WB11T0662',
    model: '4932TC',
    manufacturer: 'TATA',
    chassisNumber: 'CHASSIS01',
  },
  {
    _id: 'v2',
    registrationNumber: 'WB11S1962',
    model: '2820',
    manufacturer: 'ASHOK LEYLAND',
    chassisNumber: 'CHASSIS02',
  },
];
const props = () => ({
  reg: 'WB11T0662',
  vehicles,
  range: 'today',
  from: '2026-11-01',
  to: '2026-11-02',
  erpTripId: 'old-trip',
  erpTrips: [],
  setReg: vi.fn(),
  setTrip: vi.fn(),
  setErpTripId: vi.fn(),
  pickTrip: vi.fn(),
  load: vi.fn(async () => {}),
  setRange: vi.fn(),
  setFrom: vi.fn(),
  setTo: vi.fn(),
  toast: vi.fn(),
});
beforeEach(cleanup);
it('uses one searchable vehicle dropdown and resets the old trip before loading the selected vehicle', () => {
  const p = props();
  render(<ReplayToolbar {...p} />);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Search vehicle')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'WB11T0662 · 4932TC' }));
  const search = screen.getByRole('textbox', { name: 'Search options' });
  fireEvent.change(search, { target: { value: 'CHASSIS02' } });
  fireEvent.click(screen.getByRole('option', { name: 'WB11S1962 · 2820' }));
  expect(p.setReg).toHaveBeenCalledWith('WB11S1962');
  expect(p.setTrip).toHaveBeenCalledWith(null);
  expect(p.setErpTripId).toHaveBeenCalledWith('');
  expect(p.load).toHaveBeenCalledTimes(1);
  expect(p.load).toHaveBeenCalledWith('WB11S1962', 'today', '', null);
  expect(screen.queryByRole('textbox', { name: 'Search options' })).not.toBeInTheDocument();
});
it('prevents vehicle selection while the replay is loading', () => {
  const p = props();
  render(<ReplayToolbar {...p} loading />);
  const trigger = screen.getByRole('button', { name: 'WB11T0662 · 4932TC' });
  expect(trigger).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(trigger);
  expect(screen.queryByRole('textbox', { name: 'Search options' })).not.toBeInTheDocument();
  expect(p.load).not.toHaveBeenCalled();
});
