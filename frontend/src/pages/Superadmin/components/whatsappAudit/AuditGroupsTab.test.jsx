import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import AuditGroupsTab, { FIRST_MAP_CONFIRM, REMAP_CONFIRM } from './AuditGroupsTab';

const { WhatsAppAuditService } = vi.hoisted(() => ({
  WhatsAppAuditService: {
    getGroups: vi.fn(),
    getOrganizations: vi.fn(),
    updateGroupOrg: vi.fn(),
  },
}));

vi.mock('../WhatsAppAuditService', () => ({ WhatsAppAuditService }));

const organizations = [
  { _id: 'org-1', companyName: 'Alpha Logistics' },
  { _id: 'org-2', companyName: 'Beta Motors' },
];

const unmappedGroup = {
  _id: 'g-unmapped',
  jid: '123@g.us',
  name: 'Fleet Ops',
  participantCount: 12,
  orgId: null,
  orgName: null,
  active: true,
  joinedAt: '2026-02-01T10:00:00.000Z',
  lastMessageAt: '2026-03-01T09:00:00.000Z',
  counts: { messages: 40, photos: 3, fills: 2, unknownTruck: 1 },
};

const mappedGroup = {
  _id: 'g-mapped',
  jid: '456@g.us',
  name: 'Alpha Drivers',
  participantCount: 30,
  orgId: 'org-1',
  orgName: 'Alpha Logistics',
  active: false,
  joinedAt: '2026-01-05T10:00:00.000Z',
  lastMessageAt: null,
  counts: { messages: 0, photos: null, fills: null, unknownTruck: null },
};

describe('WhatsApp groups tab (spec 1)', () => {
  let confirmSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    WhatsAppAuditService.getGroups.mockResolvedValue([mappedGroup, unmappedGroup]);
    WhatsAppAuditService.getOrganizations.mockResolvedValue(organizations);
    WhatsAppAuditService.updateGroupOrg.mockResolvedValue({ _id: 'g-unmapped' });
  });

  afterEach(() => {
    cleanup();
    confirmSpy.mockRestore();
  });

  it('lists the unmapped group first and says what it means', async () => {
    render(<AuditGroupsTab />);
    await screen.findByLabelText('Organisation for Fleet Ops');

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Fleet Ops');
    expect(rows[1]).toHaveTextContent(
      'Not mapped: messages are stored but not processed',
    );
    expect(rows[2]).toHaveTextContent('Alpha Drivers');
    expect(screen.queryByText('Not mapped: messages are stored but not processed')).toBeInTheDocument();
  });

  it('keeps an unknown counter unknown instead of showing 0', async () => {
    render(<AuditGroupsTab />);
    await screen.findByLabelText('Organisation for Alpha Drivers');
    const rows = screen.getAllByRole('row');
    const cells = within(rows[2]).getAllByRole('cell');
    // photos / fills / unknown truck are null on this group.
    expect(cells[7]).toHaveTextContent('—');
    expect(cells[8]).toHaveTextContent('—');
    expect(cells[9]).toHaveTextContent('—');
    // a real zero is still a zero.
    expect(cells[6]).toHaveTextContent('0');
  });

  it('maps an unmapped group after the confirmation and PATCHes it', async () => {
    render(<AuditGroupsTab />);
    const select = await screen.findByLabelText('Organisation for Fleet Ops');

    fireEvent.change(select, { target: { value: 'org-2' } });

    await waitFor(() =>
      expect(WhatsAppAuditService.updateGroupOrg).toHaveBeenCalledWith('g-unmapped', 'org-2'),
    );
    expect(confirmSpy).toHaveBeenCalledWith(FIRST_MAP_CONFIRM);
    expect(FIRST_MAP_CONFIRM).toBe('Stored messages will be processed now.');
    await waitFor(() => expect(select.value).toBe('org-2'));
  });

  it('warns before a mapped group is moved to another organization', async () => {
    render(<AuditGroupsTab />);
    const select = await screen.findByLabelText('Organisation for Alpha Drivers');

    fireEvent.change(select, { target: { value: 'org-2' } });

    await waitFor(() =>
      expect(WhatsAppAuditService.updateGroupOrg).toHaveBeenCalledWith('g-mapped', 'org-2'),
    );
    expect(confirmSpy).toHaveBeenCalledWith(REMAP_CONFIRM);
    expect(REMAP_CONFIRM).toBe(
      'Only new messages go to the new org. Messages already processed stay with the old org.',
    );
  });

  it('changes nothing when the confirmation is refused', async () => {
    confirmSpy.mockReturnValue(false);
    render(<AuditGroupsTab />);
    const select = await screen.findByLabelText('Organisation for Fleet Ops');

    fireEvent.change(select, { target: { value: 'org-2' } });

    await waitFor(() => expect(select.value).toBe(''));
    expect(WhatsAppAuditService.updateGroupOrg).not.toHaveBeenCalled();
  });

  it('rolls the row back and shows an error toast when the PATCH fails', async () => {
    WhatsAppAuditService.updateGroupOrg.mockRejectedValue(new Error('mapping refused'));
    render(<AuditGroupsTab />);
    const select = await screen.findByLabelText('Organisation for Fleet Ops');

    fireEvent.change(select, { target: { value: 'org-2' } });

    await waitFor(() => expect(select.value).toBe(''));
    expect(await screen.findByText('mapping refused')).toBeInTheDocument();
  });

  it('maps one group at a time', async () => {
    let release;
    WhatsAppAuditService.updateGroupOrg.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    render(<AuditGroupsTab />);
    const select = await screen.findByLabelText('Organisation for Fleet Ops');

    fireEvent.change(select, { target: { value: 'org-2' } });
    await waitFor(() => expect(select).toBeDisabled());

    fireEvent.change(select, { target: { value: 'org-1' } });
    expect(WhatsAppAuditService.updateGroupOrg).toHaveBeenCalledTimes(1);

    release({ _id: 'g-unmapped' });
    await waitFor(() => expect(select).not.toBeDisabled());
  });
});
