import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalsPage from './ApprovalsPage';
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


