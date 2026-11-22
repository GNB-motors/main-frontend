import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalsPage from './ApprovalsPage';
import OfficeBillApprovals from './OfficeBillApprovals';
import billPhotoService from '../../services/billPhotoService';
import { MileageApi } from '../Mileage/mileageApi';
import { ConfirmedBillRow } from './ConfirmedBillRow';
vi.mock('../../hooks/usePageLayout', () => ({ useFullPageLayout: vi.fn() }));
vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false }),
}));
vi.mock('../Superadmin/components/ReceiptApprovalPage', () => ({
  default: () => <div>WhatsApp queue</div>,
}));
vi.mock('./ApprovalsService', () => ({
  ApprovalsService: { getWhatsAppPendingCount: vi.fn().mockResolvedValue(0) },
}));
vi.mock('../Mileage/mileageApi', () => ({
  MileageApi: { vehicles: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/billPhotoService', () => ({
  default: {
    listBillCaptures: vi.fn(),
    getBillLinkHistory: vi.fn(),
    getBillSuggestion: vi.fn(),
    getBillPage: vi.fn(),
    editBillLink: vi.fn(),
    saveBillLinks: vi.fn(),
    rejectBillCaptures: vi.fn(),
  },
}));
describe('office approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MileageApi.vehicles.mockResolvedValue([]);
  });
  it('shows the office tab and its pending count', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({ captures: [], total: 7 });
    render(
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('tab', { name: /Owner & manager 7/ })).toBeInTheDocument();
    expect(billPhotoService.listBillCaptures).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        uploaderRole: 'OWNER,MANAGER',
        page: 1,
        limit: 1,
      }),
    );
  });
  it('hides the office tab on 404', async () => {
    billPhotoService.listBillCaptures.mockRejectedValue({ response: { status: 404 } });
    render(
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('tab', { name: /Owner & manager/ })).not.toBeInTheDocument(),
    );
  });
  it('shows uploader and confirmer identities and upload confirmation', () => {
    const capture = {
      id: '1',
      createdAt: '2026-11-01T00:00:00Z',
      uploadedBy: { name: 'Asha', role: 'OWNER', phone: '9999999999' },
      ocr: {},
      link: {
        registrationNumber: 'A',
        by: { name: 'Ravi', role: 'MANAGER' },
        at: '2026-11-01T00:00:00Z',
        via: 'UPLOAD',
      },
    };
    render(
      <table>
        <tbody>
          <ConfirmedBillRow capture={capture} index={0} vehicles={[]} onHistory={vi.fn()} />
        </tbody>
      </table>,
    );
    const row = screen.getByRole('row');
    expect(row).toHaveTextContent(/Asha.*Owner/);
    expect(row).toHaveTextContent(/Ravi.*Manager/);
    expect(row).toHaveTextContent('at upload');
    expect(row).not.toHaveTextContent('9999999999');
    fireEvent.click(within(row).getByRole('button', { name: 'Log' }));
  });
});

const CAPTURE = {
  id: 'cap-1',
  createdAt: '2026-11-01T00:00:00Z',
  uploadedBy: { name: 'Asha', role: 'OWNER' },
  ocr: { litres: 180, amount: 4500, printedDate: '2026-11-01' },
  link: {
    registrationNumber: 'A',
    by: { name: 'Ravi', role: 'MANAGER' },
    at: '2026-11-01T00:00:00Z',
    via: 'UPLOAD',
  },
};

describe('the office bill queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: { code: 'NO_PRINTED_TIME', text: 'the time could not be read', basis: '' },
      photo: { date: '2026-11-01', time: '12:01', timeSource: 'stamp' },
    });
  });

  it('names both queues and links between them', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({ captures: [], total: 0 });
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Owner & manager bill photos')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Driver expense bills' });
    expect(link).toHaveAttribute('href', '/erp/bill-approvals');
  });

  it('keeps the bills it already has when a load fails and offers a retry', async () => {
    let fail = false;
    billPhotoService.listBillCaptures.mockImplementation(() =>
      fail
        ? Promise.reject(new Error('offline'))
        : Promise.resolve({ captures: [CAPTURE], total: 1 }),
    );
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('180 L')).toBeInTheDocument();
    fail = true;
    fireEvent.click(screen.getByRole('tab', { name: /Confirmed/ }));
    expect(await screen.findByText('Could not load bills. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
    expect(screen.queryByText('Nothing waiting for approval')).not.toBeInTheDocument();
    // The rows already on screen stay on screen.
    expect(screen.getByText('1 Nov 2026')).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    await waitFor(() =>
      expect(screen.queryByText('Could not load bills. Try again.')).not.toBeInTheDocument(),
    );
  });

  it('does not show an empty queue when the load failed', async () => {
    billPhotoService.listBillCaptures.mockRejectedValue(new Error('offline'));
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Could not load bills. Try again.')).toBeInTheDocument();
    expect(screen.queryByText('Nothing waiting for approval')).not.toBeInTheDocument();
  });
});

