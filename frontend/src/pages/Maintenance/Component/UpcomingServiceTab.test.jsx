import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpcomingServiceTab from './UpcomingServiceTab';
import { FleetDataService } from '../../../services/FleetDataService';
import { getVehicleList } from '../../../services/vehicleListService';

vi.mock('../../../services/FleetDataService', () => ({
  FleetDataService: { getMaintenancePredictions: vi.fn() },
}));
vi.mock('../../../services/vehicleListService', () => ({ getVehicleList: vi.fn() }));

it('shows whole service days and preserves overdue status for a fraction of a day', async () => {
  getVehicleList.mockResolvedValue(
    [
      'WB25V8040',
      'WB25W1040',
      'WB25R9540',
      'WB01NEXT',
      'WB01RECENT',
      'WB01TODAY',
      'WB01UNKNOWN',
    ].map((registrationNumber) => ({ registrationNumber })),
  );
  FleetDataService.getMaintenancePredictions.mockResolvedValue({
    records: [
      { registrationNumber: 'WB25V8040', daysUntilDue: -82.42, risk: 'OVERDUE' },
      { registrationNumber: 'WB25W1040', daysUntilDue: -80.3, risk: 'OVERDUE' },
      { registrationNumber: 'WB25R9540', daysUntilDue: -69.71, risk: 'OVERDUE' },
      { registrationNumber: 'WB01NEXT', daysUntilDue: 2.6, risk: 'DUE_SOON' },
      { registrationNumber: 'WB01RECENT', daysUntilDue: -0.2, risk: 'OVERDUE' },
      { registrationNumber: 'WB01TODAY', daysUntilDue: 0, risk: 'DUE_SOON' },
      { registrationNumber: 'WB01UNKNOWN', daysUntilDue: null, risk: 'OK' },
    ],
  });
  render(
    <MemoryRouter>
      <UpcomingServiceTab />
    </MemoryRouter>,
  );
  expect(await screen.findByText('Overdue by 82 days')).toBeInTheDocument();
  expect(screen.getByText('Overdue by 80 days')).toBeInTheDocument();
  expect(screen.getByText('Overdue by 70 days')).toBeInTheDocument();
  expect(screen.getByText('Due in 3 days')).toBeInTheDocument();
  expect(screen.getByText('Overdue by less than 1 day')).toBeInTheDocument();
  expect(screen.getByText('Due today')).toBeInTheDocument();
  expect(screen.getByText('Due date not projected')).toBeInTheDocument();
  expect(screen.queryByText(/82\.42|80\.3|69\.71/)).not.toBeInTheDocument();
  const all = screen.getByRole('button', { name: 'All 7' });
  expect(all).toHaveAttribute('aria-pressed', 'true');
  expect(all).toHaveClass('si-filter-pill--active');
  fireEvent.click(screen.getByRole('button', { name: 'On track 1' }));
  expect(screen.queryByRole('region', { name: 'Top overdue trucks in kilometres' })).toBeNull();
});

it('does not show a telemetry start as a completed service and excludes retired trucks', async () => {
  getVehicleList.mockResolvedValue([
    { registrationNumber: 'ACTIVE', status: 'AVAILABLE' },
    { registrationNumber: 'RETIRED', status: 'DEACTIVATED' },
  ]);
  FleetDataService.getMaintenancePredictions.mockResolvedValue({
    records: [
      {
        registrationNumber: 'ACTIVE',
        risk: 'OVERDUE',
        basis: 'TELEMETRY_START',
        lastServiceAt: '2026-09-15',
      },
      { registrationNumber: 'RETIRED', risk: 'OVERDUE' },
      { registrationNumber: 'REMOVED', risk: 'OVERDUE' },
    ],
  });
  render(
    <MemoryRouter>
      <UpcomingServiceTab />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('link', { name: 'ACTIVE' })).toBeInTheDocument();
  expect(screen.getByText('Not recorded')).toBeInTheDocument();
  expect(screen.queryByText(/15 Sep|RETIRED|REMOVED/)).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1 of 1 active vehicles.')).toBeInTheDocument();
});

it('shows a retry after failure instead of zero service counts', async () => {
  getVehicleList.mockResolvedValue([]);
  FleetDataService.getMaintenancePredictions.mockRejectedValue(new Error('Forecast unavailable'));
  render(
    <MemoryRouter>
      <UpcomingServiceTab />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Forecast unavailable');
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  expect(screen.queryByText('No active vehicles found.')).not.toBeInTheDocument();
});
