import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OrgUsersService } from './OrgUsersService';
import OrgUsersSection from './OrgUsersSection';

vi.mock('./OrgUsersService', () => ({
  OrgUsersService: { listOrgUsers: vi.fn(), resetUserPassword: vi.fn() },
}));

vi.mock('../../../../utils/session.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserId: () => 'u2',
}));

const OWNER = {
  id: 'u1',
  firstName: 'Asha',
  lastName: 'Rao',
  role: 'OWNER',
  email: 'asha@gnb.com',
  mobileNumber: '9999999999',
  status: 'ACTIVE',
};
const DRIVER = {
  id: 'u2',
  firstName: 'Ravi',
  lastName: 'Kumar',
  role: 'DRIVER',
  email: '',
  mobileNumber: '9888888888',
  status: 'ACTIVE',
};

describe('OrgUsersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    OrgUsersService.listOrgUsers.mockResolvedValue({
      rows: [OWNER, DRIVER],
      meta: { page: 1, limit: 50, total: 2, pages: 1 },
    });
  });

  it('spec 6: lists the accounts of the organisation, owner first', async () => {
    render(<OrgUsersSection orgId="org-1" />);

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    const firstRow = screen.getAllByRole('row')[1];
    expect(firstRow).toHaveTextContent('Asha Rao');
    expect(OrgUsersService.listOrgUsers).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ page: 1 }),
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('D10: the pager counts the pages the new endpoint reports', async () => {
    OrgUsersService.listOrgUsers.mockResolvedValue({
      rows: [OWNER],
      meta: { page: 1, limit: 50, total: 120, pages: 3 },
    });

    render(<OrgUsersSection orgId="org-1" />);

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('goal: Reset password opens the dialog and sends the body to the service', async () => {
    OrgUsersService.resetUserPassword.mockResolvedValue({ mode: 'set', signedOut: true });
    render(<OrgUsersSection orgId="org-1" />);

    await screen.findByText('Asha Rao');
    fireEvent.click(screen.getByRole('button', { name: /Reset password for Asha Rao/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: /Change password/i }));

    await waitFor(() =>
      expect(OrgUsersService.resetUserPassword).toHaveBeenCalledWith('u1', {
        mode: 'set',
        password: 'longenough1',
        signOut: true,
      }),
    );
  });

  it('D5: the viewer own row has no reset button', async () => {
    render(<OrgUsersSection orgId="org-1" />);

    await screen.findByText('Asha Rao');
    expect(
      screen.getByRole('button', { name: /Reset password for Asha Rao/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Reset password for Ravi Kumar/i }),
    ).not.toBeInTheDocument();
  });

  it('D8: a stale answer never overwrites the newer organisation', async () => {
    let resolveFirst;
    OrgUsersService.listOrgUsers.mockImplementation((orgId) => {
      if (orgId === 'org-a') {
        return new Promise((resolve) => {
          resolveFirst = () =>
            resolve({
              rows: [{ id: 'a1', firstName: 'Old', lastName: 'Org', role: 'OWNER' }],
              meta: { page: 1, limit: 50, total: 1, pages: 1 },
            });
        });
      }
      return Promise.resolve({
        rows: [{ id: 'b1', firstName: 'New', lastName: 'Org', role: 'OWNER' }],
        meta: { page: 1, limit: 50, total: 1, pages: 1 },
      });
    });

    const { rerender } = render(<OrgUsersSection orgId="org-a" />);
    rerender(<OrgUsersSection orgId="org-b" />);

    expect(await screen.findByText('New Org')).toBeInTheDocument();
    resolveFirst();
    await waitFor(() => expect(screen.queryByText('Old Org')).not.toBeInTheDocument());
    expect(screen.getByText('New Org')).toBeInTheDocument();
  });

  it('D8: a cancelled request shows no error', async () => {
    OrgUsersService.listOrgUsers.mockRejectedValue({ code: 'ERR_CANCELED', message: 'canceled' });

    render(<OrgUsersSection orgId="org-1" />);

    await waitFor(() => expect(OrgUsersService.listOrgUsers).toHaveBeenCalled());
    expect(screen.queryByText('canceled')).not.toBeInTheDocument();
    expect(screen.queryByText(/Could not load users/i)).not.toBeInTheDocument();
  });
});
