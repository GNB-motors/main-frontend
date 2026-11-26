import { expect, it } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { DistanceCard } from './ReferenceOverviewCards';
it('opens daily distances in a modal with zero and missing readings and restores focus on close', async () => {
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
  const toggle = screen.getByRole('button', { name: /View daily distances/ });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('table', { name: 'Recorded daily distance' })).toBeNull();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const dialog = await screen.findByRole('dialog', { name: 'Daily distances' });
  const table = within(within(dialog).getByRole('table', { name: 'Recorded daily distance' }));
  expect(table.getByText('Distance (km)')).toBeInTheDocument();
  expect(table.getByText('125')).toBeInTheDocument();
  expect(table.getByText('0')).toBeInTheDocument();
  expect(table.getByText('Not measured')).toBeInTheDocument();
  expect(table.getByText('GPS estimate')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close daily distances' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(toggle).toHaveFocus());
  fireEvent.click(toggle);
  await screen.findByRole('dialog', { name: 'Daily distances' });
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
