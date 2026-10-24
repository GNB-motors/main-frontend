import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SupportPortal from './SupportPortal';
vi.mock('./SupportRequestsView', () => ({ default: () => <p>Request list</p> }));
vi.mock('./TicketThread', () => ({
  default: ({ ticketId, onBack }) => (
    <div>
      Ticket {ticketId}
      <button onClick={onBack}>Back to requests</button>
    </div>
  ),
}));
vi.mock('./NewRequestDialog', () => ({ default: () => null }));
describe('Support Portal inbox integration', () => {
  it('starts at a requested ticket and supports returning to the list', async () => {
    render(<SupportPortal open onOpenChange={() => {}} initialTicketId="ticket123" />);
    expect(await screen.findByText('Ticket ticket123')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to requests' }));
    expect(screen.getByText('Request list')).toBeInTheDocument();
  });
});
