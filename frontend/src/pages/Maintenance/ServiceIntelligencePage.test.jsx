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
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    getAlerts: vi.fn(),
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
    MaintenanceService.getAlerts.mockResolvedValue([]);
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

  it('switches to Repair tab, displays Priority filter pills, and filters P0 broken axle issues', async () => {
    const repairRecords = [
      {
        _id: 'rep-1',
        recordType: 'REPAIR',
        date: '2026-02-10',
        workshop: 'Tata Workshop NH6',
        type: 'Axle breakdown',
        notes: 'Rear axle broken near Kolaghat',
        amount: 35000,
        vehicleId: { registrationNumber: 'WB25R9540', model: 'Tata Signa 4825.TK' },
        attachments: [],
      },
      {
        _id: 'rep-2',
        recordType: 'REPAIR',
        date: '2026-02-12',
        workshop: 'Highway Tyre Point',
        type: 'Tyre puncture',
        notes: 'Rear left tyre puncture fixed',
        amount: 450,
        vehicleId: { registrationNumber: 'WB11A1234', model: 'Ashok Leyland 2820' },
        attachments: [],
      },
    ];

    MaintenanceService.listRecords.mockResolvedValue({
      data: repairRecords,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
    MaintenanceService.getSummary.mockResolvedValue({ total: 2, totalAmount: 35450, last30: 2 });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    // Switch to Repair & Breakdowns tab
    const repairTab = screen.getByRole('tab', { name: /Repair/i });
    fireEvent.click(repairTab);

    // Wait for repair records to appear
    await waitFor(() => expect(screen.getByText('Axle breakdown')).toBeInTheDocument());
    expect(screen.getByText('Tyre puncture')).toBeInTheDocument();

    // Verify Criticality tags
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();

    // Click on P0 Critical filter pill
    const p0Pill = screen.getByText(/P0 Critical/i);
    fireEvent.click(p0Pill);

    // Axle breakdown is shown, tyre puncture is filtered out
    expect(screen.getByText('Axle breakdown')).toBeInTheDocument();
    expect(screen.queryByText('Tyre puncture')).toBeNull();
  });

  it('allows resolving an open repair issue via ResolveIssueModal', async () => {
    const repairRecord = {
      _id: 'rep-101',
      recordType: 'REPAIR',
      date: '2026-03-01',
      workshop: 'Tata Authorized Center',
      type: 'Broken Axle',
      notes: 'Vehicle grounded with axle shaft crack',
      amount: 25000,
      vehicleId: { registrationNumber: 'WB25R9999', model: 'Tata Prima' },
      attachments: [],
    };

    MaintenanceService.listRecords.mockResolvedValue({
      data: [repairRecord],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    MaintenanceService.getSummary.mockResolvedValue({ total: 1, totalAmount: 25000, last30: 1 });
    MaintenanceService.updateRecord.mockResolvedValue({
      ...repairRecord,
      notes: `${repairRecord.notes} [RESOLVED: Replaced axle with OEM part]`,
      status: 'RESOLVED',
    });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    // Switch to Repair tab
    fireEvent.click(screen.getByRole('tab', { name: /Repair/i }));

    // Wait for row
    await waitFor(() => expect(screen.getByText(/Broken axle/i)).toBeInTheDocument());

    // Click the Resolve button
    const resolveBtn = screen.getByTitle('Mark issue as resolved & roadworthy');
    fireEvent.click(resolveBtn);

    // Modal opens
    expect(screen.getByText('Mark Issue as Resolved')).toBeInTheDocument();
    expect(screen.getAllByText('WB25R9999').length).toBeGreaterThanOrEqual(2);

    // Fill in resolution summary
    const textarea = screen.getByPlaceholderText(/Replaced rear axle shaft/i);
    fireEvent.change(textarea, { target: { value: 'Replaced axle with OEM part' } });

    // Submit resolution
    const submitBtn = screen.getByText('Mark as Resolved & Roadworthy');
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(MaintenanceService.updateRecord).toHaveBeenCalledWith(
        'token',
        'rep-101',
        expect.objectContaining({
          notes: expect.stringContaining('[RESOLVED: Replaced axle with OEM part'),
        }),
      ),
    );
  });

  it('filters service records when clicking Periodic / Scheduled filter pill', async () => {
    const serviceRecords = [
      {
        _id: 'srv-1',
        recordType: 'SERVICE',
        date: '2026-02-01',
        workshop: 'City Garage',
        type: 'Periodic / Scheduled Service',
        amount: 8000,
        vehicleId: { registrationNumber: 'DL01AB1111', model: 'Eicher Pro' },
      },
      {
        _id: 'srv-2',
        recordType: 'SERVICE',
        date: '2026-02-05',
        workshop: 'Castrol Auto',
        type: 'Engine Oil Change',
        amount: 3500,
        vehicleId: { registrationNumber: 'DL01AB2222', model: 'Tata 407' },
      },
    ];

    MaintenanceService.listRecords.mockResolvedValue({
      data: serviceRecords,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
    MaintenanceService.getSummary.mockResolvedValue({ total: 2, totalAmount: 11500, last30: 2 });

    render(
      <MemoryRouter>
        <ServiceIntelligencePage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Periodic \/ scheduled service/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Engine oil change/i)).toBeInTheDocument();

    const periodicPill = screen.getByRole('button', { name: /Periodic \/ Scheduled/i });
    fireEvent.click(periodicPill);

    expect(screen.getByText(/Periodic \/ scheduled service/i)).toBeInTheDocument();
    expect(screen.queryByText(/Engine oil change/i)).toBeNull();
  });
});
