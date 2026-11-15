import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import ReceiptApprovalPage from '../ReceiptApprovalPage';

vi.mock('../../../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ organization: null, refresh: () => {} }),
}));
vi.mock('../../../../utils/session', () => ({ getUserRole: () => 'OWNER' }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const row = {
  _id: 'r1',
  status: 'READY',
  source: 'CHAT_IMPORT',
  vehicleReg: 'WB25R9540',
  litres: 120,
  rate: 89.5,
  amount: 10740,
  createdAt: '2026-11-10T10:00:00Z',
};

const pagedOf = (items) => ({
  data: {
    data: { items, total: items.length, page: 1, limit: 50, totalPages: 1, summary: null },
  },
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReceiptApprovalPage />
    </MemoryRouter>,
  );

const listCalls = () =>
  apiClient.get.mock.calls.filter(([url]) => url === '/api/whatsapp/admin/drafts');

describe('The receipt inbox — a failure is never an empty inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('says the receipts did not load and offers a retry, never "No receipts found"', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/whatsapp/admin/drafts') {
        return Promise.reject({
          response: { status: 500, data: { message: 'The server is having a bad day.' } },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderPage();

    expect(await screen.findByText("Couldn't load")).toBeInTheDocument();
    expect(screen.queryByText('No receipts found')).not.toBeInTheDocument();
    expect(screen.queryByText('All caught up! No fuel bills waiting for review.')).not.toBeInTheDocument();
    expect(screen.queryByText('No receipts yet')).not.toBeInTheDocument();
    // The words of the failure, once, and a way to try again.
    expect(
      screen.getByText('We could not load the receipts: The server is having a bad day.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('loads the receipts when the retry is pressed', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/whatsapp/admin/drafts') {
        if (listCalls().length === 1) {
          return Promise.reject({ response: { status: 500, data: { message: 'Oops' } } });
        }
        return Promise.resolve(pagedOf([row]));
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderPage();
    await screen.findByText("Couldn't load");

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('WB25R9540')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load")).not.toBeInTheDocument();
  });

  it('shows a refused approve next to its row, and never says it was approved', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/whatsapp/admin/drafts') return Promise.resolve(pagedOf([row]));
      return Promise.resolve({ data: { data: {} } });
    });
    apiClient.post.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'The time on this photo is only predicted — accept it or type the real time.',
        },
      },
    });

    renderPage();
    await screen.findByText('WB25R9540');

    fireEvent.click(screen.getByTitle('Quick Approve to Fuel Ledger'));

    expect(
      await screen.findByText(
        'The time on this photo is only predicted — accept it or type the real time.',
      ),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not say it was approved when the server answers 200 with a refusal', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/whatsapp/admin/drafts') return Promise.resolve(pagedOf([row]));
      return Promise.resolve({ data: { data: {} } });
    });
    apiClient.post.mockResolvedValue({
      data: { data: { success: false, message: 'Pick the truck before approving.' } },
    });

    renderPage();
    await screen.findByText('WB25R9540');

    fireEvent.click(screen.getByTitle('Quick Approve to Fuel Ledger'));

    expect(await screen.findByText('Pick the truck before approving.')).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows a chat-import row in the list, with its chips', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/whatsapp/admin/drafts') return Promise.resolve(pagedOf([row]));
      return Promise.resolve({ data: { data: {} } });
    });

    renderPage();

    expect(await screen.findByText('From chat')).toBeInTheDocument();
    expect(screen.getByText('WB25R9540')).toBeInTheDocument();
    await waitFor(() => expect(listCalls()).toHaveLength(1));
  });
});
