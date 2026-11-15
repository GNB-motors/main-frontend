import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeviationDetail from './DeviationDetail.jsx';
import DeviationFeed from './DeviationFeed.jsx';
import { groupByTrip } from './deviationRules.js';

vi.mock('./DeviationMap.jsx', () => ({ default: () => null }));
vi.mock('./DeviationTimeline.jsx', () => ({ default: () => null }));
vi.mock('./DeviationReview.jsx', () => ({ default: () => null }));

const row = {
  _id: 'event-1',
  registrationNumber: 'WB11T0662',
  source: 'ROAD_ENGINE',
  startedAt: '2026-11-01T00:00:00Z',
  endedAt: '2026-11-01T00:30:00Z',
  status: 'OPEN',
  offRouteKm: 12,
  extraKmEstimate: null,
  estimatedExtraCostInr: null,
};

it('explains off-route distance in the feed without promising a pending cost calculation', () => {
  render(<DeviationFeed groups={groupByTrip([row])} onSelect={vi.fn()} />);
  expect(screen.getByText('Off-route distance only')).toBeInTheDocument();
  expect(screen.queryByText(/not estimated yet/i)).not.toBeInTheDocument();
  expect(screen.queryByText('₹0')).not.toBeInTheDocument();
});

it('shows why extra cost is unavailable alongside measured off-route km in the detail', () => {
  render(
    <MemoryRouter>
      <DeviationDetail row={row} siblings={[]} go={vi.fn()} />
    </MemoryRouter>,
  );
  expect(screen.getByText('12.0 km')).toBeInTheDocument();
  expect(
    screen.getByText(/Extra distance and cost are not calculated for this detector/),
  ).toBeInTheDocument();
  expect(screen.queryByText('₹0')).not.toBeInTheDocument();
});

it('surfaces the backend evidence failure rather than hiding the event', () => {
  const event = {
    ...row,
    source: 'CORRIDOR',
    enrichment: {
      status: 'UNAVAILABLE',
      message: 'A complete exit-and-return track has not been verified for estimating this event.',
    },
  };
  render(
    <MemoryRouter>
      <DeviationDetail row={event} siblings={[]} go={vi.fn()} />
    </MemoryRouter>,
  );
  expect(screen.getByText(event.enrichment.message)).toBeInTheDocument();
  expect(screen.getByText('Extra cost (est.)')).toBeInTheDocument();
});
