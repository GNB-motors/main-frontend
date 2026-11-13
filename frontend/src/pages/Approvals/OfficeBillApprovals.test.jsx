import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalsPage from './ApprovalsPage';
import OfficeBillApprovals from './OfficeBillApprovals';
import billPhotoService from '../../services/billPhotoService';
import { ConfirmedBillRow } from './OfficeBillDetails';
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
  },
}));
describe('office approvals', () => {
  beforeEach(() => vi.clearAllMocks());
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
      fail ? Promise.reject(new Error('offline')) : Promise.resolve({ captures: [CAPTURE], total: 1 }),
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


