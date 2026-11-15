import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlertInboxPage from './AlertInboxPage';
import {
  getInbox,
  acknowledgeItem,
  acknowledgeAll,
  getIncidents,
  getIncidentSummary,
  acknowledgeIncident,
} from '../../services/AlertInboxService';
import { fleetViewService } from '../../services/fleetViewService';
import SupportPortalContext from '../../contexts/supportPortalContext';

vi.mock('../../services/AlertInboxService', () => ({
  getInbox: vi.fn(),
  acknowledgeItem: vi.fn(),
  acknowledgeAll: vi.fn(),
  getIncidents: vi.fn(),
  getIncidentSummary: vi.fn(),
  acknowledgeIncident: vi.fn(),
  assignIncident: vi.fn(),
  resolveIncident: vi.fn(),
}));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getAccountsLinkState: vi.fn() },
}));
const fuel = {
  id: 'fuel',
  subjectKey: 'MH12AB1234',
  subjectLabel: 'MH12AB1234',
  label: 'Fuel loss',
  wants: 'Investigate this fuel loss.',
  condition: 'FUEL_RISK',
  severity: 'critical',
  status: 'OPEN',
  sources: [{ source: 'ownerAlerts', refId: 'owner1', detail: '18 litres lost' }],
};
const ticket = {
  id: 'ticket',
  subjectKey: 'TICKET:123',
  subjectLabel: '#123',
  label: 'Support waiting',
  wants: 'Reply to support.',
  condition: 'TICKET_REPLY',
  severity: 'caution',
  status: 'OPEN',
  sources: [{ source: 'supportTicket', refId: 'ticket123' }],
};
const openPortal = vi.fn();
function mount() {
  return render(
    <MemoryRouter>
      <SupportPortalContext.Provider value={{ enabled: true, openPortal }}>
        <AlertInboxPage />
      </SupportPortalContext.Provider>
    </MemoryRouter>,
  );
}
it('opens the Digest SOS shortcut on unresolved incidents and sends the same IST day to list and summary', async () => {
  getIncidents.mockResolvedValue({
    items: [
      { _id: 'active', status: 'OPEN', type: 'BREAKDOWN', incidentNumber: 'ACTIVE-1' },
      { _id: 'resolved', status: 'RESOLVED', type: 'BREAKDOWN', incidentNumber: 'RESOLVED-1' },
    ],
    pagination: { total: 2 },
  });
  render(
    <MemoryRouter
      initialEntries={[
        '/alert-inbox?inboxView=INCIDENTS&incidentStatus=ACTIVE&from=2026-11-04&to=2026-11-04',
      ]}
    >
      <AlertInboxPage />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(getIncidents).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-11-03T18:30:00.000Z', to: '2026-11-04T18:29:59.999Z' }),
    ),
  );
  expect(getIncidentSummary).toHaveBeenCalledWith(
    expect.objectContaining({ from: '2026-11-03T18:30:00.000Z', to: '2026-11-04T18:29:59.999Z' }),
  );
  expect(screen.queryByText('RESOLVED-1')).not.toBeInTheDocument();
});
beforeEach(() => {
  vi.clearAllMocks();
  getInbox.mockResolvedValue({ items: [fuel, ticket] });
  acknowledgeItem.mockResolvedValue({ ...fuel, status: 'ACKNOWLEDGED' });
  acknowledgeAll.mockResolvedValue({ acknowledged: 2 });
  getIncidents.mockResolvedValue({ items: [], pagination: { total: 0, page: 1, limit: 50 } });
  getIncidentSummary.mockResolvedValue({
    OPEN: 0,
    ACKNOWLEDGED: 0,
    MECHANIC_ASSIGNED: 0,
    RESOLVED: 0,
    total: 0,
    unpaired: 0,
  });
  acknowledgeIncident.mockResolvedValue({ _id: 'inc-1', status: 'ACKNOWLEDGED' });
  // The account endpoint is not on prod yet; the inbox works without it.
  fleetViewService.getAccountsLinkState.mockRejectedValue(
    Object.assign(new Error('Not found'), { status: 404 }),
  );
});
describe('Alert Inbox integration', () => {
  it('keeps alert evidence in the modal and opens the exact support ticket', async () => {
    mount();
    fireEvent.click((await screen.findByText('Fuel loss')).closest('tr'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Review alert' })).not.toBeInTheDocument();
    expect(screen.getByText('18 litres lost')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close alert details' }));
    fireEvent.click(screen.getByText('Support waiting').closest('tr'));
    fireEvent.click(screen.getByRole('button', { name: 'Open ticket' }));
    expect(openPortal).toHaveBeenCalledWith('ticket123');
  });
  it('filters alerts and displays evidence in an accessible dialog', async () => {
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search alerts' }), {
      target: { value: 'MH12' },
    });
    expect(screen.queryByText('#123')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Fuel loss').closest('tr'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('18 litres lost')).toBeInTheDocument();
  });
  it('acknowledges a row without claiming source resolution', async () => {
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as reviewed' })[0]);
    await waitFor(() => expect(screen.queryByText('Fuel loss')).not.toBeInTheDocument());
    expect(acknowledgeItem).toHaveBeenCalledWith('fuel');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reviewed/ }));
    expect(screen.getByText('Fuel loss')).toBeInTheDocument();
    expect(screen.getByText(/does not resolve the source issue/)).toBeInTheDocument();
  });
  it('explains the row action and lets a user mark reviewed after reading the details', async () => {
    mount();
    const subject = await screen.findByRole('button', {
      name: 'View details for MH12AB1234: Fuel loss',
    });
    const row = subject.closest('tr');
    expect(
      within(row).getByRole('button', { name: 'Mark as reviewed' }),
    ).toHaveAccessibleDescription(/Use after checking this alert/);
    fireEvent.click(subject);
    const dialog = await screen.findByRole('dialog');
    const review = within(dialog).getByRole('button', { name: 'Mark as reviewed' });
    expect(review).toHaveAccessibleDescription(/This does not resolve the issue/);
    let finish;
    acknowledgeItem.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(review);
    expect(within(dialog).getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(acknowledgeItem).toHaveBeenCalledTimes(1);
    expect(acknowledgeItem).toHaveBeenCalledWith('fuel');
    finish({ ...fuel, status: 'ACKNOWLEDGED' });
    await waitFor(() => expect(within(dialog).getByText('Reviewed')).toBeInTheDocument());
    expect(
      within(dialog).queryByRole('button', { name: 'Mark as reviewed' }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Fuel loss')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reviewed/ }));
    expect(screen.getByText('Fuel loss')).toBeInTheDocument();
  });
  it('keeps the details action available when marking reviewed fails', async () => {
    acknowledgeItem.mockRejectedValueOnce(new Error('Could not save review'));
    mount();
    fireEvent.click((await screen.findByText('Fuel loss')).closest('tr'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark as reviewed' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Could not save review');
    expect(within(dialog).getByRole('button', { name: 'Mark as reviewed' })).toBeEnabled();
  });
  it('recovers from a failed load on retry', async () => {
    getInbox.mockRejectedValueOnce(new Error('Network unavailable'));
    mount();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Fuel loss');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('retains an alert after acknowledgement fails', async () => {
    acknowledgeItem.mockRejectedValueOnce(new Error('Cannot acknowledge'));
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as reviewed' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot acknowledge');
    expect(screen.getByText('Fuel loss')).toBeInTheDocument();
  });
  it('shows a reconnect banner for a disconnected account', async () => {
    fleetViewService.getAccountsLinkState.mockResolvedValue({
      items: [
        {
          accountId: 'acc-1',
          vendor: 'FLEETEDGE',
          accountName: 'GNB Buxar Fleet',
          state: 'NEEDS_RELINK',
          lastDataAt: null,
          trucks: 4,
          action: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
        },
      ],
    });
    mount();
    expect(await screen.findByText(/account disconnected/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Reconnect' });
    expect(link.getAttribute('href')).toBe('/settings/fleetedge-accounts');
  });
  it('asks before it marks every open alert as seen', async () => {
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.click(screen.getByRole('button', { name: 'Mark all reviewed' }));
    expect(screen.getByText('Mark all 2 open alerts as seen?')).toBeInTheDocument();
    expect(acknowledgeAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, mark all' }));
    await waitFor(() => expect(acknowledgeAll).toHaveBeenCalledTimes(1));
  });
  it('shows the incident board on the incidents view', async () => {
    getIncidents.mockResolvedValue({
      items: [
        {
          _id: 'inc-1',
          incidentNumber: 'INC-42',
          type: 'BREAKDOWN',
          status: 'OPEN',
          truck: { registrationNumber: 'MH12AB1234' },
          driver: { name: 'Ramesh' },
          report: {
            note: 'Engine stopped on the highway.',
            receivedAt: '2026-11-04T09:30:00.000Z',
          },
        },
      ],
      pagination: { total: 1, page: 1, limit: 50 },
    });
    getIncidentSummary.mockResolvedValue({
      OPEN: 1,
      ACKNOWLEDGED: 0,
      MECHANIC_ASSIGNED: 0,
      RESOLVED: 0,
      total: 1,
      unpaired: 0,
    });
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.click(screen.getByRole('button', { name: /Incidents/ }));
    expect(await screen.findByText('INC-42')).toBeInTheDocument();
    expect(screen.getByText('Breakdown')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    await waitFor(() => expect(acknowledgeIncident).toHaveBeenCalledWith('inc-1'));
  });
  it('shows no banner when the account endpoint is not deployed', async () => {
    mount();
    await screen.findByText('Fuel loss');
    expect(screen.queryByText(/account disconnected/)).not.toBeInTheDocument();
    expect(screen.queryByText(/link expires soon/)).not.toBeInTheDocument();
  });
});

it('explains the review flow and how this inbox differs from the other pages', async () => {
  mount();
  await screen.findByText('Fuel loss');
  expect(screen.getByRole('region', { name: 'How to use this page' })).toBeInTheDocument();
  expect(screen.getByText('Read the details')).toBeInTheDocument();
  expect(screen.getByText('Check the reports')).toBeInTheDocument();
  expect(screen.getByText(/It does not fix the issue or confirm a loss/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByText('Alert inbox, Owner alerts and Intelligence: which should I use?'),
  );
  expect(screen.getByRole('link', { name: /Intelligence/ })).toHaveAttribute(
    'href',
    '/intelligence',
  );
  expect(screen.getByText(/Several records may relate to one issue/)).toBeInTheDocument();
});

it('offers a keyboard-accessible subject control without a separate Details button', async () => {
  mount();
  const subject = await screen.findByRole('button', {
    name: 'View details for MH12AB1234: Fuel loss',
  });
  expect(subject.tagName).toBe('BUTTON');
  expect(screen.getByRole('columnheader', { name: 'Issue and next step' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Last reported' })).toBeInTheDocument();
  fireEvent.click(subject);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(acknowledgeItem).not.toHaveBeenCalled();
});

it('shows bill checks and source updates directly in the details instead of opening another feed', async () => {
  getInbox.mockResolvedValueOnce({
    items: [
      {
        ...fuel,
        sources: [
          {
            ...fuel.sources[0],
            billCheck: { verdict: 'INCONCLUSIVE', reason: 'Not enough readings to compare.' },
            resolutionNote: 'Driver confirmation needed.',
          },
        ],
      },
    ],
  });
  mount();
  fireEvent.click((await screen.findByText('Fuel loss')).closest('tr'));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Refuel bill check: Bill can’t tell')).toBeInTheDocument();
  expect(within(dialog).getByText('Not enough readings to compare.')).toBeInTheDocument();
  expect(within(dialog).getByText('Driver confirmation needed.')).toBeInTheDocument();
  expect(within(dialog).queryByRole('link', { name: 'Review alert' })).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Mark as reviewed' })).toBeInTheDocument();
});
