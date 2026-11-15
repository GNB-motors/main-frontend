import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FuelIntegrityPage from './FuelIntegrityPage';
import { FuelIntegrityService } from './FuelIntegrityService';

vi.mock('./FuelIntegrityService', () => ({
  FuelIntegrityService: {
    getSummary: vi.fn(),
    getFills: vi.fn(),
    getWindows: vi.fn(),
    getPumpLedger: vi.fn(),
  },
}));
vi.mock('./RefuelAdvisoryCard', () => ({ default: () => null }));
vi.mock('../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn().mockResolvedValue([]),
}));
vi.mock('./PumpsWatchCard', () => ({ default: () => null }));
vi.mock('./integrity/IntegrityHeaderActions', () => ({
  default: ({ fetchData }) => <button onClick={() => fetchData()}>Refresh</button>,
}));
vi.mock('./FuelIntegrityTables', () => ({
  default: (props) => (
    <div>
      <output aria-label="Loaded fills">{props.fills.length}</output>
      <output aria-label="Loaded events">{props.filteredCount}</output>
      <output aria-label="Chart loss">
        {props.chartData.reduce((sum, day) => sum + day.loss, 0)}
      </output>
      <input
        aria-label="Vehicle query"
        value={props.vehicleQuery}
        onChange={(e) => props.onVehicleQueryChange(e.target.value)}
      />
      <button onClick={props.onApplyFilter}>Apply vehicle</button>
      <button onClick={() => props.onOpenEvent(props.pageEvents.find((ev) => ev.kind === 'loss'))}>
        Show loss working
      </button>
    </div>
  ),
}));

const window = { from: '2026-11-01T00:00:00Z', to: '2026-11-09T00:00:00Z' };
const fills = Array.from({ length: 160 }, (_, i) => ({
  _id: `f${i}`,
  registrationNumber: 'WB25R9540',
  litres: 100,
  at: '2026-11-08T06:00:00Z',
  confirmationStatus: 'CONFIRMED',
}));
const loss = {
  _id: 'w1',
  registrationNumber: 'WB25R9540',
  mathVersion: 'v2',
  verdict: 'REVIEW_LOSS',
  reviewLossL: 40,
  unaccountedLossL: 40,
  reviewLineL: 15,
  windowFrom: window.from,
  windowTo: window.to,
};
const fillPage = ({ page = 1, vehicle } = {}) => ({
  window,
  records: vehicle
    ? [{ ...fills[0], _id: 'new-scope', registrationNumber: vehicle }]
    : fills.slice((page - 1) * 100, page * 100),
  total: vehicle ? 1 : 160,
  page,
  totalPages: vehicle ? 1 : 2,
});
const mount = () =>
  render(
    <MemoryRouter>
      <FuelIntegrityPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  FuelIntegrityService.getSummary.mockResolvedValue({
    window,
    mathVersion: 'v2',
    vehicles: [],
    totals: { totalFillsLitres: 16000, siphonSuspectedLossL: 40 },
  });
  FuelIntegrityService.getWindows.mockResolvedValue({ records: [loss], total: 1 });
  FuelIntegrityService.getFills.mockImplementation(async (params) => fillPage(params));
  FuelIntegrityService.getPumpLedger.mockResolvedValue({ pumps: [] });
});

it('loads the remaining fills in the same window, deduplicating overlapping pages', async () => {
  mount();
  await screen.findByText('Showing 100 of 160 fills');
  FuelIntegrityService.getFills.mockImplementationOnce(async (params) => ({
    ...fillPage(params),
    records: [fills[99], ...fills.slice(100)],
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Load more fills' }));
  await screen.findByText('Showing 160 of 160 fills');
  expect(FuelIntegrityService.getFills).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2, limit: 100, from: window.from, to: window.to }),
    expect.any(AbortSignal),
  );
  expect(screen.getByLabelText('Loaded fills')).toHaveTextContent('160');
  expect(screen.getByLabelText('Loaded events')).toHaveTextContent('161');
  expect(screen.queryByRole('button', { name: 'Load more fills' })).not.toBeInTheDocument();
});

it('lets a failed extra-page request retry without losing the loaded fills', async () => {
  mount();
  await screen.findByText('Showing 100 of 160 fills');
  FuelIntegrityService.getFills.mockRejectedValueOnce(new Error('Connection lost'));
  fireEvent.click(screen.getByRole('button', { name: 'Load more fills' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');
  expect(screen.getByLabelText('Loaded fills')).toHaveTextContent('100');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading fills' }));
  await screen.findByText('Showing 160 of 160 fills');
  expect(FuelIntegrityService.getFills.mock.calls.slice(1).map(([params]) => params.page)).toEqual([
    2, 2,
  ]);
});

it('cancels an in-flight extra page when the vehicle scope changes', async () => {
  mount();
  await screen.findByText('Showing 100 of 160 fills');
  let resolve;
  let signal;
  FuelIntegrityService.getFills.mockImplementationOnce((_params, nextSignal) => {
    signal = nextSignal;
    return new Promise((done) => {
      resolve = done;
    });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Load more fills' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Vehicle query' }), {
    target: { value: 'NEW' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply vehicle' }));
  await waitFor(() => expect(screen.getByLabelText('Loaded fills')).toHaveTextContent(/^1$/));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(fillPage({ page: 2 })));
  expect(screen.getByLabelText('Loaded fills')).toHaveTextContent(/^1$/);
});

it('refreshes already loaded pages instead of reducing the feed back to 100', async () => {
  mount();
  await screen.findByText('Showing 100 of 160 fills');
  fireEvent.click(screen.getByRole('button', { name: 'Load more fills' }));
  await screen.findByText('Showing 160 of 160 fills');
  FuelIntegrityService.getFills.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(FuelIntegrityService.getFills).toHaveBeenCalledTimes(2));
  expect(FuelIntegrityService.getFills.mock.calls.map(([params]) => params.page)).toEqual([1, 2]);
  expect(screen.getByLabelText('Loaded fills')).toHaveTextContent('160');
});

it('connects the headline, loss chart and working to the 40 L adjusted loss', async () => {
  const { container } = mount();
  await screen.findByText(/40.0 L of unexplained fuel loss needs review/);
  expect(screen.getByLabelText('Chart loss')).toHaveTextContent('40');
  expect(container.textContent).not.toContain('while parked');
  fireEvent.click(screen.getByRole('button', { name: 'Show loss working' }));
  expect(await screen.findByRole('dialog')).toHaveTextContent('Review threshold');
  expect(
    screen.getByText('Fuel loss to review', { selector: '.fi-detail-label' }).parentElement,
  ).toHaveTextContent('40 L');
  expect(screen.getByText('Review threshold').parentElement).toHaveTextContent('15 L');
});
