import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../../utils/axiosConfig';
import ReceiptApprovalPage from './ReceiptApprovalPage';

vi.mock('../../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ organization: null, refresh: () => {} }),
}));
vi.mock('../../../utils/session', () => ({ getUserRole: () => 'OWNER' }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const draft = (id, vehicleReg, status) => ({
  _id: id,
  vehicleReg,
  status,
  litres: 100,
  rate: 90,
  amount: 9000,
  createdAt: '2026-10-08T10:00:00Z',
});
const draftsOf = (items) => ({ data: { data: { items } } });

describe('ReceiptApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Switching tabs quickly used to let the slower, older response win.
  it('ignores a stale response from the tab the user already left', async () => {
    let releasePending;
    apiClient.get.mockImplementation((url, config = {}) => {
      if (url === '/api/whatsapp/admin/drafts') {
        if (config.params?.status === 'READY') {
          return new Promise((resolve) => {
            releasePending = () => resolve(draftsOf([draft('a', 'WB01AA1111', 'READY')]));
          });
        }
        return Promise.resolve(draftsOf([draft('b', 'WB02BB2222', 'PUBLISHED')]));
      }
      return Promise.resolve({ data: { data: {} } });
    });

    render(
      <MemoryRouter>
        <ReceiptApprovalPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Published/ }));
    expect(await screen.findByText('WB02BB2222')).toBeInTheDocument();

    await act(async () => {
      releasePending();
    });

    expect(screen.queryByText('WB01AA1111')).not.toBeInTheDocument();
    expect(screen.getByText('WB02BB2222')).toBeInTheDocument();
  });

  // The odometer policy rides on /api/auth/me; the page no longer re-fetches it.
  it('does not fetch the WhatsApp settings itself', async () => {
    apiClient.get.mockResolvedValue(draftsOf([]));
    render(
      <MemoryRouter>
        <ReceiptApprovalPage />
      </MemoryRouter>,
    );
    await act(async () => {});
    expect(apiClient.get.mock.calls.map(([url]) => url)).not.toContain('/api/whatsapp/settings');
  });
});
