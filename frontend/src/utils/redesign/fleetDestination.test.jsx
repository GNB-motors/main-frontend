import { describe, it, expect } from 'vitest';
import { createRoutesFromElements, matchRoutes } from 'react-router-dom';
import dashboardRoutes from '../../components/routes/dashboardRoutes';
import publicRoutes from '../../components/routes/publicRoutes';
import { fleetDestination } from './fleetDestination';

const dashboard = createRoutesFromElements(dashboardRoutes);
const marketing = createRoutesFromElements(publicRoutes);

describe('fleet report destinations', () => {
  it.each([
    ['/trips', '/auto-trips'],
    ['/trips?from=2026-11-01&vehicle=BR44GB1162', '/auto-trips?from=2026-11-01&vehicle=BR44GB1162'],
    ['/trips/trip-1', '/auto-trips/trip-1'],
    ['/trips/trip-1/track?at=now', '/auto-trips/trip-1?at=now&play=1'],
    ['/fuel-and-mileage', '/mileage?tab=live'],
    ['/fuel-consumption', '/mileage?tab=live&subtab=completed'],
    [
      '/mileage?tab=mileage&vehicle=BR44GB1162',
      '/mileage?tab=live&vehicle=BR44GB1162&subtab=completed',
    ],
    ['/driver-management', '/drivers'],
    ['/vehicle-tracking', '/live-tracking'],
    ['/settings/integrations', '/settings/fleetedge-accounts'],
    ['/intelligence?tab=report-cards', '/intelligence?tab=vehicles'],
    ['/intelligence?kind=GPS_FREEZE', '/intelligence?kind=GPS_FREEZE&tab=issues'],
    ['/places?tab=review-queue', '/auto-trips?tab=questions'],
    ['/places?place=abc', '/place-hub?place=site%3Aabc'],
    ['/refuel-logs', '/mileage?tab=live'],
    ['/vehicles/dashboard', '/vehicles/dashboard'],
    ['/intelligence?tab=fuel', '/intelligence?tab=fuel'],
    ['/mileage?tab=live&subtab=completed', '/mileage?tab=live&subtab=completed'],
    ['/settings/ialert-accounts', '/settings/ialert-accounts'],
  ])('routes %s to an actual authenticated page', (input, expected) => {
    const destination = fleetDestination(input);
    expect(destination).toBe(expected);
    expect(matchRoutes(dashboard, destination)).not.toBeNull();
    expect(matchRoutes(marketing, destination)).toBeNull();
  });

  it.each([
    '/',
    '/about',
    '/login',
    '/missing-report',
    '//external.example/trips',
    'https://external.example/trips',
    undefined,
  ])('does not make a fleet shortcut for %s', (to) => {
    expect(fleetDestination(to)).toBeNull();
  });
});
