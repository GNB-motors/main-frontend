import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('./FuelIntegrityService', () => ({
  FuelIntegrityService: {
    getPumpLedger: vi.fn(),
    getSummary: vi.fn(),
    getFills: vi.fn(),
    getWindows: vi.fn(),
  },
}));
vi.mock('./RefuelAdvisoryCard', () => ({ default: () => null }));
import { FuelIntegrityService } from './FuelIntegrityService';
import FuelIntegrityPage from './FuelIntegrityPage';
const ledger = {
  window: { from: '2026-10-01T00:00:00+05:30', to: '2026-10-31T23:59:59+05:30' },
  pumps: [
    {
      pump: 'Test station',
      fills: 4,
      claimedLitres: 100,
      actualLitres: 88,
      shortfallLitres: 12,
      shortfallPct: 12,
      estimatedLossInr: 1080,
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  FuelIntegrityService.getPumpLedger.mockResolvedValue(ledger);
  FuelIntegrityService.getSummary.mockResolvedValue({ vehicles: [] });
  FuelIntegrityService.getFills.mockResolvedValue({ records: [] });
  FuelIntegrityService.getWindows.mockResolvedValue({ records: [] });
});
it('shares a single scoped ledger between the pump card and tab and aborts it on unmount', async () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/?manufacturer=TATA']}>
      <FuelIntegrityPage />
    </MemoryRouter>,
  );
  await screen.findByText('Chronic shortage');
  expect(FuelIntegrityService.getPumpLedger).toHaveBeenCalledTimes(1);
  const [params, { signal }] = FuelIntegrityService.getPumpLedger.mock.calls[0];
  expect(params).toEqual({ manufacturer: 'TATA' });
  expect(signal).toBeInstanceOf(AbortSignal);
  fireEvent.click(screen.getByRole('tab', { name: 'Pump Honesty Watchlist' }));
  expect(await screen.findByText('Chronic Shortage')).toBeInTheDocument();
  expect(screen.getAllByText('Fleet pumps · 1 Oct 2026 – 31 Oct 2026 IST')).toHaveLength(2);
  expect(FuelIntegrityService.getPumpLedger).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(FuelIntegrityService.getPumpLedger).toHaveBeenCalledTimes(2));
  const refreshedSignal = FuelIntegrityService.getPumpLedger.mock.calls[1][1].signal;
  // The initial hook-owned request is cancelled when this page leaves.
  unmount();
  expect(signal.aborted).toBe(true);
  expect(refreshedSignal).toBeInstanceOf(AbortSignal);
});
