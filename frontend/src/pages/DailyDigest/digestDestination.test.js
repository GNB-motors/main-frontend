import { describe, it, expect } from 'vitest';
import { digestDestination, digestSubjectDestination } from './digestDestination';
import { hubRangeFromParams, rangeToParams } from '../Mileage/mileageDates';
import { readRange, rangeToParams as tripParams } from '../AutoTrips/tripRange';
import { resolvePeriod } from '../Intelligence/intelligenceModel';

const paramsOf = (to) => new URL(to, 'https://fleet.invalid').searchParams;

describe('Digest filter handoff', () => {
  it.each([
    ['EXCELLENT', 'goodDrivers'],
    ['FALLING', 'needsWord'],
  ])('keeps the empty %s category and the reported 120-day window', (grade) => {
    const params = paramsOf(
      digestSubjectDestination({ to: '/intelligence?tab=drivers' }, '2026-11-14', grade, {
        why: { text: 'No driver score has been learned for the 120 days up to 2026-11-14.' },
      }),
    );
    expect(Object.fromEntries(params)).toMatchObject({
      tab: 'drivers',
      grade,
      from: '2026-07-18',
      to: '2026-11-14',
    });
  });

  it.each([
    [
      '/intelligence?tab=idling',
      { tab: 'idling', idleView: 'spots', from: '2026-11-04', to: '2026-11-04' },
    ],
    [
      '/intelligence?tab=fuel',
      { tab: 'fuel', fuelView: 'drain', from: '2026-11-04', to: '2026-11-04' },
    ],
    [
      '/alert-inbox?inboxView=INCIDENTS&incidentStatus=ACTIVE',
      { inboxView: 'INCIDENTS', incidentStatus: 'ACTIVE', from: '2026-11-04', to: '2026-11-04' },
    ],
    [
      '/khata-ledger?tab=all&expenseStatus=PENDING',
      { tab: 'all', expenseStatus: 'PENDING', from: '2026-11-04', to: '2026-11-04' },
    ],
    [
      '/vehicles/dashboard?docFilter=EXPIRING_SOON',
      { docFilter: 'EXPIRING_SOON', from: '2026-11-04', to: '2026-11-11' },
    ],
  ])('hands the correct category and time window to %s', (link, expected) => {
    expect(Object.fromEntries(paramsOf(digestDestination(link, '2026-11-04')))).toMatchObject(
      expected,
    );
  });
  it('uses the actual learned score window when supplied instead of assuming 30 days', () => {
    const params = paramsOf(
      digestSubjectDestination(
        {
          subject: 'driver',
          id: 'driver-1',
          basis: { basis: 'Scorecard window 2026-10-20 to 2026-10-26' },
        },
        '2026-11-04',
      ),
    );
    expect(params.get('driver')).toBe('driver-1');
    expect(params.get('from')).toBe('2026-10-20');
    expect(params.get('to')).toBe('2026-10-26');
  });
  it('opens exactly the seven fuel days, including across the year and IST midnight', () => {
    const to = digestDestination('/mileage', '2026-01-03', 7);
    const params = paramsOf(to);
    const today = new Date('2026-01-02T19:00:00Z');
    const window = hubRangeFromParams(params, today);
    expect(window).toEqual({ preset: '7DAYS', range: { from: '2025-12-28', to: '2026-01-03' } });
    expect(rangeToParams(window.range)).toEqual({
      from: '2025-12-27T18:30:00.000Z',
      to: '2026-01-03T18:29:59.999Z',
    });
    // Visiting an older report, or opening a saved link later, keeps its dates.
    expect(hubRangeFromParams(params, new Date('2026-02-01T12:00:00Z'))).toEqual({
      preset: null,
      range: window.range,
    });
  });

  it('repairs old trip routes and supplies the custom range the Trips reader requires', () => {
    const params = paramsOf(digestDestination('/trips?status=OPEN', '2026-11-04'));
    expect(params.get('status')).toBe('OPEN');
    expect(tripParams(readRange(params))).toEqual({
      from: '2026-11-03T18:30:00.000Z',
      to: '2026-11-04T18:29:59.999Z',
    });
    const supplied = paramsOf(
      digestDestination('/trips?from=2026-10-01&to=2026-10-03', '2026-11-04'),
    );
    expect(readRange(supplied)).toEqual({ range: 'custom', from: '2026-10-01', to: '2026-10-03' });
  });

  it('retains issue and subject filters with the daily or 30-day window', () => {
    const issue = paramsOf(
      digestDestination('/intelligence?kind=GPS_FROZEN&vehicle=TEST01', '2026-11-04'),
    );
    expect(issue.get('tab')).toBe('issues');
    expect(issue.get('kind')).toBe('GPS_FROZEN');
    expect(issue.get('vehicle')).toBe('TEST01');
    expect(resolvePeriod(Object.fromEntries(issue))).toMatchObject({
      from: '2026-11-04',
      to: '2026-11-04',
    });
    const driver = paramsOf(
      digestDestination('/intelligence?tab=drivers&driver=driver-1', '2026-11-04', 30),
    );
    expect(driver.get('driver')).toBe('driver-1');
    expect(resolvePeriod(Object.fromEntries(driver))).toMatchObject({
      from: '2026-10-06',
      to: '2026-11-04',
    });
  });

  it('preserves an explicit server range and translates Mileage vehicle search', () => {
    const params = paramsOf(
      digestDestination('/refuel-logs?vehicle=TEST01&from=2026-10-01&to=2026-10-02', '2026-11-04'),
    );
    expect(params.get('search')).toBe('TEST01');
    expect(hubRangeFromParams(params).range).toEqual({ from: '2026-10-01', to: '2026-10-02' });
  });

  it('keeps current queues, live views and account recovery independent of report dates', () => {
    expect(digestDestination('/places?tab=review-queue', '2026-11-04')).toBe(
      '/auto-trips?tab=questions',
    );
    expect(digestDestination('/settings/integrations', '2026-11-04')).toBe(
      '/settings/fleetedge-accounts',
    );
    expect(digestDestination('/live-tracking?status=offline', '2026-11-04')).toBe(
      '/live-tracking?status=offline',
    );
    expect(digestDestination('https://other.example', '2026-11-04')).toBeNull();
  });
});
