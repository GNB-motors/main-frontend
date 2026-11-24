import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriversTab from './DriversTab';
import PerformanceApi from '../../api/performance';

vi.mock('../../api/performance', () => ({ default: { drivers: vi.fn(), driver: vi.fn() } }));
const measured = (value) => ({ value, source: 'measured', unit: '%' });
beforeEach(() => {
  vi.clearAllMocks();
  PerformanceApi.drivers.mockResolvedValue({
    drivers: [
      {
        driverId: 'driver1',
        name: 'Ramesh',
        vehicles: ['WB11T0662'],
        dnaScore: measured(81),
        harshPer100Km: measured(2),
        idlePct: measured(4),
        paceFactor: measured(1),
      },
    ],
  });
  PerformanceApi.driver.mockResolvedValue({ dna: null });
});
const view = (from, to) => (
  <MemoryRouter>
    <DriversTab from={from} to={to} />
  </MemoryRouter>
);
it('requests the selected dates for both the driver table and its DNA drawer', async () => {
  render(view('2026-11-01', '2026-11-07'));
  fireEvent.click(await screen.findByText('Ramesh'));
  await waitFor(() =>
    expect(PerformanceApi.driver).toHaveBeenCalledWith(
      'driver1',
      { from: '2026-11-01', to: '2026-11-07' },
      expect.any(AbortSignal),
    ),
  );
  expect(PerformanceApi.drivers).toHaveBeenCalledWith(
    { from: '2026-11-01', to: '2026-11-07' },
    expect.any(AbortSignal),
  );
  expect(screen.queryByText(/last 30 days/)).not.toBeInTheDocument();
});
it('reloads the table and open drawer after the selected range changes', async () => {
  const { rerender } = render(view('2026-11-01', '2026-11-07'));
  fireEvent.click(await screen.findByText('Ramesh'));
  await waitFor(() => expect(PerformanceApi.driver).toHaveBeenCalled());
  rerender(view('2026-11-01', '2026-11-23'));
  await waitFor(() =>
    expect(PerformanceApi.drivers).toHaveBeenLastCalledWith(
      { from: '2026-11-01', to: '2026-11-23' },
      expect.any(AbortSignal),
    ),
  );
  await waitFor(() =>
    expect(PerformanceApi.driver).toHaveBeenLastCalledWith(
      'driver1',
      { from: '2026-11-01', to: '2026-11-23' },
      expect.any(AbortSignal),
    ),
  );
});
