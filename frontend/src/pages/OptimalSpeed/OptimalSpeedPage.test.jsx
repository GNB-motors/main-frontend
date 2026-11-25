import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OptimalSpeedPage from './OptimalSpeedPage';
import { OptimalSpeedService } from './OptimalSpeedService';

vi.mock('./OptimalSpeedService', () => ({ OptimalSpeedService: { getProfiles: vi.fn() } }));

const profile = (registrationNumber, inBand, inr, kmpl) => ({
  _id: registrationNumber,
  registrationNumber,
  optimalMinKmh: 40,
  optimalMaxKmh: 50,
  optimalEfficiencyKmpl: 4,
  avgSpeedKmh: 45,
  avgEfficiencyKmpl: kmpl,
  pctDistanceInOptimalBand: inBand,
  potentialSavingsL: 10,
  potentialSavingsInr: inr,
  sampleWindows: 12,
  bands: [{ minKmh: 40, maxKmh: 50, efficiencyKmpl: 4, distanceKm: 400 }],
});

beforeEach(() => {
  OptimalSpeedService.getProfiles.mockResolvedValue({
    profiles: [profile('WB11T0662', 30, 9000, 3.1), profile('OD02AB1234', 80, 1000, 3.8)],
    summary: { count: 2, totalPotentialSavingsInr: 10000 },
    window: { lookbackDays: 30 },
  });
});

const cards = () => screen.getByRole('group', { name: 'Fleet speed summary' });
const mount = () =>
  render(
    <MemoryRouter>
      <OptimalSpeedPage />
    </MemoryRouter>,
  );

it('shows the fleet as cards and the trucks in the table', async () => {
  mount();
  await screen.findByRole('link', { name: 'WB11T0662' });
  expect(OptimalSpeedService.getProfiles).toHaveBeenCalledWith({ limit: 500 }, expect.anything());
  expect(within(cards()).getByRole('region', { name: '₹ to save' })).toHaveTextContent(
    'in 30 days',
  );
  expect(within(cards()).getByRole('region', { name: 'Most common best band' })).toHaveTextContent(
    '40–50 km/h',
  );
});

it('narrows the table to trucks mostly outside their band', async () => {
  mount();
  await screen.findByRole('link', { name: 'OD02AB1234' });
  fireEvent.click(within(cards()).getByRole('button', { name: /Mostly outside their band/ }));
  expect(screen.queryByRole('link', { name: 'OD02AB1234' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'WB11T0662' })).toBeInTheDocument();
});
