import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import apiClient from '../../../../utils/axiosConfig';
import { OrgUsersService } from './OrgUsersService';
import OrgUsersSection from './OrgUsersSection';

vi.mock('./OrgUsersService', () => ({
  OrgUsersService: { listOrgUsers: vi.fn(), resetUserPassword: vi.fn() },
}));

// The real service talks to the HTTP client; the client itself is the mock.
vi.mock('../../../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

// The viewer is the superadmin; the tests can make it unknown.
const { viewerState } = vi.hoisted(() => ({ viewerState: { id: 'u2' } }));

vi.mock('../../../../utils/session.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserId: () => viewerState.id,
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

  it('D8: another organisation clears the rows at once, shows the loading state and starts at page 1', async () => {
    OrgUsersService.listOrgUsers.mockResolvedValue({
      rows: [OWNER],
      meta: { page: 3, limit: 50, total: 120, pages: 3 },
    });

    const { rerender } = render(<OrgUsersSection orgId="org-a" />);
    await screen.findByText('Asha Rao');

    // The new organisation is still loading: the old rows are already gone.
    let resolveSecond;
    OrgUsersService.listOrgUsers.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSecond = () =>
            resolve({
              rows: [{ id: 'b1', firstName: 'New', lastName: 'Org', role: 'OWNER' }],
              meta: { page: 1, limit: 50, total: 1, pages: 1 },
            });
        }),
    );
    rerender(<OrgUsersSection orgId="org-b" />);

    await waitFor(() => expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument());
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    resolveSecond();
    expect(await screen.findByText('New Org')).toBeInTheDocument();
    expect(OrgUsersService.listOrgUsers).toHaveBeenLastCalledWith(
      'org-b',
      expect.objectContaining({ page: 1 }),
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('D8: the newer page wins over an older page of the same organisation', async () => {
    const resolvers = [];
    let call = 0;
    OrgUsersService.listOrgUsers.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          rows: [{ id: 'p1', firstName: 'Page', lastName: 'One', role: 'OWNER' }],
          meta: { page: 1, limit: 50, total: 3, pages: 3 },
        });
      }
      return new Promise((resolve) => {
        resolvers.push(resolve);
      });
    });

    render(<OrgUsersSection orgId="org-1" />);
    await screen.findByText('Page One');

    // Two pages are asked for; the second one is still on its way.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(resolvers).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(resolvers).toHaveLength(2));

    // The newest page answers first, the older one only afterwards.
    resolvers[1]({
      rows: [{ id: 'p3', firstName: 'Page', lastName: 'Three', role: 'OWNER' }],
      meta: { page: 3, limit: 50, total: 3, pages: 3 },
    });
    expect(await screen.findByText('Page Three')).toBeInTheDocument();

    resolvers[0]({
      rows: [{ id: 'p2', firstName: 'Page', lastName: 'Two', role: 'OWNER' }],
      meta: { page: 2, limit: 50, total: 3, pages: 3 },
    });
    await waitFor(() => expect(screen.queryByText('Page Two')).not.toBeInTheDocument());
    expect(screen.getByText('Page Three')).toBeInTheDocument();
  });

  it('D8: the search is sent as `search`', async () => {
    render(<OrgUsersSection orgId="org-1" />);
    await screen.findByText('Asha Rao');

    fireEvent.change(screen.getByLabelText(/Search users/i), { target: { value: 'ravi' } });

    await waitFor(
      () =>
        expect(OrgUsersService.listOrgUsers).toHaveBeenLastCalledWith(
          'org-1',
          expect.objectContaining({ search: 'ravi', page: 1 }),
          expect.objectContaining({ signal: expect.anything() }),
        ),
      { timeout: 2000 },
    );
  });

  it('D8: an empty organisation invalidates the request and shows no rows', async () => {
    const { rerender } = render(<OrgUsersSection orgId="org-1" />);
    await screen.findByText('Asha Rao');

    rerender(<OrgUsersSection orgId="" />);

    await waitFor(() => expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Reset password/i })).not.toBeInTheDocument();
  });

  it('review 4: the rows on screen belong to the organisation, not to the last answer', async () => {
    let resolveOld;
    OrgUsersService.listOrgUsers.mockImplementation((orgId) => {
      if (orgId === 'org-a') {
        return new Promise((resolve) => {
          resolveOld = () =>
            resolve({ rows: [OWNER], meta: { page: 1, limit: 50, total: 1, pages: 1 } });
        });
      }
      return new Promise(() => {}); // the new organisation never answers
    });

    const { rerender } = render(<OrgUsersSection orgId="org-a" />);
    resolveOld();
    await screen.findByText('Asha Rao');

    // The reset dialog of the old organisation is open…
    fireEvent.click(screen.getByRole('button', { name: /Reset password for Asha Rao/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // …and another organisation means: no old rows and no old dialog, in the
    // very same render — before the new answer arrives.
    rerender(<OrgUsersSection orgId="org-b" />);
    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('review 4: a late answer of the previous organisation is dropped', async () => {
    let resolveOld;
    OrgUsersService.listOrgUsers.mockImplementation((orgId) => {
      if (orgId === 'org-a') {
        return new Promise((resolve) => {
          resolveOld = () =>
            resolve({
              rows: [{ id: 'a1', firstName: 'Old', lastName: 'Org', role: 'OWNER' }],
              meta: { page: 1, limit: 50, total: 1, pages: 1 },
            });
        });
      }
      return new Promise(() => {}); // the new organisation never answers
    });

    const { rerender } = render(<OrgUsersSection orgId="org-a" />);
    rerender(<OrgUsersSection orgId="org-b" />);

    resolveOld();
    await waitFor(() => expect(screen.queryByText('Old Org')).not.toBeInTheDocument());
    expect(screen.queryByText('Old Org')).not.toBeInTheDocument();
  });

  it('review 4: an unknown viewer gets no reset button at all', async () => {
    viewerState.id = null;
    try {
      render(<OrgUsersSection orgId="org-1" />);
      await screen.findByText('Asha Rao');

      expect(screen.queryByRole('button', { name: /Reset password for/i })).not.toBeInTheDocument();
    } finally {
      viewerState.id = 'u2';
    }
  });
});

describe('OrgUsersService (real service, mocked HTTP client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the rows from data and the meta from its sibling', async () => {
    const { OrgUsersService: RealService } = await vi.importActual('./OrgUsersService');
    apiClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: [OWNER, DRIVER],
        meta: { page: 1, limit: 50, total: 2, pages: 1 },
      },
    });

    const result = await RealService.listOrgUsers('org-1', { search: 'ravi' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/organizations/org-1/users', {
      params: { page: 1, limit: 50, search: 'ravi' },
      signal: undefined,
    });
    expect(result.rows).toEqual([OWNER, DRIVER]);
    expect(result.meta).toEqual({ page: 1, limit: 50, total: 2, pages: 1 });
  });

  it('never sends `q` and answers empty rows when data is not an array', async () => {
    const { OrgUsersService: RealService } = await vi.importActual('./OrgUsersService');
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: null } });

    const result = await RealService.listOrgUsers('org-1');

    expect(apiClient.get.mock.calls[0][1].params.q).toBeUndefined();
    expect(result.rows).toEqual([]);
  });
});
