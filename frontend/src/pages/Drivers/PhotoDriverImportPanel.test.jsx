import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoDriverImportPanel from './PhotoDriverImportPanel';
import PhotoImportService from '../../services/PhotoImportService';

vi.mock('../../services/PhotoImportService', () => ({
  default: { start: vi.fn(), getDriverRows: vi.fn(), resolveDrivers: vi.fn() },
}));
vi.mock('../DataImports/DriverChartDialog', () => ({ default: () => null }));

const rows = [
  {
    key: 'k1',
    nameRead: 'Asha Roy',
    phone: '9876543210',
    photoCount: 2,
    match: { status: 'existing', userId: 'u1' },
  },
  {
    key: 'k2',
    nameRead: 'Ram Das',
    photoCount: 1,
    match: { status: 'likely', candidates: [{ userId: 'u2', name: 'Ram Das' }] },
  },
  { key: 'k3', nameRead: 'New Person', photoCount: 1, match: { status: 'new' } },
];

const photo = () => new File(['x'], 'register.jpg', { type: 'image/jpeg' });

describe('photo driver import panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PhotoImportService.start.mockResolvedValue({ batchId: 'batch-1' });
    PhotoImportService.getDriverRows.mockResolvedValue(rows);
    PhotoImportService.resolveDrivers.mockResolvedValue({ created: 1 });
  });

  it('uploads the photos as a drivers batch and reads the rows back', async () => {
    render(<PhotoDriverImportPanel open onOpenChange={vi.fn()} context="drivers" />);
    fireEvent.change(screen.getByLabelText('Driver photos'), { target: { files: [photo()] } });
    expect(await screen.findByText('Already in your list: Asha Roy')).toBeInTheDocument();
    expect(PhotoImportService.start).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'drivers' }),
    );
    expect(PhotoImportService.getDriverRows).toHaveBeenCalledWith('batch-1');
  });

  it('shows what we know, what it may be and what is new', async () => {
    render(<PhotoDriverImportPanel open onOpenChange={vi.fn()} context="drivers" />);
    fireEvent.change(screen.getByLabelText('Driver photos'), { target: { files: [photo()] } });
    expect(await screen.findByText('Already in your list: Asha Roy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ram Das/ })).toBeInTheDocument();
    expect(screen.getAllByText('New driver').length).toBe(2);
    expect(screen.queryByText(/0\.9/)).not.toBeInTheDocument();
  });

  it('saves every row with the owner decisions', async () => {
    render(<PhotoDriverImportPanel open onOpenChange={vi.fn()} context="drivers" />);
    fireEvent.change(screen.getByLabelText('Driver photos'), { target: { files: [photo()] } });
    await screen.findByText('Already in your list: Asha Roy');
    fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    await waitFor(() =>
      expect(PhotoImportService.resolveDrivers).toHaveBeenCalledWith('batch-1', [
        { key: 'k1', action: 'use', userId: 'u1' },
        { key: 'k2', action: 'use', userId: 'u2' },
        { key: 'k3', action: 'create', name: 'New Person' },
      ]),
    );
  });

  it('uploads the selected files without a second chooser', async () => {
    const file = photo();
    render(<PhotoDriverImportPanel open initialFiles={[file]} onOpenChange={vi.fn()} />);
    await waitFor(() =>
      expect(PhotoImportService.start).toHaveBeenCalledWith({ files: [file], context: 'drivers' }),
    );
    expect(screen.queryByRole('button', { name: /tap to choose/ })).not.toBeInTheDocument();
  });

  it('sends assignment photos as an assignments batch', async () => {
    render(<PhotoDriverImportPanel open onOpenChange={vi.fn()} context="assignments" />);
    fireEvent.change(screen.getByLabelText('Driver photos'), { target: { files: [photo()] } });
    await waitFor(() =>
      expect(PhotoImportService.start).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'assignments' }),
      ),
    );
    expect(PhotoImportService.getDriverRows).not.toHaveBeenCalled();
  });
});
