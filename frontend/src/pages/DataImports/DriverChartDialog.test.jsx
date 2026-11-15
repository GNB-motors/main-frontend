import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DriverChartDialog from './DriverChartDialog';
import PhotoImportService from '@/services/PhotoImportService';

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

const SENSITIVE = /aadhaar\s*\d|\d{4}\s?\d{4}\s?\d{4}/i;

// What the operator actually reads: every rendered run of text, checked on its
// own, so a phone number next to a date is not mistaken for an identity number.
function sensitiveText() {
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (SENSITIVE.test(node.textContent || '')) found.push(node.textContent);
    node = walker.nextNode();
  }
  return found;
}

const PERIODS = [
  {
    periodId: 'p1',
    vehicleId: 'v1',
    plate: 'WB11T0662',
    driverName: 'Ram Das',
    phone: '9876500011',
    from: '2026-10-01',
    to: '2026-10-10',
    photoCount: 4,
    status: 'predicted',
    warnings: [
      {
        code: 'REGISTER_MISMATCH',
        message: 'Aadhaar written on the register differs from the card',
      },
    ],
  },
  {
    periodId: 'p2',
    vehicleId: 'v1',
    plate: 'WB11T0662',
    driverName: 'Sita Roy',
    phone: '9876500022',
    from: '2026-10-11',
    to: '2026-10-20',
    photoCount: 2,
    status: 'predicted',
    warnings: [],
  },
];

function open(props = {}) {
  return render(<DriverChartDialog open batchId="b1" onOpenChange={vi.fn()} {...props} />);
}

describe('driver predictions chart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PhotoImportService.getDriverPeriods.mockResolvedValue(PERIODS);
    PhotoImportService.confirmDriverPeriods.mockResolvedValue({ ok: true });
    PhotoImportService.listDrivers.mockResolvedValue([
      { _id: 'd1', firstName: 'Mohan', lastName: 'Pal', mobileNumber: '9876500033' },
    ]);
    PhotoImportService.listBatches.mockResolvedValue([]);
  });

  it('draws a timeline per truck and a row per driver period', async () => {
    open();
    expect(await screen.findByText('Ram Das')).toBeInTheDocument();
    expect(screen.getByText('Sita Roy')).toBeInTheDocument();
    expect(screen.getByText('WB11T0662')).toBeInTheDocument();
    expect(screen.getByLabelText('Driver timeline chart')).toBeInTheDocument();
  });

  it('shows the warning where the register and the card did not agree', async () => {
    open();
    expect(
      await screen.findByText('Aadhaar written on the register differs from the card'),
    ).toBeInTheDocument();
  });

  it('confirms one period on its own', async () => {
    open();
    await screen.findByText('Ram Das');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Ram Das' }));
    await waitFor(() => expect(PhotoImportService.confirmDriverPeriods).toHaveBeenCalledTimes(1));
    const [batchId, payload] = PhotoImportService.confirmDriverPeriods.mock.calls[0];
    expect(batchId).toBe('b1');
    expect(payload).toEqual({ items: [{ periodId: 'p1', action: 'confirm' }] });
  });

  it('rejects a period that is wrong', async () => {
    open();
    await screen.findByText('Ram Das');
    fireEvent.click(screen.getByRole('button', { name: 'Reject Ram Das' }));
    await waitFor(() => expect(PhotoImportService.confirmDriverPeriods).toHaveBeenCalledTimes(1));
    expect(PhotoImportService.confirmDriverPeriods.mock.calls[0][1]).toEqual({
      items: [{ periodId: 'p1', action: 'reject' }],
    });
  });

  it('sends a period to another driver instead of guessing', async () => {
    open();
    await screen.findByText('Ram Das');
    fireEvent.click(screen.getByRole('combobox', { name: 'Pick another driver for Ram Das' }));
    fireEvent.click(await screen.findByRole('option', { name: /Mohan Pal/ }));
    await waitFor(() => expect(PhotoImportService.confirmDriverPeriods).toHaveBeenCalledTimes(1));
    expect(PhotoImportService.confirmDriverPeriods.mock.calls[0][1]).toEqual({
      items: [{ periodId: 'p1', action: 'edit', driverUserId: 'd1' }],
    });
  });

  it('confirms the whole batch in one go', async () => {
    open();
    await screen.findByText('Ram Das');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all' }));
    await waitFor(() => expect(PhotoImportService.confirmDriverPeriods).toHaveBeenCalledTimes(1));
    expect(PhotoImportService.confirmDriverPeriods.mock.calls[0][1]).toEqual({ all: true });
  });

  it('never puts an identity number on the screen', async () => {
    open();
    await screen.findByText('Ram Das');
    expect(sensitiveText()).toEqual([]);
  });
});
