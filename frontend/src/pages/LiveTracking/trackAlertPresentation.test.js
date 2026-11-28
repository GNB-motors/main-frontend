import { expect, it } from 'vitest';
import { trackAlertView, truckOwnerAlertsLink } from './trackAlertPresentation';

it('shows the actual message and a readable title rather than an alert code', () => {
  const view = trackAlertView({
    type: 'FLEETEDGE_ALERT_FUEL_DRAIN',
    message: 'Fuel fell by 35 L while parked.',
    at: '2026-11-28T04:00:00Z',
    severity: 'WARNING',
  });
  expect(view.title).toBe('Fuel drain alert');
  expect(view.message).toBe('Fuel fell by 35 L while parked.');
  expect(view.timeLabel).toContain('09:30 AM IST');
});

it('preserves uncertainty and never infers an alert cause from the truck being offline', () => {
  const view = trackAlertView({ type: 'CUSTOM_ALERT', status: 'offline' });
  expect(view.title).toBe('Custom alert');
  expect(view.message).toBe('No further details were provided for this alert.');
  expect(view.at).toBeNull();
  expect(view.timeLabel).toBe('Time not recorded');
});

it('keeps warning fuel evidence labelled for review rather than claiming a loss', () => {
  expect(trackAlertView({ type: 'FUEL_SIPHON_SUSPECTED', severity: 'WARNING' }).title).toBe(
    'Fuel to check',
  );
});

it('links the counted source feed with this truck, all severities and the same 24-hour window', () => {
  const now = Date.parse('2026-11-28T10:00:00Z');
  const url = new URL(truckOwnerAlertsLink(' WB11F8162 ', now), 'https://local.test');
  expect(url.pathname).toBe('/owner-alerts');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    vehicle: 'WB11F8162',
    severity: 'all',
    from: '2026-11-27T10:00:00.000Z',
    to: '2026-11-28T10:00:00.000Z',
  });
});
