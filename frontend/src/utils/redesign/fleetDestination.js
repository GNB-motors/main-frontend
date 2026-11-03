import { matchPath } from 'react-router-dom';

// Fleet API links predate the public marketing routes at /trips and
// /fuel-and-mileage. Resolve them at the UI boundary, without changing those
// public pages or trusting stale destinations from stored reports.
const FLEET_ROUTES = [
  '/digest',
  '/intelligence',
  '/live-tracking',
  '/auto-trips',
  '/auto-trips/:id',
  '/auto-trips/excursions/:id',
  '/auto-trips/plans',
  '/auto-trips/approvals',
  '/vehicles',
  '/vehicles/:registrationNumber',
  '/vehicles/service-intelligence/add-service',
  '/vehicles/service-intelligence/add-repair',
  '/drivers',
  '/drivers/add',
  '/drivers/bulk-upload',
  '/mileage',
  '/mileage-tracking/vehicle/:id',
  '/mileage-tracking/:id',
  '/fuel-integrity',
  '/def-ledger',
  '/route-hub',
  '/place-hub',
  '/settings',
  '/settings/fleetedge-accounts',
  '/settings/ialert-accounts',
  '/owner-alerts',
  '/fleet-alerts',
  '/alert-inbox',
  '/reports',
  '/performance',
  '/optimal-speed',
  '/refuel-advisory',
  '/driving-dna',
  '/fleet-coverage',
  '/approvals',
  '/trip-management',
  '/trip-management/trip/:id',
  '/khata-ledger',
  '/khata-ledger/drivers/:id',
  '/khata-ledger/trucks/:id',
];

export function fleetDestination(to) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) return null;
  let url;
  try {
    url = new URL(to, 'https://fleet.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'https://fleet.invalid') return null;
  const path = url.pathname.replace(/\/$/, '') || '/';
  const trip = path.match(/^\/trips\/([^/]+)(\/track)?$/);
  if (trip) {
    url.pathname = `/auto-trips/${trip[1]}`;
    if (trip[2]) url.searchParams.set('play', '1');
  } else if (path === '/trips') url.pathname = '/auto-trips';
  else if (
    ['/fuel-and-mileage', '/fuel-consumption', '/fuel-spend', '/fuel-bills'].includes(path)
  ) {
    url.pathname = '/mileage';
    url.searchParams.set('tab', 'live');
    if (path === '/fuel-consumption') url.searchParams.set('subtab', 'completed');
  } else if (path === '/vehicle-tracking') url.pathname = '/live-tracking';
  else if (path === '/driver-management') url.pathname = '/drivers';
  else if (path === '/settings/integrations') url.pathname = '/settings/fleetedge-accounts';
  else if (path === '/refuel-logs') {
    url.pathname = '/mileage';
    url.searchParams.set('tab', 'live');
  } else if (path === '/places') {
    // Review questions have their own working Trips tab. Confirmed place
    // drilldowns still open Place Hub, using its actual place-id format.
    if (url.searchParams.get('tab') === 'review-queue') {
      url.pathname = '/auto-trips';
      url.searchParams.set('tab', 'questions');
    } else {
      url.pathname = '/place-hub';
      const place = url.searchParams.get('place');
      if (place && !place.includes(':')) url.searchParams.set('place', `site:${place}`);
    }
  } else url.pathname = path;

  if (url.pathname === '/intelligence') {
    const tabAliases = {
      'report-cards': 'vehicles',
      kmperl: 'mileage',
      idlehperday: 'idling',
      overspeedmin: 'overspeed',
      cruisesharepct: 'cruise',
      detourcount: 'detours',
    };
    const tab = url.searchParams.get('tab');
    if (tabAliases[tab]) url.searchParams.set('tab', tabAliases[tab]);
    if (!url.searchParams.has('tab') && url.searchParams.has('kind'))
      url.searchParams.set('tab', 'issues');
  }
  if (url.pathname === '/mileage' && url.searchParams.get('tab') === 'mileage') {
    url.searchParams.set('tab', 'live');
    url.searchParams.set('subtab', 'completed');
  }
  if (!FLEET_ROUTES.some((pattern) => matchPath({ path: pattern, end: true }, url.pathname)))
    return null;
  // Preserve the API's original query encoding on destinations needing no repair.
  return `${url.pathname}${url.search}${url.hash}`;
}
