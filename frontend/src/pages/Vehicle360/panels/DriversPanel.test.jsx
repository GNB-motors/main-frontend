import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriversPanel from './DriversPanel';

vi.mock('../../../services/DriverVehicleAssignmentService', () => ({
  default: { getAssignments: vi.fn().mockResolvedValue([]) },
}));

const now = '2026-11-09T10:00:00Z';
const summary = (counts = {}) => ({
  status: 'AVAILABLE',
  source: 'FLEETEDGE_NATIVE_TELEMETRY',
  window: { day: '2026-11-09', from: '2026-11-08T18:30:00Z', to: now, timezone: 'Asia/Kolkata' },
  counts: {
    total: 0,
    harshBraking: 0,
    harshAcceleration: 0,
    rashTurning: 0,
    neutralCoasting: 0,
    overspeed: 0,
    ...counts,
  },
  undatedAlertsReceivedToday: 0,
});
const renderPanel = (props = {}) =>
  render(
    <MemoryRouter>
      <DriversPanel {...props} />
    </MemoryRouter>,
  );
const countFor = (label) => screen.getByText(label).parentElement.querySelector('strong');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
});
afterEach(() => vi.useRealTimers());

it('shows full-day backend counts even when the five recent alerts contain no safety events', () => {
  renderPanel({
    safetyToday: summary({ total: 12, harshBraking: 12 }),
    recentAlerts: Array.from({ length: 5 }, (_, i) => ({
      id: i,
      type: 'GeoFenceExited',
      eventDateTime: now,
    })),
  });
  expect(countFor('Harsh braking')).toHaveTextContent('12');
  expect(countFor('Harsh acceleration')).toHaveTextContent('0');
  expect(screen.getByText('12 recorded events')).toBeInTheDocument();
  expect(screen.getByText(/Recorded native safety telemetry today/)).toBeInTheDocument();
});

it('shows recorded zero as zero, including overspeed', () => {
  renderPanel({ safetyToday: summary() });
  expect(countFor('Harsh braking')).toHaveTextContent('0');
  expect(countFor('Overspeed alerts')).toHaveTextContent('0');
  expect(screen.getByText('0 recorded events')).toBeInTheDocument();
});

it('does not infer daily totals from recent returned events when the summary is missing', () => {
  renderPanel({ recentAlerts: [{ id: 'b', type: 'HarshBraking', eventDateTime: now }] });
  expect(countFor('Harsh braking')).toHaveTextContent('—');
  expect(screen.getByText('Daily counts unavailable')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /HarshBraking/ })).toBeInTheDocument();
  expect(screen.getByText(/dots show returned alerts/)).toBeInTheDocument();
});

it('displays the unavailable reason instead of zero for unsupported or failed reads', () => {
  renderPanel({
    safetyToday: {
      status: 'UNAVAILABLE',
      counts: null,
      reason: 'Native safety alerts are not available for this provider.',
    },
  });
  expect(countFor('Harsh braking')).toHaveTextContent('—');
  expect(screen.getByText(/not available for this provider/)).toBeInTheDocument();
});

it('does not relabel a previous-day summary as today after midnight', () => {
  const data = summary({ total: 12, harshBraking: 12 });
  data.window.day = '2026-11-08';
  renderPanel({ safetyToday: data });
  expect(countFor('Harsh braking')).toHaveTextContent('—');
  expect(screen.getByText('Refresh to load today’s safety counts.')).toBeInTheDocument();
});

it('discloses undated arrivals and excludes their receipt times from the event timeline', () => {
  renderPanel({
    safetyToday: { ...summary(), undatedAlertsReceivedToday: 2 },
    recentAlerts: [
      { id: 'undated', type: 'HarshBraking', eventDateTime: now, eventTimeKnown: false },
    ],
  });
  expect(countFor('Harsh braking')).toHaveTextContent('0');
  expect(
    screen.getByText(/2 overspeed alerts received today have no event timestamp/),
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /HarshBraking/ })).not.toBeInTheDocument();
});
