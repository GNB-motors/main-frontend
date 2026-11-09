import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../../utils/axiosConfig';
import CompletedCyclesSubtab from './CompletedCyclesSubtab';

vi.mock('../../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('@/components/ui/popover', async () => (await import('../../../test/baseUiStubs')).popover);

const range = { from: '2026-11-01', to: '2026-11-07', manufacturer: 'TATA' };
const nextRange = { ...range, from: '2026-11-08', to: '2026-11-09' };
const payload = (plate = 'WB11A1111', total = 11) => ({
  data: {
    status: 'success',
    data: [
      {
        _id: plate,
        vehicleId: { _id: 'v1', registrationNumber: plate },
        startDate: '2026-10-20T00:00:00Z',
        endDate: '2026-11-03T00:00:00Z',
        distanceKm: 1000,
        fuelConsumedLiters: 250,
        mileageKmPerL: 4,
      },
    ],
    meta: { total, totalPages: Math.ceil(total / 10) },
  },
});
const view = (dates = range, fuelCyclesAllowed = false) => (
  <MemoryRouter>
    <CompletedCyclesSubtab range={dates} searchQuery="WB11" fuelCyclesAllowed={fuelCyclesAllowed} />
  </MemoryRouter>
);

beforeEach(() => vi.clearAllMocks());

it('sends IST date bounds on every list page and resets pagination when dates change', async () => {
  apiClient.get.mockResolvedValue(payload());
  const { rerender } = render(view());
  await screen.findByText('WB11A1111');
  expect(apiClient.get).toHaveBeenLastCalledWith(
    '/api/mileage/intervals',
    expect.objectContaining({
      params: {
        from: '2026-10-31T18:30:00.000Z',
        to: '2026-11-07T18:29:59.999Z',
        manufacturer: 'TATA',
        search: 'WB11',
        status: 'COMPLETED',
        page: 1,
        limit: 10,
      },
    }),
  );
  expect(screen.getByText(/Rounds completed in the selected dates \(IST\)/)).toBeInTheDocument();
  expect(screen.queryByText(/shows all dates/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Next Page'));
  await waitFor(() => expect(apiClient.get.mock.calls.at(-1)[1].params.page).toBe(2));
  expect(apiClient.get.mock.calls.at(-1)[1].params.from).toBe('2026-10-31T18:30:00.000Z');

  rerender(view(nextRange));
  await waitFor(() =>
    expect(apiClient.get.mock.calls.at(-1)[1].params).toMatchObject({
      page: 1,
      from: '2026-11-07T18:30:00.000Z',
      to: '2026-11-09T18:29:59.999Z',
      manufacturer: 'TATA',
      search: 'WB11',
    }),
  );
});

it('cancels the old date request and ignores its late rows', async () => {
  let finishOld;
  apiClient.get.mockImplementation((_url, { params }) =>
    params.from === '2026-10-31T18:30:00.000Z'
      ? new Promise((resolve) => {
          finishOld = resolve;
        })
      : Promise.resolve(payload('WB11NEW', 1)),
  );
  const { rerender } = render(view());
  await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
  const oldSignal = apiClient.get.mock.calls[0][1].signal;
  rerender(view(nextRange));
  expect(await screen.findByText('WB11NEW')).toBeInTheDocument();
  expect(oldSignal.aborted).toBe(true);
  await act(async () => {
    finishOld(payload('WB11OLD'));
  });
  expect(screen.queryByText('WB11OLD')).not.toBeInTheDocument();
});

it('keeps bill-cycle source selection when that source has no completions in the selected dates', async () => {
  apiClient.get.mockImplementation((_url, { params }) =>
    Promise.resolve(
      params.limit === 1
        ? payload('WB11HISTORIC', 1)
        : { data: { status: 'success', data: [], meta: { total: 0, totalPages: 0 } } },
    ),
  );
  render(view(range, true));
  expect(
    await screen.findByText('No full-tank rounds completed in these dates'),
  ).toBeInTheDocument();
  expect(apiClient.get.mock.calls.some(([url]) => url === '/api/reports/fuel-cycles')).toBe(false);
  const listCall = apiClient.get.mock.calls.find(([, { params }]) => params.limit === 10);
  expect(listCall[1].params).toMatchObject({
    from: '2026-10-31T18:30:00.000Z',
    to: '2026-11-07T18:29:59.999Z',
  });
  expect(screen.queryByText('WB11HISTORIC')).not.toBeInTheDocument();
});
