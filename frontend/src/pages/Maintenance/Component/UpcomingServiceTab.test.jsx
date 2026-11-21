import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpcomingServiceTab from './UpcomingServiceTab';
import { FleetDataService } from '../../../services/FleetDataService';

vi.mock('../../../services/FleetDataService', () => ({
  FleetDataService: { getMaintenancePredictions: vi.fn() },
}));

it('shows whole service days and preserves overdue status for a fraction of a day', async () => {
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
});
