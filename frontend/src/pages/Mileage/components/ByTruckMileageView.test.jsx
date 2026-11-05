import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ByTruckMileageView from './ByTruckMileageView';
import { MileageService } from '../MileageService';

vi.mock('../MileageService', () => ({ MileageService: { getMileage: vi.fn() } }));
vi.mock('../mileageApi', () => ({
  MileageApi: { modelComparison: vi.fn(() => Promise.resolve({ data: [] })) },
}));

const range = { from: '2026-10-01', to: '2026-10-30', manufacturer: '' };

const truck = {
  registrationNumber: 'WB11L8862',
  driverName: 'Ramesh Yadav',
  from: '2026-10-02T00:00:00Z',
  to: '2026-10-19T00:00:00Z',
  km: 4820,
  dieselL: 1420,
  kmPerL: 3.4,
  usualKmPerL: 3.2,
  defL: 61,
  defPctOfDiesel: 4.3,
  defBand: { min: 3, max: 6 },
  verdict: 'ADDS_UP',
  verdictWhy: { text: 'The diesel used matches the km driven at this truck’s usual km/L.' },
  source: 'RECONCILED_REGISTER',
};

const renderView = (props = {}) =>
  render(
    <MemoryRouter>
      <ByTruckMileageView range={range} {...props} />
    </MemoryRouter>,
  );

describe('ByTruckMileageView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for one row per truck, with the hub dates', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [truck] });
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(MileageService.getMileage).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: 'truck', from: expect.any(String), to: expect.any(String) }),
      expect.anything(),
    );
  });

  it('shows the km/L, the DEF and the check of each truck', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [truck] });
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('3.40 km/L')).toBeInTheDocument();
    expect(screen.getByText('3.20 km/L')).toBeInTheDocument();
    expect(screen.getByText('4.3%')).toBeInTheDocument();
    expect(screen.getByText('61 L')).toBeInTheDocument();
    expect(screen.getByText('Adds up')).toBeInTheDocument();
  });

  it('says the band DEF normally sits in', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [truck] });
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText(/normal 3–6% of diesel/)).toBeInTheDocument();
  });

  it('shows a skeleton while it waits', () => {
    MileageService.getMileage.mockReturnValue(new Promise(() => {}));
    const { container } = renderView();
    expect(container.querySelectorAll('.dt-skel').length).toBeGreaterThan(0);
  });

  it('says the list failed and offers a retry', async () => {
    MileageService.getMileage.mockRejectedValue({ status: 500 });
    renderView();
    expect(await screen.findByText(/couldn.t load this/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('falls back to the old mileage list while the endpoint is being built', async () => {
    MileageService.getMileage.mockRejectedValue({ status: 404 });
    renderView();
    expect(await screen.findByText(/no full-tank rounds in these dates/i)).toBeInTheDocument();
  });

  it('says when there is nothing to show', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [] });
    renderView();
    expect(await screen.findByText(/no trucks in these dates/i)).toBeInTheDocument();
  });

  it('says the list is held when the backend holds it', async () => {
    MileageService.getMileage.mockResolvedValue({
      held: true,
      why: { text: 'Tank telemetry is being rebuilt.' },
    });
    renderView();
    expect(await screen.findByText(/not shown yet/i)).toBeInTheDocument();
    expect(screen.getByText(/tank telemetry is being rebuilt/i)).toBeInTheDocument();
  });

  it('never accuses a truck in the words it uses', async () => {
    MileageService.getMileage.mockResolvedValue({
      items: [{ ...truck, verdict: 'UNEXPLAINED' }],
    });
    const { container } = renderView();
    await screen.findByText('WB11L8862');
    expect(container.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });

  it('says why a truck has no km/L yet', async () => {
    MileageService.getMileage.mockResolvedValue({
      items: [{ ...truck, kmPerL: null, usualKmPerL: null }],
    });
    renderView();
    await screen.findByText('WB11L8862');
    expect(screen.getByText('no full-tank round')).toBeInTheDocument();
    expect(screen.getByText('no history yet')).toBeInTheDocument();
  });

  it('says once, on the column, that no driver is assigned', async () => {
    MileageService.getMileage.mockResolvedValue({
      items: [{ ...truck, driverName: null }],
    });
    renderView();
    await screen.findByText('WB11L8862');
    expect(
      screen.getByRole('button', { name: 'Why the driver column is empty' }),
    ).toBeInTheDocument();
  });
});
