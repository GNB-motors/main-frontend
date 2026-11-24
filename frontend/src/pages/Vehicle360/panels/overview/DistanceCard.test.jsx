import { expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DistanceCard } from './ReferenceOverviewCards';
it('provides a dated km chart and accessible values including zero and missing readings', () => {
  render(
    <DistanceCard
      series={[
        { day: '2026-11-21', km: 125, engineKm: 125 },
        { day: '2026-11-22', km: 0, engineKm: 0 },
        { day: '2026-11-23', km: null },
        { day: '2026-11-24', km: 70, gpsOnly: true },
      ]}
    />,
  );
  expect(
    screen.getByRole('figure', { name: 'Daily distance in km for the last 30 days' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText('View daily distances'));
  const table = within(screen.getByRole('table', { name: 'Recorded daily distance' }));
  expect(table.getByText('Distance (km)')).toBeInTheDocument();
  expect(table.getByText('125')).toBeInTheDocument();
  expect(table.getByText('0')).toBeInTheDocument();
  expect(table.getByText('Not measured')).toBeInTheDocument();
  expect(table.getByText('GPS estimate')).toBeInTheDocument();
});