const UNCONFIRMED_CAPTURE = {
  id: 'cap-2',
  createdAt: '2026-11-01T00:00:00Z',
  uploadedBy: { name: 'Asha', role: 'OWNER' },
  ocr: { litres: 180, amount: 4500, printedDate: '2026-11-01' },
};

describe('the office bill queue markup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:bill-photo');
    URL.revokeObjectURL = vi.fn();
    billPhotoService.getBillPage.mockResolvedValue(new Blob(['photo']));
    billPhotoService.getBillSuggestion.mockResolvedValue({
      decision: 'ASK',
      askReason: 'NO_PLATE_DIGITS',
      candidates: [],
      why: { code: 'NO_PRINTED_TIME', text: 'the time could not be read', basis: '' },
      photo: { date: '2026-11-01', time: '12:01', timeSource: 'stamp' },
    });
  });

  it('asks the server for office captures and shows the shared columns', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({ captures: [CAPTURE], total: 1 });
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('180 L')).toBeInTheDocument();
    expect(billPhotoService.listBillCaptures).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        uploaderRole: 'OWNER,MANAGER',
        source: 'office',
        page: 1,
        limit: 50,
      }),
    );
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent.trim());
    expect(headers).toEqual([
      'Photo',
      'Truck',
      'Uploaded by',
      'Pump',
      'Litres',
      'Amount',
      'Rate',
      'Bill date/time',
      'Match status',
      'Actions',
    ]);
  });

  it('says plainly when there is nothing waiting and nothing confirmed', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({ captures: [], total: 0 });
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('No bills waiting.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Confirmed/ }));
    expect(await screen.findByText('No confirmed bills.')).toBeInTheDocument();
  });

  it('says when the office bills cannot be reached and offers a retry', async () => {
    billPhotoService.listBillCaptures.mockRejectedValue({ response: { status: 404 } });
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Office bills are unavailable right now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
  });

  it('opens the bill drawer when a bill is reviewed', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({
      captures: [UNCONFIRMED_CAPTURE],
      total: 1,
    });
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }));
    expect(
      await screen.findByText('We could not suggest a truck for this bill — pick one below.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/ })).toBeInTheDocument();
  });
});

describe('rejecting an office bill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billPhotoService.getBillSuggestion.mockResolvedValue({ decision: 'ASK', candidates: [] });
  });

  it('rejects a pending bill with a reason and reads the counts of every tab', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({
      captures: [UNCONFIRMED_CAPTURE],
      total: 1,
      counts: { pending: 1, submitted: 4, rejected: 2 },
    });
    billPhotoService.rejectBillCaptures.mockResolvedValue({
      rejected: 1,
      results: [{ id: 'cap-2', status: 'rejected' }],
    });
    const onCount = vi.fn();
    render(
      <MemoryRouter>
        <OfficeBillApprovals onCount={onCount} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('tab', { name: /Rejected 2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Confirmed 4/ })).toBeInTheDocument();
    expect(onCount).toHaveBeenCalledWith(1);
    // One read answers the list and every count.
    expect(billPhotoService.listBillCaptures).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Reject/ }));
    const dialog = screen.getByRole('dialog', { name: 'Reject 1 bill' });
    fireEvent.change(within(dialog).getByLabelText('Reason for rejecting'), {
      target: { value: '  Blurry photo ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() =>
      expect(billPhotoService.rejectBillCaptures).toHaveBeenCalledWith(['cap-2'], 'Blurry photo'),
    );
    await waitFor(() => expect(billPhotoService.listBillCaptures).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog', { name: 'Reject 1 bill' })).not.toBeInTheDocument();
  });

  it('lists rejected bills with who rejected them and no reject button', async () => {
    billPhotoService.listBillCaptures.mockImplementation(({ status }) =>
      Promise.resolve(
        status === 'rejected'
          ? {
              captures: [
                {
                  ...UNCONFIRMED_CAPTURE,
                  rejection: {
                    by: 'u1',
                    byName: 'Ravi',
                    byRole: 'MANAGER',
                    at: '2026-11-20T06:00:00Z',
                    reason: 'Not our truck',
                  },
                },
              ],
              total: 1,
              counts: { pending: 0, submitted: 0, rejected: 1 },
            }
          : { captures: [], total: 0, counts: { pending: 0, submitted: 0, rejected: 1 } },
      ),
    );
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('tab', { name: /Rejected/ }));
    expect(await screen.findByText('Rejected by Ravi · Manager')).toBeInTheDocument();
    expect(screen.getByText('Not our truck')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Reject/ })).not.toBeInTheDocument();
  });

  it('says when the truck list could not be loaded and offers a retry', async () => {
    billPhotoService.listBillCaptures.mockResolvedValue({ captures: [], total: 0 });
    MileageApi.vehicles.mockRejectedValue(new Error('no trucks'));
    render(
      <MemoryRouter>
        <OfficeBillApprovals />
      </MemoryRouter>,
    );
    // An empty truck picker must never look like an empty fleet.
    await waitFor(() =>
      expect(screen.getByText(/truck list could not be loaded/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /retry trucks/i }));
    await waitFor(() => expect(MileageApi.vehicles).toHaveBeenCalledTimes(2));
  });
});
