import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FillToFillView from './FillToFillView';
import { MileageService } from '../MileageService';

vi.mock('../MileageService', () => ({ MileageService: { getMileage: vi.fn() } }));

const range = { from: '2026-10-01', to: '2026-10-30', manufacturer: '' };

const cycle = {
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
  source: 'RECONCILED_REGISTER',
};

const renderView = (props = {}) =>
  render(
    <MemoryRouter>
      <FillToFillView range={range} {...props} />
    </MemoryRouter>,
  );

describe('FillToFillView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for one row per cycle', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(MileageService.getMileage).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: 'cycle' }),
      expect.anything(),
    );
  });

  it('says a cycle that was checked against the oil report', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderView();
    expect(await screen.findByText('From your oil report')).toBeInTheDocument();
  });

  it('says a cycle that came from the truck alone', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [{ ...cycle, source: 'TELEMETRY' }] });
    renderView();
    expect(await screen.findByText('From the truck')).toBeInTheDocument();
  });

  it('shows the km/L, the DEF and the check of each cycle', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('3.40 km/L')).toBeInTheDocument();
    expect(screen.getByText('4.3%')).toBeInTheDocument();
    expect(screen.getByText('Adds up')).toBeInTheDocument();
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

  it('says the list is being built when the endpoint is not shipped yet', async () => {
    MileageService.getMileage.mockRejectedValue({ status: 404 });
    renderView();
    expect(await screen.findByText(/is being built and will appear here/i)).toBeInTheDocument();
  });

  it('says when there is nothing to show', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [] });
    renderView();
    expect(await screen.findByText(/no fill-to-fill cycles in these dates/i)).toBeInTheDocument();
  });

  it('says the list is held when the backend holds it', async () => {
    MileageService.getMileage.mockResolvedValue({
      held: true,
      why: { text: 'The oil register is being matched.' },
    });
    renderView();
    expect(await screen.findByText(/not shown yet/i)).toBeInTheDocument();
    expect(screen.getByText(/the oil register is being matched/i)).toBeInTheDocument();
  });
});
