import { Suspense } from 'react';
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  createRoutesFromElements,
  matchRoutes,
} from 'react-router-dom';
import RedirectWithState from './RedirectWithState';
import PerformanceRedirect from './PerformanceRedirect';
import LegacyTripRedirect from './LegacyTripRedirect';
import dashboardRoutes from './dashboardRoutes';

function Destination() {
  const location = useLocation();
  return <output data-testid="destination">{JSON.stringify(location)}</output>;
}

it.each([
  [
    '/overspeed?vehicle=WB11S6162&from=2026-11-23&to=2026-11-23&tab=old#events',
    '/overspeed',
    <RedirectWithState to="/intelligence?tab=overspeed" />,
    '/intelligence',
    'overspeed',
  ],
  [
    '/hotspots?vehicle=WB11S6162&from=2026-11-23&to=2026-11-23#events',
    '/hotspots',
    <RedirectWithState to="/intelligence?tab=fuel" />,
    '/intelligence',
    'fuel',
  ],
  [
    '/performance?tab=drivers&vehicle=WB11S6162&from=2026-11-23&to=2026-11-23#events',
    '/performance',
    <PerformanceRedirect />,
    '/intelligence',
    'perfDrivers',
  ],
  [
    '/trip/legacy-42?vehicle=WB11S6162&from=2026-11-23&to=2026-11-23#events',
    '/trip/:tripId',
    <LegacyTripRedirect />,
    '/trip-management/trip/legacy-42',
    null,
  ],
])('retains filters and state through %s', (entry, path, element, pathname, tab) => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: entry.split('?')[0],
          search: `?${entry.split('?')[1].split('#')[0]}`,
          hash: '#events',
          state: { source: 'owner-report' },
        },
      ]}
    >
      <Routes>
        <Route path={path} element={element} />
        <Route path={pathname} element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  const location = JSON.parse(screen.getByTestId('destination').textContent);
  expect(location.pathname).toBe(pathname);
  expect(Object.fromEntries(new URLSearchParams(location.search))).toMatchObject({
    vehicle: 'WB11S6162',
    from: '2026-11-23',
    to: '2026-11-23',
    ...(tab ? { tab } : {}),
  });
  expect(location.hash).toBe('#events');
  expect(location.state).toEqual({ source: 'owner-report' });
});

it('keeps an unknown dashboard link inside a page with a way back', async () => {
  render(
    <MemoryRouter initialEntries={['/missing-owner-screen']}>
      <Suspense fallback="Loading">
        <Routes>{dashboardRoutes}</Routes>
      </Suspense>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to Daily Digest' })).toHaveAttribute(
    'href',
    '/digest',
  );
});

it.each(['/fuel-ledger', '/vehicle-assignments'])(
  'handles stale %s links before the catch-all',
  (path) => {
    const matches = matchRoutes(createRoutesFromElements(dashboardRoutes), path);
    expect(matches.at(-1).route.path).toBe(path);
  },
);
