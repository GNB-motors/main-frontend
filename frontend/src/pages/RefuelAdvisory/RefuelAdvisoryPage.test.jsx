import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RefuelAdvisoryPage from './RefuelAdvisoryPage';
import { RefuelAdvisoryService } from './RefuelAdvisoryService';

vi.mock('./RefuelAdvisoryService', () => ({
  RefuelAdvisoryService: { getAdvisories: vi.fn() },
}));

const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const old = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();

beforeEach(() => {
  RefuelAdvisoryService.getAdvisories.mockResolvedValue({
    success: true,
    advisories: [
      {
        _id: 'a',
        registrationNumber: 'WB11T0662',
        status: 'CRITICAL',
        currentFuelL: 20,
        tankCapacityL: 400,
        pctFull: 5,
        avgEfficiencyKmpl: 3.5,
        estimatedRangeKm: 70,
        litresToFull: 380,
        estimatedFillCostInr: 34000,
        lastReadingAt: recent,
      },
      {
        _id: 'b',
        registrationNumber: 'OD02AB1234',
        status: 'OK',
        currentFuelL: 300,
        tankCapacityL: 400,
        pctFull: 75,
        avgEfficiencyKmpl: 4,
        estimatedRangeKm: 1200,
        litresToFull: 100,
        estimatedFillCostInr: 9000,
        lastReadingAt: old,
      },
    ],
    summary: { count: 2, OK: 1, REFUEL_SOON: 0, CRITICAL: 1 },
    thresholds: {
      criticalRangeKm: 60,
      refuelSoonRangeKm: 150,
      criticalPctFull: 10,
      refuelSoonPctFull: 25,
      staleReadingHours: 12,
    },
  });
});

const card = (name) =>
  within(screen.getByRole('group', { name: 'Fleet fuel summary' })).getByRole(
    name === 'Critical' ? 'button' : 'region',
    { name: name === 'Critical' ? /^Critical/ : name },
  );
const mount = () =>
  render(
    <MemoryRouter>
      <RefuelAdvisoryPage />
    </MemoryRouter>,
  );

it('shows the fleet as cards and every truck in the table', async () => {
  mount();
  expect(await screen.findByRole('link', { name: 'WB11T0662' })).toHaveAttribute(
    'href',
    '/vehicles/WB11T0662',
  );
  expect(RefuelAdvisoryService.getAdvisories).toHaveBeenCalledWith(
    { limit: 500 },
    expect.anything(),
  );
  expect(card('Critical')).toHaveTextContent('Range ≤ 60 km or tank ≤ 10%');
  expect(card('Diesel in the tanks')).toHaveTextContent('320 L');
  expect(card('Fresh tank readings')).toHaveTextContent('1 truck older than 12 h');
  expect(screen.queryByText(/No advisories/)).not.toBeInTheDocument();
});

it('filters the table from a card and from the status filter', async () => {
  mount();
  await screen.findByRole('link', { name: 'OD02AB1234' });
  fireEvent.click(card('Critical'));
  expect(screen.queryByRole('link', { name: 'OD02AB1234' })).not.toBeInTheDocument();
  const filter = screen.getByRole('group', { name: 'Filter by status' });
  fireEvent.click(within(filter).getByRole('button', { name: /^All/ }));
  expect(screen.getByRole('link', { name: 'OD02AB1234' })).toBeInTheDocument();
});

it('shows a dash, never zero, when the advisories cannot be read', async () => {
  RefuelAdvisoryService.getAdvisories.mockRejectedValue(new Error('offline'));
  mount();
  expect(await screen.findByText('Could not load this list.')).toBeInTheDocument();
  expect(card('Critical')).toHaveTextContent('—');
});
