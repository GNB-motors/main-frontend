import { describe, it, expect } from 'vitest';
import {
  DASH,
  drillRoute,
  drillTarget,
  exceptionRows,
  formatDayLabel,
  formatFooterText,
  formatMoney,
  formatValue,
  humanCode,
  isToday,
  labelFor,
  numberPairs,
} from './ownerReportModel';

describe('ownerReportModel', () => {
  it('writes money the way an owner reads it — no paise over ₹100', () => {
    expect(formatMoney(17635.8)).toBe('₹17,636');
    expect(formatMoney(2206.85)).toBe('₹2,207');
    expect(formatMoney(269.8)).toBe('₹270');
    expect(formatMoney(69.5)).toBe('₹69.5');
    expect(formatMoney(null)).toBe(DASH);
  });

  it('never prints a developer key', () => {
    expect(labelFor('moneyTheft')).toBe('Possible fuel theft');
    expect(labelFor('broadcastNotAcknowledged')).toBe('Broadcasts not acknowledged');
    expect(labelFor('kmVsPrev7Pct')).toBe('km vs last 7-day average');
    expect(labelFor('someNewKey')).toBe('Some new key');
  });

  it('never prints a raw code', () => {
    expect(humanCode('THEFT_SUSPECTED')).toBe('Theft suspected');
    expect(humanCode('PICKUP_TO_PICKUP')).toBe('Pickup to pickup');
    expect(humanCode('MH12AB1234')).toBe('MH12AB1234');
  });

  it('writes a percentage signed, with one decimal', () => {
    expect(formatValue('kmVsPrev7Pct', 12.34)).toBe('+12.3%');
    expect(formatValue('kmVsPrev7Pct', -12.34)).toBe('-12.3%');
  });

  it('gives a distance its unit', () => {
    expect(formatValue('km', 12000.5)).toBe('12,001 km');
    expect(formatValue('dieselBillLitres', 12.34)).toBe('12.3 L');
  });

  it('leaves a live day\'s percentage open instead of showing -100%', () => {
    const pairs = numberPairs({ kmVsPrev7Pct: -100 }, { isPendingDay: true });
    expect(pairs[0].value).toBe(DASH);
    expect(pairs[0].note).toBe('Day not over yet');
  });

  it('finds the drill target and the page it goes to', () => {
    const section = { rows: { drill: 'fleet.livePositions', params: { orgId: 'o1' } } };
    expect(drillTarget(section)).toBe('fleet.livePositions');
    expect(drillRoute('fleet.livePositions')).toBe('/live-tracking');
    expect(drillRoute('autotrip.day')).toBe('/auto-trips');
    expect(drillRoute('trend.headlines')).toBe('/intelligence');
    expect(drillRoute('money.out')).toBe('/mileage');
    expect(drillRoute('exceptions.ledger')).toBe('/alert-inbox');
    expect(drillRoute('something.else')).toBeNull();
  });

  it('keeps only the exception kinds that counted', () => {
    const rows = exceptionRows([
      { kind: 'sos', count: 1 },
      { kind: 'moneyTheft', count: 2 },
      { kind: 'papersWaiting', count: 0 },
      { kind: 'etaSlipping', count: null, note: 'not built yet' },
    ]);
    expect(rows.map((r) => r.label)).toEqual(['Possible fuel theft', 'SOS']);
  });

  it('writes a timestamp the way a person reads it', () => {
    expect(formatFooterText('How we know: AutoTrip (as of 2026-11-04T00:49:43.105Z)')).toMatch(
      /^AutoTrip \(as of \d+ [A-Z][a-z]{2}/,
    );
  });

  it('writes a day without an ISO string', () => {
    expect(formatDayLabel('2026-11-04')).toMatch(/^4 Nov( \d{4})?$/);
  });

  it('knows today', () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    expect(isToday(today)).toBe(true);
    expect(isToday('2000-01-01')).toBe(false);
  });
});
