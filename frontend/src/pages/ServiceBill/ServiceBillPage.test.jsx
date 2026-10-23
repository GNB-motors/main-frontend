import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceBillPage from './ServiceBillPage.jsx';
import { ServiceBillService } from '../../services/ServiceBillService';

vi.mock('../../services/ServiceBillService', () => ({
  ServiceBillService: { list: vi.fn(), linkBill: vi.fn(), closeWithoutBill: vi.fn() },
}));

const noBillRow = {
  id: 'SERVICE-1',
  kind: 'RECORDED',
  state: 'NO_BILL',
  open: true,
  signalsAgreed: ['maintenanceRecord', 'workshopDwell'],
  service: {
    registrationNumber: 'MH12AB1234',
    date: '2026-06-02T00:00:00.000Z',
    workshop: 'City Motors',
    type: 'Engine oil',
    amount: null,
    amountProvenance: { amount: null, kind: 'UNKNOWN', missing: 'NO_AMOUNT_RECORDED' },
    vehicle: { registrationNumber: 'MH12AB1234' },
  },
  bill: null,
  comparison: null,
  estimate: { amount: 4500, kind: 'ESTIMATED', sampleSize: 12 },
  lag: { daysOpen: 21, verdict: 'LONGER_THAN_TYPICAL', orgMedianDays: 4 },
  candidates: [],
  signals: {},
};

const mismatchRow = {
  id: 'SERVICE-2',
  kind: 'RECORDED',
  state: 'IN_LEDGER',
  open: false,
  signalsAgreed: ['maintenanceRecord'],
  service: {
    registrationNumber: 'MH12CD5678',
    date: '2026-06-01T00:00:00.000Z',
    workshop: 'Highway Garage',
    type: 'Clutch',
    amount: 22000,
    amountProvenance: { amount: 22000, kind: 'ENTERED' },
    vehicle: { registrationNumber: 'MH12CD5678' },
  },
  bill: {
    amount: 18500,
    amountProvenance: { amount: 18500, kind: 'EXTRACTED', ocrField: 'total', ocrConfidence: 91 },
    approvedBy: 'Rahul Singh',
    document: { docType: 'RECEIPT', processingStatus: 'SUCCESS', ocrConfidence: 91 },
  },
  comparison: { verdict: 'DISAGREES', delta: -3500, serviceAmount: 22000, billAmount: 18500 },
  estimate: { amount: 20000, kind: 'ESTIMATED', sampleSize: 8 },
  lag: { daysOpen: 3, verdict: 'BILL_RECEIVED' },
  candidates: [],
  signals: {},
};

const respond = (rows) => ({
  data: rows,
  meta: {
    total: rows.length,
    page: 1,
    totalPages: 1,
    summary: { noBill: rows.filter((r) => r.state === 'NO_BILL').length, mismatches: 1 },
  },
});

describe('ServiceBillPage — a missing bill is a state, not a zero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ServiceBillService.list.mockResolvedValue(respond([noBillRow]));
  });

  it('shows "No bill yet" and never renders the missing amount as ₹0', async () => {
    render(
      <MemoryRouter>
        <ServiceBillPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('No bill yet')).toBeInTheDocument());
    expect(screen.getByText('Not a zero — the bill has not arrived')).toBeInTheDocument();
    // The service record had no amount either; that must read as absent, not ₹0.
    expect(screen.getByText('No amount on the service record')).toBeInTheDocument();
    expect(screen.queryByText('₹0')).toBeNull();
  });

  it('never calls an unpaid bill "paid"', async () => {
    render(
      <MemoryRouter>
        <ServiceBillPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('No bill yet')).toBeInTheDocument());
    expect(document.body.textContent).not.toMatch(/paid/i);
  });

  it("shows the open age against the org's own baseline, never as late", async () => {
    render(
      <MemoryRouter>
        <ServiceBillPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText(/longer than your usual 4 days/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Jobs like this usually cost you ₹4,500/)).toBeInTheDocument();
  });

  it('lists which signals agreed', async () => {
    render(
      <MemoryRouter>
        <ServiceBillPage />
      </MemoryRouter>,
    );
    // Shown twice on purpose: once as the fleet's tally, once on the row itself.
    await waitFor(() => expect(screen.getAllByText(/Service logged/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Stood at a workshop/).length).toBeGreaterThan(0);
  });
});

describe('ServiceBillPage — a bill that disagrees shows both, unblended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ServiceBillService.list.mockResolvedValue(respond([mismatchRow]));
  });

  it('names both figures with their own provenance and the difference', async () => {
    render(
      <MemoryRouter>
        <ServiceBillPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('They disagree')).toBeInTheDocument());
    expect(screen.getByText('Service record is ₹3,500 more')).toBeInTheDocument();
    expect(screen.getByText('Both figures stand. Nothing was averaged.')).toBeInTheDocument();
    // Each figure carries its own provenance; the smaller one does not win.
    expect(
      screen.getByText(/Extracted from the bill's "total" · 91% confidence/),
    ).toBeInTheDocument();
    expect(screen.getByText(/approved by Rahul Singh/)).toBeInTheDocument();
    expect(screen.getByText('₹22,000')).toBeInTheDocument();
    expect(screen.getByText('₹18,500')).toBeInTheDocument();
  });
});
