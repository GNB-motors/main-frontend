import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BillApprovalsPage from './BillApprovalsPage';
import BillApprovalsService from './BillApprovalsService';

vi.mock('./BillApprovalsService', () => ({
  default: { list: vi.fn(), confirm: vi.fn(), reject: vi.fn() },
}));

const page = (results = []) => ({
  results,
  total: results.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <BillApprovalsPage />
    </MemoryRouter>,
  );

describe('driver expense bills', () => {
  beforeEach(() => vi.clearAllMocks());

  it('names the queue and points at the office queue', async () => {
    BillApprovalsService.list.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('Driver expense bills')).toBeInTheDocument();
    expect(screen.getByText('Bills submitted by drivers from the app.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Owner & manager bill photos' });
    expect(link).toHaveAttribute('href', '/approvals?type=office');
  });

  it('says plainly when no driver bills are waiting', async () => {
    BillApprovalsService.list.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('No driver expense bills waiting.')).toBeInTheDocument();
  });

  it('keeps the message and offers a retry when the bills cannot be loaded', async () => {
    BillApprovalsService.list
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(page([]));
    renderPage();
    expect(
      await screen.findByText('Could not load driver bills. Try again.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    await waitFor(() => expect(BillApprovalsService.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No driver expense bills waiting.')).toBeInTheDocument();
  });

  it('shows a dash, not ₹0, when the amount is missing', async () => {
    BillApprovalsService.list.mockResolvedValue(
      page([{ _id: 'b1', title: 'Fuel', status: 'PENDING', driver: { name: 'Ravi' } }]),
    );
    renderPage();
    expect(await screen.findByText('Ravi')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('₹0')).not.toBeInTheDocument();
  });
});
