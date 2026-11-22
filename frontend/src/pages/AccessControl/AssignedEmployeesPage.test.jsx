import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssignedEmployeesPage from './AssignedEmployeesPage';
import AccessControlApi from './accessControlService';

vi.mock('./accessControlService', () => ({
  default: {
    listAssignments: vi.fn(),
    listEmployees: vi.fn(),
    revokeAssignment: vi.fn(),
  },
}));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => vi.fn() }));

const assignment = {
  _id: 'a1',
  userId: 'u1',
  scope: 'ENTERPRISE',
  roleId: { name: 'Dispatcher', baseRole: 'MANAGER' },
};

describe('Assigned Employees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // U06 — a failed employee lookup used to look like an empty one.
  it('says the employee lookup failed, keeps the assignments and retries the lookup', async () => {
    AccessControlApi.listAssignments.mockResolvedValue([assignment]);
    AccessControlApi.listEmployees.mockRejectedValue({
      status: 500,
      message: 'Request failed with status code 500',
      response: { data: { message: 'employee service exploded' } },
    });
    render(
      <MemoryRouter>
        <AssignedEmployeesPage />
      </MemoryRouter>,
    );

    // The assignment still renders: one failed lookup never blanks the page.
    expect(await screen.findByText('Dispatcher')).toBeInTheDocument();
    // The failure says so in plain words and offers a retry.
    expect(screen.getByText(/couldn't load the employee names/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    // The identity is unknown — not a made-up name and not an empty list.
    expect(screen.getByText('Name unavailable')).toBeInTheDocument();
    // Server text never reaches the owner.
    expect(screen.queryByText(/employee service exploded/)).not.toBeInTheDocument();

    // The retry asks the server again.
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(AccessControlApi.listEmployees).toHaveBeenCalledTimes(2));
  });
});
