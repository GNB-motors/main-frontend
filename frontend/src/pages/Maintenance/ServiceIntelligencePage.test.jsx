import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceIntelligencePage from './ServiceIntelligencePage.jsx';
import { MaintenanceService } from './MaintenanceService.jsx';

vi.mock('./MaintenanceService.jsx', () => ({
  MaintenanceService: {
    listRecords: vi.fn(),
    getSummary: vi.fn(),
    deleteRecord: vi.fn(),
  },
}));

vi.mock('../../utils/session.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getToken: () => 'token', getBranchId: () => null };
});

function makeRecords(total, page, limit) {
  const start = (page - 1) * limit;
  const count = Math.min(limit, Math.max(0, total - start));
  return Array.from({ length: count }, (_, i) => ({
    _id: `r-${start + i}`,
    date: '2026-01-01',
    workshop: 'City Motors',
    type: 'Oil Change',
    amount: 500,
    currentKm: 1000,
    attachments: [],
  }));
}

describe('ServiceIntelligencePage — full-fleet pagination + KPI fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MaintenanceService.getSummary.mockResolvedValue({ total: 45, totalAmount: 90000, last30: 5 });
  });

  it('shows the true total from the summary API rather than the loaded page size', async () => {
    MaintenanceService.listRecords.mockResolvedValue({
      data: makeRecords(45, 1, 20),
      meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
    });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    // KPI card must read the aggregated total (45), not rows.length (20).
    await waitFor(() => expect(screen.getByText('45')).toBeInTheDocument());
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('requests the next page from the API when "Next page" is clicked', async () => {
    MaintenanceService.listRecords.mockResolvedValue({
      data: makeRecords(45, 1, 20),
      meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
    });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument());

    MaintenanceService.listRecords.mockResolvedValue({
      data: makeRecords(45, 2, 20),
      meta: { total: 45, page: 2, limit: 20, totalPages: 3 },
    });

    fireEvent.click(screen.getByTitle('Next page'));

    await waitFor(() =>
      expect(MaintenanceService.listRecords).toHaveBeenLastCalledWith(
        'token',
        expect.objectContaining({ page: 2, limit: 20 }),
      ),
    );
  });

  it('does not render pagination controls when everything fits on one page', async () => {
    MaintenanceService.listRecords.mockResolvedValue({
      data: makeRecords(3, 1, 20),
      meta: { total: 3, page: 1, limit: 20, totalPages: 1 },
    });
    MaintenanceService.getSummary.mockResolvedValue({ total: 3, totalAmount: 1500, last30: 1 });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText('3').length).toBeGreaterThan(0));
    expect(screen.queryByTitle('Next page')).toBeNull();
  });
});
