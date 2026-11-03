import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('links to vehicle alerts and opens the exact support ticket', async () => {
    mount();
    expect(await screen.findByRole('link', { name: 'Review alert' })).toHaveAttribute(
      'href',
      '/owner-alerts?vehicle=MH12AB1234',
    );
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
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('18 litres lost')).toBeInTheDocument();
  });
  it('acknowledges a row without claiming source resolution', async () => {
    mount();
    await screen.findByText('Fuel loss');
    fireEvent.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);
    await waitFor(() => expect(screen.queryByText('Fuel loss')).not.toBeInTheDocument());
    expect(acknowledgeItem).toHaveBeenCalledWith('fuel');
    fireEvent.click(screen.getByRole('button', { name: /Acknowledged/ }));
    expect(screen.getByText('Fuel loss')).toBeInTheDocument();
    expect(screen.getByText(/does not resolve the source issue/)).toBeInTheDocument();
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
    fireEvent.click(screen.getAllByRole('button', { name: 'Acknowledge' })[0]);
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
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge all' }));
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
          report: { note: 'Engine stopped on the highway.', receivedAt: '2026-11-04T09:30:00.000Z' },
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
