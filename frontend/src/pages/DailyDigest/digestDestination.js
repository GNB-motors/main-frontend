import { fleetDestination } from '../../utils/redesign/fleetDestination';
import { shiftDay } from '../../utils/dateUtils';

/** Carry a card's calendar window only to pages that support date filters. */
export function digestDestination(to, day, days = 1) {
  const destination = fleetDestination(to);
  if (!destination || !day) return destination;
  const url = new URL(destination, 'https://fleet.invalid');
  if (url.pathname === '/intelligence') {
    if (
      url.searchParams.get('tab') === 'fuel' &&
      !url.searchParams.has('fuelView') &&
      !url.searchParams.has('hotspot')
    )
      url.searchParams.set('fuelView', 'drain');
    if (url.searchParams.get('tab') === 'idling' && !url.searchParams.has('idleView'))
      url.searchParams.set('idleView', 'spots');
  }
  if (
    !['/mileage', '/auto-trips', '/intelligence', '/khata-ledger'].includes(url.pathname) &&
    !(url.pathname === '/alert-inbox' && url.searchParams.get('inboxView') === 'INCIDENTS') &&
    !(
      url.pathname === '/vehicles/dashboard' &&
      url.searchParams.get('docFilter') === 'EXPIRING_SOON'
    )
  )
    return destination;
  // Questions are a current review queue, not trips departing on the report day.
  if (url.pathname === '/auto-trips' && url.searchParams.get('tab') === 'questions')
    return destination;
  // A report may supply a more specific window of its own.
  if (!(url.searchParams.has('from') && url.searchParams.has('to'))) {
    url.searchParams.set('from', shiftDay(day, 1 - days));
    url.searchParams.set('to', day);
  }
  if (url.pathname === '/auto-trips') url.searchParams.set('range', 'custom');
  if (url.pathname === '/vehicles/dashboard') url.searchParams.set('to', shiftDay(day, 7));
  if (url.pathname === '/mileage') {
    // The hub searches truck plates through `search`, not `vehicle`.
    if (url.searchParams.has('vehicle') && !url.searchParams.has('search'))
      url.searchParams.set('search', url.searchParams.get('vehicle'));
    url.searchParams.delete('dates');
    if (days === 7) url.searchParams.set('dates', '7DAYS');
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Older scorecard responses carry the learned window in their evidence basis. */
export function digestSubjectDestination(item, day, defaultGrade = null, context = null) {
  const to =
    item.to ||
    `/intelligence?tab=${item.subject === 'vehicle' ? 'vehicles&vehicle=' : 'drivers&driver='}${encodeURIComponent(item.id || '')}`;
  const scoreWindow = /^Scorecard window (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/.exec(
    item.basis?.basis || '',
  );
  const unavailableWindow = /for the (\d+) days (?:up )?to (\d{4}-\d{2}-\d{2})/.exec(
    context?.why?.text || '',
  );
  const explicitWindow = item.window || context?.window;
  const window =
    explicitWindow?.startDay && explicitWindow?.endDay
      ? { from: explicitWindow.startDay, to: explicitWindow.endDay }
      : scoreWindow
        ? { from: scoreWindow[1], to: scoreWindow[2] }
        : unavailableWindow
          ? {
              from: shiftDay(unavailableWindow[2], 1 - Number(unavailableWindow[1])),
              to: unavailableWindow[2],
            }
          : null;
  const destination = digestDestination(to, day, 30);
  if (!destination) return destination;
  const url = new URL(destination, 'https://fleet.invalid');
  if (
    url.pathname !== '/intelligence' ||
    !['drivers', 'vehicles'].includes(url.searchParams.get('tab'))
  )
    return destination;
  const grade = item.grade || defaultGrade;
  if (grade && !url.searchParams.has('grade')) url.searchParams.set('grade', grade);
  const original = new URL(to, 'https://fleet.invalid');
  if (
    window &&
    window.from <= window.to &&
    !(original.searchParams.has('from') && original.searchParams.has('to'))
  ) {
    url.searchParams.set('from', window.from);
    url.searchParams.set('to', window.to);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
