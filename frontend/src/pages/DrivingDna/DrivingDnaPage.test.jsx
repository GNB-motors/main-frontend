import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DrivingDnaPage from './DrivingDnaPage';
import { DrivingDnaService } from './DrivingDnaService';

vi.mock('./DrivingDnaService', () => ({ DrivingDnaService: { getProfiles: vi.fn() } }));

beforeEach(() => {
  DrivingDnaService.getProfiles.mockResolvedValue({
    profiles: [
      {
        _id: 'a',
        registrationNumber: 'WB11T0662',
        grade: 'D',
        drivingScore: 42,
        idleScore: 30,
        speedingScore: 55,
        overRevScore: null,
        movingSamples: 200,
        overspeedSamples: 30,
        canSamples: 0,
      },
      {
        _id: 'b',
        registrationNumber: 'OD02AB1234',
        grade: 'A',
        drivingScore: 90,
        idleScore: 92,
        speedingScore: 88,
        overRevScore: 85,
        movingSamples: 300,
        overspeedSamples: 6,
        canSamples: 40,
        overRevSamples: 2,
      },
    ],
    summary: { count: 2, avgScore: 66 },
    rules: {
      lookbackDays: 30,
      overspeedThresholdKmh: 65,
      gradeThresholds: { a: 85, b: 70, c: 50 },
    },
  });
});

const cards = () => screen.getByRole('group', { name: 'Fleet driving summary' });
const mount = () =>
  render(
    <MemoryRouter>
      <DrivingDnaPage />
    </MemoryRouter>,
  );

it('shows the fleet as cards and the trucks in the table', async () => {
  mount();
  await screen.findByRole('link', { name: 'WB11T0662' });
  expect(within(cards()).getByRole('region', { name: 'Fleet score' })).toHaveTextContent('66');
  expect(within(cards()).getByRole('region', { name: 'Harsh speeding' })).toHaveTextContent(
    'Above 65 km/h · 36 of 500 readings',
  );
  expect(screen.getByText('No rpm data')).toBeInTheDocument();
});

it('narrows the table to one grade from its card', async () => {
  mount();
  await screen.findByRole('link', { name: 'OD02AB1234' });
  fireEvent.click(within(cards()).getByRole('button', { name: /^Grade D/ }));
  expect(screen.queryByRole('link', { name: 'OD02AB1234' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'WB11T0662' })).toBeInTheDocument();
});
