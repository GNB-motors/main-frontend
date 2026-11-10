import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataImportsPage from './DataImportsPage';
import DataImportService from '@/services/DataImportService';
import PhotoImportService from '@/services/PhotoImportService';

vi.mock('@/services/DataImportService', () => ({
  default: {
    listRuns: vi.fn(),
    listMappings: vi.fn(),
    preview: vi.fn(),
    apply: vi.fn(),
    saveMapping: vi.fn(),
  },
}));

vi.mock('@/services/PhotoImportService', () => ({
  default: {
    start: vi.fn(),
    reupload: vi.fn(),
    getBatch: vi.fn(),
    getDriverPeriods: vi.fn(),
    confirmDriverPeriods: vi.fn(),
    listBatches: vi.fn(),
    listDrivers: vi.fn(),
  },
}));

describe('data imports page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DataImportService.listRuns.mockResolvedValue({ data: [] });
    PhotoImportService.listBatches.mockResolvedValue([]);
    PhotoImportService.listDrivers.mockResolvedValue([]);
    PhotoImportService.getDriverPeriods.mockResolvedValue([]);
  });

  it('offers the photo importer next to the CSV importer', async () => {
    render(<DataImportsPage />);
    expect(await screen.findByText(/Nothing applied yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload photos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Driver predictions' })).toBeInTheDocument();
  });

  it('opens the photo importer as a dialog, not a new page', async () => {
    render(<DataImportsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Upload photos/ }));
    expect(await screen.findByRole('dialog', { name: 'Upload photos' })).toBeInTheDocument();
  });

  it('opens the driver chart as a dialog', async () => {
    render(<DataImportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Driver predictions' }));
    expect(await screen.findByRole('dialog', { name: 'Driver predictions' })).toBeInTheDocument();
  });
});
