import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataImportsPage from './DataImportsPage';
import DataImportService from '@/services/DataImportService';

vi.mock('@/services/DataImportService', () => ({
  default: {
    listRuns: vi.fn(),
    listMappings: vi.fn(),
    preview: vi.fn(),
    apply: vi.fn(),
    saveMapping: vi.fn(),
  },
}));

describe('data imports page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DataImportService.listRuns.mockResolvedValue({ data: [] });
  });

  it('is the spreadsheet importer on its own', async () => {
    render(<DataImportsPage />);
    expect(await screen.findByText(/No imports applied yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upload photos/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Photos')).not.toBeInTheDocument();
  });
});
