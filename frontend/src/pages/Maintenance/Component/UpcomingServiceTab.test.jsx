import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpcomingServiceTab from './UpcomingServiceTab.jsx';
import { formatServiceDueDays } from '../serviceIntelligenceLogic.js';
import { FleetDataService } from '../../../services/fleetDataService.js';

vi.mock('../../../services/fleetDataService.js', () => ({
  FleetDataService: {
    getMaintenancePredictions: vi.fn(),
  },
}));

describe('UpcomingServiceTab — formatServiceDueDays integer rounding', () => {
  it('formats float days as rounded integers without decimals', () => {
    expect(formatServiceDueDays(15.54)).toBe('Due in 16 days');
    expect(formatServiceDueDays(15.99)).toBe('Due in 16 days');
    expect(formatServiceDueDays(16.14)).toBe('Due in 16 days');
    expect(formatServiceDueDays(1.0)).toBe('Due in 1 day');
    expect(formatServiceDueDays(0)).toBe('Due today');
    expect(formatServiceDueDays(-1)).toBe('Overdue by 1 day');
    expect(formatServiceDueDays(-3.2)).toBe('Overdue by 3 days');
    expect(formatServiceDueDays(null)).toBe('Due date not projected');
    expect(formatServiceDueDays(undefined)).toBe('Due date not projected');
  });
});

describe('UpcomingServiceTab — rendering & loading behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prediction cards with integer days and no decimal values', async () => {
    FleetDataService.getMaintenancePredictions.mockResolvedValue({
      records: [
        {
          registrationNumber: 'WB11G1562',
          risk: 'OK',
          daysUntilDue: 15.54,
          kmUntilDue: 1950,
          projectedServiceDueDate: '2026-12-04T00:00:00.000Z',
          projectedServiceDueOdometer: 132257,
          currentOdometer: 130307,
          avgKmPerDay: 126,
          lastServiceAt: '2026-09-15T00:00:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter>
        <UpcomingServiceTab />
      </MemoryRouter>,
    );

    // Initial render should not flash empty state box
    expect(screen.queryByText('No service predictions yet.')).toBeNull();

    // After resolving, must show "Due in 16 days", not "15.54"
    await waitFor(() => {
      expect(screen.getByText(/Due in 16 days/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/15\.54/)).toBeNull();
    expect(screen.getByText('WB11G1562')).toBeInTheDocument();
  });
});
