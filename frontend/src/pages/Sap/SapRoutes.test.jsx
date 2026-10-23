import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import SapRoutes from './SapRoutes';
import SapService from '../../services/SapService';
vi.mock('../../services/SapService', () => ({
  default: { routes: vi.fn(), setRoute: vi.fn(), hint: vi.fn() },
}));
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({
  default: { listSites: vi.fn() },
}));
const rows = [
  {
    key: 'p>t',
    fromSiteId: 'p',
    toSiteId: 't',
    fromName: 'DALMIA OCL',
    toName: 'TARAKESHWAR',
    trips: 33,
    trucks: 16,
    ladenKm: { p50: 340 },
    roundTripKm: { p50: 640 },
    sap: { _id: 's1', sapKm: 280, basis: 'ONE_WAY', source: 'IMPORTED' },
    comparison: { sapKm: 280, actualKm: 340, deltaKm: 60, deltaPct: 21.4, verdict: 'OVER' },
    verdict: 'OVER',
  },
  {
    key: 'p>m',
    fromSiteId: 'p',
    toSiteId: 'm',
    fromName: 'DALMIA OCL',
    toName: 'MAMUDPUR',
    trips: 51,
    trucks: 9,
    ladenKm: { p50: 186 },
    sap: null,
    comparison: null,
    verdict: 'NO_SAP',
  },
];
const mount = () =>
  render(
    <MemoryRouter>
      <SapRoutes />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  SapService.routes.mockResolvedValue({
    rows,
    total: 2,
    totals: { routes: 2, withSap: 1, over: 1, extraKm: 1980 },
    settings: { tolerancePct: 10 },
  });
  SapService.setRoute.mockResolvedValue({ _id: 's2' });
  SapService.hint.mockResolvedValue({ shortestOneWayKm: null });
});

it('lists routes with their usual km and SAP, compared on its basis', async () => {
  mount();
  const row = (await screen.findByText('DALMIA OCL → TARAKESHWAR')).closest('tr');
  expect(within(row).getByText('+21.4%')).toBeTruthy();
  expect(within(row).getByText(/One way · Imported from a sheet/)).toBeTruthy();
  const bare = screen.getByText('DALMIA OCL → MAMUDPUR').closest('tr');
  expect(within(bare).getByText('Not set')).toBeTruthy();
  expect(screen.getByText(/2 routes · 1 with SAP · 1 over SAP/)).toBeTruthy();
});

it('filters on the server and starts again from page one', async () => {
  mount();
  await screen.findByText('DALMIA OCL → TARAKESHWAR');
  fireEvent.change(screen.getByLabelText('SAP set'), { target: { value: 'nosap' } });
  await waitFor(() =>
    expect(SapService.routes).toHaveBeenLastCalledWith(
      { page: 1, limit: 50, has: 'nosap' },
      expect.anything(),
    ),
  );
});

it('sets SAP on a route the trips found', async () => {
  mount();
  const bare = (await screen.findByText('DALMIA OCL → MAMUDPUR')).closest('tr');
  fireEvent.click(within(bare).getByRole('button', { name: /Set SAP/ }));
  fireEvent.change(await screen.findByLabelText('SAP km'), { target: { value: '190' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save SAP' }));
  await waitFor(() =>
    expect(SapService.setRoute).toHaveBeenCalledWith(
      { fromSiteId: 'p', toSiteId: 'm', sapKm: 190, basis: 'ONE_WAY', note: '' },
      expect.anything(),
    ),
  );
});

it('a new route needs its two places before it can be saved', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /New route/ }));
  expect(await screen.findByLabelText('Plant (loading place)')).toBeTruthy();
  expect(screen.getByLabelText('Drop (unloading place)')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('SAP km'), { target: { value: '90' } });
  expect(screen.getByRole('button', { name: 'Save SAP' }).disabled).toBe(true);
});
