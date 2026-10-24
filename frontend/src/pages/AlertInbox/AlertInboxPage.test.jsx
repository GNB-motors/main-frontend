import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlertInboxPage from './AlertInboxPage';
import { getInbox, acknowledgeItem } from '../../services/AlertInboxService';
import SupportPortalContext from '../../contexts/supportPortalContext';

vi.mock('../../services/AlertInboxService', () => ({
  getInbox: vi.fn(),
  acknowledgeItem: vi.fn(),
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
});
