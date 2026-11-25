import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import IntelligenceService from '../../../Intelligence/IntelligenceService';
import TruckActivityStrip from './TruckActivityStrip';

vi.mock('../../../Intelligence/IntelligenceService', () => ({
  default: {
    getInstances: vi.fn().mockResolvedValue({ summary: { count: 0, totalMin: 36, totalL: null } }),
  },
}));

it('loads only the selected truck and preserves its dates in activity links', async () => {
  render(
    <MemoryRouter>
      <TruckActivityStrip vehicle="WB11G1234" />
    </MemoryRouter>,
  );
  expect(await screen.findByText('36 min')).toBeInTheDocument();
  const first = IntelligenceService.getInstances.mock.calls[0][0];
  expect(first).toMatchObject({ vehicle: 'WB11G1234', from: first.to, limit: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
  await waitFor(() =>
    expect(IntelligenceService.getInstances.mock.lastCall[0].from).not.toBe(first.from),
  );
  const idle = screen.getByRole('link', { name: /Idling/ });
  const target = new URL(idle.getAttribute('href'), 'https://example.invalid');
  expect(target.searchParams.get('idleSubview')).toBe('instances');
  expect(target.searchParams.get('vehicle')).toBe('WB11G1234');
  expect(target.searchParams.get('from')).not.toBe(first.from);
});
