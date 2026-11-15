import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DriverSheetReview from './DriverSheetReview';
import PhotoImportService from '../../services/PhotoImportService';

vi.mock('../../services/PhotoImportService', () => ({
  default: {
    getDriverSheetSuggestions: vi.fn(),
    confirmDriverSheetSuggestions: vi.fn(),
    dismissDriverSheetSuggestions: vi.fn(),
  },
}));

const missing = {
  _id: 's1',
  vehicleId: 'v1',
  plate: 'WB25V8040',
  driverName: 'Asha Roy',
  phone: '98••• 4210',
  matchedDriverId: null,
  appDriverName: null,
  kind: 'MISSING',
  sheetDate: '2026-10-01',
  status: 'PENDING',
};

const conflict = {
  ...missing,
  _id: 's2',
  plate: 'WB11J8562',
  driverName: 'Asha Roy',
  appDriverName: 'Asha Das',
  kind: 'CONFLICT',
};

describe('driver sheet review', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the sheet and app driver names with the secondary details', async () => {
    PhotoImportService.getDriverSheetSuggestions.mockResolvedValue([missing, conflict]);
    render(<DriverSheetReview open onOpenChange={vi.fn()} />);

    expect(await screen.findByText('WB25V8040')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Truck' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Driver from sheet' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Driver in app' })).toBeInTheDocument();
    expect(screen.getAllByText('Asha Roy')).toHaveLength(2);
    expect(screen.getByText('Asha Das')).toBeInTheDocument();
    expect(screen.getAllByText('98••• 4210 · 2026-10-01')).toHaveLength(2);
  });

  it('confirms one row and refreshes the server state', async () => {
    PhotoImportService.getDriverSheetSuggestions
      .mockResolvedValueOnce([missing])
      .mockResolvedValueOnce([]);
    PhotoImportService.confirmDriverSheetSuggestions.mockResolvedValue({
      confirmed: ['s1'],
      failed: [],
    });
    render(<DriverSheetReview open onOpenChange={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    expect(PhotoImportService.confirmDriverSheetSuggestions).toHaveBeenCalledWith(['s1']);
    await waitFor(() => expect(PhotoImportService.getDriverSheetSuggestions).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('WB25V8040')).not.toBeInTheDocument();
  });

  it('confirms all missing rows without including a conflict', async () => {
    PhotoImportService.getDriverSheetSuggestions.mockResolvedValue([missing, conflict]);
    PhotoImportService.confirmDriverSheetSuggestions.mockResolvedValue({
      confirmed: ['s1'],
      failed: [],
    });
    render(<DriverSheetReview open onOpenChange={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm all missing' }));

    expect(PhotoImportService.confirmDriverSheetSuggestions).toHaveBeenCalledWith(['s1']);
  });

  it('keeps a failed row and says that it could not be saved', async () => {
    PhotoImportService.getDriverSheetSuggestions.mockResolvedValue([missing]);
    PhotoImportService.confirmDriverSheetSuggestions.mockResolvedValue({
      confirmed: [],
      failed: [{ id: 's1', message: 'Could not save. Try again.' }],
    });
    render(<DriverSheetReview open onOpenChange={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    expect(await screen.findAllByText('Could not save. Try again.')).not.toHaveLength(0);
    expect(screen.getByText('WB25V8040')).toBeInTheDocument();
  });

  it('offers a retry when the suggestions cannot be loaded', async () => {
    PhotoImportService.getDriverSheetSuggestions.mockRejectedValue(new Error('offline'));
    render(<DriverSheetReview open onOpenChange={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Could not load driver suggestions. Try again.')).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
