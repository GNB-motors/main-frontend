import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AssignmentsTab from './AssignmentsTab';
import KhataLedgerService from '../KhataLedgerService';

vi.mock('../KhataLedgerService', () => ({
  default: {
    getAssignmentPage: vi.fn(),
    deleteAssignment: vi.fn(),
    endAssignment: vi.fn(),
  },
}));
vi.mock('./AssignmentFormModal', () => ({ default: () => null }));

const row = (n) => ({
  _id: `a${n}`,
  status: 'ACTIVE',
  startDate: '2026-01-01',
  driverId: { _id: `d${n}`, firstName: 'Driver', lastName: String(n) },
  vehicleId: { _id: `v${n}`, registrationNumber: `WBTEST${n}` },
});

describe('AssignmentsTab backend pagination', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requests the next backend page and resets to page one for a search', async () => {
    KhataLedgerService.getAssignmentPage.mockImplementation(async ({ page, search }) => ({
      results: [row(search ? 99 : page === 1 ? 1 : 21)],
      meta: search ? { total: 1, totalPages: 1 } : { total: 41, totalPages: 3 },
    }));
    render(<AssignmentsTab />);
    await screen.findByText('Driver 1');
    expect(screen.getByRole('button', { name: 'Previous assignments page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next assignments page' }));
    await screen.findByText('Driver 21');
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(screen.getByRole('navigation')).toHaveTextContent('Page 2 of 3');
    expect(KhataLedgerService.getAssignmentPage).toHaveBeenLastCalledWith(
      { page: 2, limit: 20, includePast: true },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search driver or vehicle' }), {
      target: { value: 'Driver 99' },
    });
    await screen.findByText('Driver 99');
    expect(KhataLedgerService.getAssignmentPage).toHaveBeenLastCalledWith(
      { page: 1, limit: 20, includePast: true, search: 'Driver 99' },
      expect.anything(),
    );
    expect(screen.getByRole('navigation', { name: 'Assignment pagination' })).toHaveTextContent(
      'Page 1 of 1 (1 assignments)',
    );
    expect(screen.getByRole('button', { name: 'Next assignments page' })).toBeDisabled();
  });

  it('returns to the last valid page after its only row is deleted', async () => {
    let deleted = false;
    KhataLedgerService.deleteAssignment.mockImplementation(async () => {
      deleted = true;
    });
    KhataLedgerService.getAssignmentPage.mockImplementation(async ({ page }) => ({
      results: page === 1 ? [row(1)] : deleted ? [] : [row(21)],
      meta: { total: deleted ? 20 : 21, totalPages: deleted ? 1 : 2 },
    }));
    render(<AssignmentsTab />);
    await screen.findByText('Driver 1');
    fireEvent.click(screen.getByRole('button', { name: 'Next assignments page' }));
    await screen.findByText('Driver 21');
    fireEvent.click(screen.getByTitle('Delete'));
    const dialog = screen.getByRole('heading', { name: 'Delete Assignment' }).parentElement;
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete', exact: true }));
    await waitFor(() =>
      expect(screen.getByRole('navigation')).toHaveTextContent('Page 1 of 1 (20 assignments)'),
    );
    expect(KhataLedgerService.deleteAssignment).toHaveBeenCalledWith('a21');
    expect(screen.getByText('Driver 1')).toBeInTheDocument();
  });

  it('aborts the page request when unmounted', () => {
    KhataLedgerService.getAssignmentPage.mockImplementation(() => new Promise(() => {}));
    const view = render(<AssignmentsTab />);
    const signal = KhataLedgerService.getAssignmentPage.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
});
