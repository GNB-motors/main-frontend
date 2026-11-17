import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const svc = vi.hoisted(() => ({
  getDigest: vi.fn(),
  getDailyFuel: vi.fn(),
  getMorningBrief: vi.fn(),
  getOwnerReport: vi.fn(),
}));

vi.mock('../../services/fleetViewService', () => ({ fleetViewService: svc }));
vi.mock('../../hooks/useLivePositions', () => ({
  useLivePositions: () => ({ positions: [], isLoading: false, refresh: vi.fn() }),
}));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(async () => []),
  invalidateVehicleList: vi.fn(),
}));
vi.mock('../../services/AutoTripService', () => ({
  AutoTripService: { list: vi.fn(async () => ({ items: [], total: 0 })) },
}));
// A signed-in owner: the tab's answer cache is per user, org and branch.
vi.mock('../../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getToken: () => 'T',
  getUserId: () => 'U1',
  getOrgId: () => 'O1',
  getBranchId: () => null,
}));

import DailyDigestPage from './DailyDigestPage';
import apiMemo from '../../utils/apiMemo';
import digestFixture from '../../test/fixtures/redesign/digest.json';

const renderPage = () =>
  render(
    <MemoryRouter>
      <DailyDigestPage />
    </MemoryRouter>,
  );
const calls = () =>
  svc.getDigest.mock.calls.length +
  svc.getDailyFuel.mock.calls.length +
  svc.getMorningBrief.mock.calls.length +
  svc.getOwnerReport.mock.calls.length;

describe('Daily digest: a revisit inside the cache window', () => {
  beforeEach(() => {
    apiMemo.clear();
    vi.clearAllMocks();
    svc.getDigest.mockResolvedValue(digestFixture);
    svc.getDailyFuel.mockResolvedValue({ items: [] });
    svc.getMorningBrief.mockResolvedValue({});
    svc.getOwnerReport.mockResolvedValue({ sections: [] });
  });

  it('asks the server nothing, and Refresh still asks it', async () => {
    const first = renderPage();
    expect(
      await screen.findByText(/A good day: 41 loaded trips, 3 trucks need you\./),
    ).toBeInTheDocument();
    await waitFor(() => expect(svc.getOwnerReport).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    const afterFirst = calls();
    first.unmount();

    renderPage();
    // Drawn at once from memory: the headline is there without waiting.
    expect(
      screen.getByText(/A good day: 41 loaded trips, 3 trucks need you\./),
    ).toBeInTheDocument();
    expect(calls()).toBe(afterFirst);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(svc.getOwnerReport).toHaveBeenCalledTimes(2));
    expect(svc.getDigest.mock.calls.at(-1)[0].fresh).toBe(true);
    expect(svc.getDailyFuel).toHaveBeenCalledTimes(2);
  });
});
