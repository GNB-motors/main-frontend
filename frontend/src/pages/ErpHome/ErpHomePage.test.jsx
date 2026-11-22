import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErpHomePage from './ErpHomePage';
import ErpDashboardService from './ErpDashboardService';

vi.mock('./ErpDashboardService', () => ({
  default: {
    getSummary: vi.fn(),
    getQueue: vi.fn(),
  },
}));

/**
 * The command centre is the first screen an owner sees. A failed read must say
 * so, must not count as zero, and must never be announced as a refresh that
 * worked.
 */

const renderPage = () =>
  render(
    <MemoryRouter>
      <ErpHomePage />
    </MemoryRouter>,
  );

describe('ERP command center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ErpDashboardService.getSummary.mockRejectedValue({
      status: 500,
      message: 'summary request exploded',
    });
    ErpDashboardService.getQueue.mockRejectedValue({
      status: 500,
      message: 'queue request exploded',
    });
  });

  it('does not announce a successful refresh when a request fails', async () => {
    renderPage();

    // Each failed section says so in plain words and offers its own retry.
    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    alerts.forEach((alert) => {
      expect(alert).toHaveTextContent(/server had a problem/i);
      expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Counts nobody loaded are unknown, not zero.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not checked/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Queue is clear')).not.toBeInTheDocument();

    // A refresh that failed must not be announced as a refresh.
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(await screen.findByText(/some sections could not be refreshed/i)).toBeInTheDocument();
    expect(screen.queryByText('Command center refreshed')).not.toBeInTheDocument();
  });
});
