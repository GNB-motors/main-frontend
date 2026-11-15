import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeviationView from './DeviationView.jsx';
import RouteHubService from '../../../services/RouteHubService';

vi.mock('../../../services/RouteHubService', () => ({
  default: {
    getDeviationEvents: vi.fn(),
    getDeviationEvent: vi.fn(),
    reviewDeviationEvent: vi.fn(),
  },
}));
vi.mock('./deviation/DeviationDetail.jsx', () => ({ default: () => null }));

const row = (id, corridorLabel = 'Other corridor') => ({
  _id: id,
  registrationNumber: 'WB25R9540',
  corridorLabel,
  startedAt: '2026-11-09T00:00:00Z',
  status: 'OPEN',
  estimatedExtraCostInr: null,
});
const response = (records, total, extra = {}) => ({
  records,
  summary: {
    total,
    open: total,
    openCostInr: 900,
    openCostCount: 2,
    byLeg: { LADEN: 0, RETURN: 0, NONE: total },
    ...extra,
  },
  totalPages: Math.ceil(total / 100),
});
const kpi = (label) => screen.getByText(label).closest('.kpi').querySelector('.kpi-val');
const setBadge = vi.fn();
const mount = () =>
  render(
    <DeviationView
      params={new URLSearchParams()}
      toast={vi.fn()}
      setBadge={setBadge}
      go={vi.fn()}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  RouteHubService.getDeviationEvent.mockResolvedValue({});
  RouteHubService.getDeviationEvents.mockImplementation(async ({ q, page }) => {
    if (q === 'Patna') return response([row('patna', 'Patna corridor')], 3);
    if (q === '25r') return response([row('partial')], 1);
    return response([row(`all-${page}`)], 142);
  });
});

it('searches the server, resets pagination, and uses the matching summary and rows', async () => {
  mount();
  await screen.findByText(/Page 1 of 2 · 142 detours/);
  expect(kpi('Est. detour cost')).toHaveTextContent('₹900');
  fireEvent.click(screen.getByRole('button', { name: 'Older' }));
  await screen.findByText(/Page 2 of 2 · 142 detours/);
  setBadge.mockClear();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search vehicle number or place' }), {
    target: { value: 'Patna' },
  });
  await waitFor(() =>
    expect(RouteHubService.getDeviationEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'Patna', page: 1 }),
      expect.any(AbortSignal),
    ),
  );
  expect(await screen.findByText('Patna corridor')).toBeInTheDocument();
  expect(kpi('Detours')).toHaveTextContent('3');
  expect(screen.queryByText(/142 detours/)).not.toBeInTheDocument();
  expect(setBadge).not.toHaveBeenCalled();

  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '25r' } });
  await waitFor(() =>
    expect(RouteHubService.getDeviationEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: '25r', page: 1 }),
      expect.any(AbortSignal),
    ),
  );
  await waitFor(() => expect(kpi('Detours')).toHaveTextContent('1'));
});

it('distinguishes a known zero estimate from a missing estimate using the full summary', async () => {
  RouteHubService.getDeviationEvents.mockResolvedValue(
    response([row('unknown-on-page')], 1, { openCostInr: 0, openCostCount: 1 }),
  );
  mount();
  await waitFor(() => expect(kpi('Est. detour cost')).toHaveTextContent('₹0'));
  RouteHubService.getDeviationEvents.mockResolvedValue(
    response([], 0, { openCostInr: 0, openCostCount: 0 }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(kpi('Est. detour cost')).toHaveTextContent('—'));
});
