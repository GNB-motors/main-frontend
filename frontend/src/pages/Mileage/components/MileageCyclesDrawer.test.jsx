import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MileageCyclesDrawer from './MileageCyclesDrawer';
import { MileageService } from '../MileageService';

vi.mock('../MileageService', () => ({ MileageService: { getMileage: vi.fn() } }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }) => <div>{children}</div>,
  SheetContent: ({ children }) => <div>{children}</div>,
  SheetHeader: ({ children }) => <div>{children}</div>,
  SheetTitle: ({ children }) => <h2>{children}</h2>,
  SheetDescription: ({ children }) => <p>{children}</p>,
  SheetClose: ({ children }) => <button type="button">{children}</button>,
}));

const range = { from: '2026-10-01', to: '2026-10-30', manufacturer: '' };
const truck = { registrationNumber: 'WB11L8862', driverName: 'Ramesh Yadav' };

const cycle = {
  registrationNumber: 'WB11L8862',
  from: '2026-10-02T00:00:00Z',
  to: '2026-10-19T00:00:00Z',
  km: 4820,
  dieselL: 1420,
  kmPerL: 3.4,
  usualKmPerL: 3.2,
  defL: 61,
  defPctOfDiesel: 4.3,
  verdict: 'ADDS_UP',
  source: 'RECONCILED_REGISTER',
};

const renderDrawer = (props = {}) =>
  render(<MileageCyclesDrawer truck={truck} range={range} onClose={() => {}} {...props} />);

describe('MileageCyclesDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for the cycles of that one truck', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderDrawer();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(MileageService.getMileage).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: 'cycle', vehicle: 'WB11L8862' }),
      expect.anything(),
    );
  });

  it('shows the km/L, the DEF and the check of each cycle', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderDrawer();
    expect(await screen.findByText('3.40 km/L')).toBeInTheDocument();
    expect(screen.getByText('Adds up')).toBeInTheDocument();
    expect(screen.getByText('DEF 61 L')).toBeInTheDocument();
  });

  it('says a cycle that was checked against the oil report', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [cycle] });
    renderDrawer();
    expect(await screen.findByText('From your oil report')).toBeInTheDocument();
  });

  it('says it is loading', async () => {
    MileageService.getMileage.mockReturnValue(new Promise(() => {}));
    renderDrawer();
    expect(await screen.findByText(/loading/i)).toBeInTheDocument();
  });

  it('says the list failed and offers a retry', async () => {
    MileageService.getMileage.mockRejectedValue({ status: 500 });
    renderDrawer();
    expect(await screen.findByText(/couldn.t load this/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('says the list is being built when the endpoint is not shipped yet', async () => {
    MileageService.getMileage.mockRejectedValue({ status: 404 });
    renderDrawer();
    expect(await screen.findByText(/is being built and will appear here/i)).toBeInTheDocument();
  });

  it('says when the truck has no cycles in these dates', async () => {
    MileageService.getMileage.mockResolvedValue({ items: [] });
    renderDrawer();
    expect(
      await screen.findByText(/no fill-to-fill cycles for this truck in these dates/i),
    ).toBeInTheDocument();
  });
});
