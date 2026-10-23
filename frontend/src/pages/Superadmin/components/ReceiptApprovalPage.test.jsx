import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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
const pagedOf = (items, meta = {}) => ({
  data: {
    data: { items, total: items.length, page: 1, limit: 50, totalPages: 1, summary: null, ...meta },
  },
});
const listParams = () =>
  apiClient.get.mock.calls
    .filter(([url]) => url === '/api/whatsapp/admin/drafts')
    .map(([, config]) => config.params);
const serveList = (respond) =>
  apiClient.get.mockImplementation((url, config = {}) =>
    url === '/api/whatsapp/admin/drafts'
      ? Promise.resolve(respond(config.params))
      : Promise.resolve({ data: { data: {} } }),
  );
const renderPage = () =>
  render(
    <MemoryRouter>
      <ReceiptApprovalPage />
    </MemoryRouter>,
  );

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
            releasePending = () => resolve(pagedOf([draft('a', 'WB01AA1111', 'READY')]));
          });
        }
        return Promise.resolve(pagedOf([draft('b', 'WB02BB2222', 'PUBLISHED')]));
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

  // B4: the inbox used to fetch 200 rows and filter them in the browser, so
  // receipts after the 200th never appeared. The server now filters and pages.
  it('asks the server for one filtered page', async () => {
    serveList(() => pagedOf([draft('a', 'WB01AA1111', 'READY')]));
    renderPage();
    expect(await screen.findByText('WB01AA1111')).toBeInTheDocument();
    expect(listParams()[0]).toEqual({ status: 'READY', page: 1, limit: 50, order: 'desc' });

    fireEvent.change(
      screen.getByLabelText('Search receipts by vehicle, driver, station, or plate'),
      { target: { value: 'WB01' } },
    );
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ q: 'WB01', page: 1 }));

    fireEvent.change(screen.getByLabelText('Filter receipts by odometer source'), {
      target: { value: 'MISSING' },
    });
    await waitFor(() =>
      expect(listParams().at(-1)).toMatchObject({ q: 'WB01', odometer: 'MISSING' }),
    );
  });

  it('pages past the first 50 and starts over at page 1 when a filter changes', async () => {
    serveList((params) =>
      pagedOf([draft(`p${params.page}`, `WB0${params.page}PG0000`, 'READY')], {
        total: 230,
        page: params.page,
        totalPages: 5,
      }),
    );
    renderPage();
    expect(await screen.findByText('WB01PG0000')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Next Page'));
    expect(await screen.findByText('WB02PG0000')).toBeInTheDocument();
    expect(listParams().at(-1)).toMatchObject({ page: 2 });

    fireEvent.change(screen.getByLabelText('Filter receipts by odometer source'), {
      target: { value: 'PHOTO' },
    });
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ page: 1, odometer: 'PHOTO' }));
  });

  it('shows KPIs for the whole tab, not just the page', async () => {
    serveList(() =>
      pagedOf([draft('a', 'WB01AA1111', 'READY')], {
        total: 230,
        totalPages: 5,
        summary: {
          totalCount: 230,
          totalLitres: 23000,
          totalAmount: 2070000,
          pendingCount: 230,
          pendingAmount: 2070000,
          missingOdoCount: 4,
          rateAnomaliesCount: 1,
        },
      }),
    );
    renderPage();
    expect(await screen.findByText('230 Pending')).toBeInTheDocument();
  });

  // Until the paging backend is deployed, an older one answers with its first
  // 200 drafts and no totalPages; the page then filters them itself, as before.
  it('falls back to filtering in the browser against an older backend', async () => {
    serveList(() =>
      draftsOf([
        { ...draft('a', 'WB01AA1111', 'READY'), odometerReading: null },
        { ...draft('b', 'WB02BB2222', 'READY'), odometerReading: 51000 },
      ]),
    );
    renderPage();
    // The first answer has no totalPages, so the page re-asks for the whole window.
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ limit: 200 }));
    await waitFor(() => expect(screen.getByText('WB02BB2222')).toBeInTheDocument());
    const requests = listParams().length;

    fireEvent.change(screen.getByLabelText('Filter receipts by odometer source'), {
      target: { value: 'MISSING' },
    });
    await waitFor(() => {
      expect(screen.queryByText('WB02BB2222')).not.toBeInTheDocument();
      expect(screen.getByText('WB01AA1111')).toBeInTheDocument();
    });
    // The old backend ignores filters, so changing one asks it nothing.
    expect(listParams()).toHaveLength(requests);
    expect(screen.queryByTitle('Next Page')).not.toBeInTheDocument();
  });
});
