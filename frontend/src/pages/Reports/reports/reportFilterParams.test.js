import { describe, it, expect } from 'vitest';
import {
  EMPTY_FILTERS,
  REPORT_FILTER_PARAMS,
  activePresetId,
  countActiveFilters,
  readFilterParams,
  resolveRange,
  toRequestParams,
  writeFilterParams,
} from './reportFilterParams';

const at = (qs) => readFilterParams(new URLSearchParams(qs));
const written = (qs, patch) => writeFilterParams(new URLSearchParams(qs), patch).toString();

// 2026-10-09 IST midday.
const NOW = new Date('2026-10-09T12:00:00+05:30');

describe('readFilterParams', () => {
  it('reads an empty URL as "not filtered" everywhere', () => {
    expect(at('')).toEqual(EMPTY_FILTERS);
    expect(at('').vehicle).toBe('all');
    expect(at('').driver).toBe('all');
  });

  it('reads a fully filtered link', () => {
    expect(
      at(
        'loc=loc_1&dates=30DAYS&search=WB25&vehicle=v1&vehicleLabel=WB25R9540&driver=d1&driverLabel=Ram&status=ONGOING',
      ),
    ).toEqual({
      manufacturer: '',
      loc: 'loc_1',
      dates: '30DAYS',
      from: '',
      to: '',
      search: 'WB25',
      vehicle: 'v1',
      vehicleLabel: 'WB25R9540',
      driver: 'd1',
      driverLabel: 'Ram',
      status: 'ONGOING',
    });
  });

  it('keeps the picker labels beside their ids so a shared link can name them', () => {
    const filters = at('vehicle=v1&vehicleLabel=WB25R9540');
    expect(filters.vehicle).toBe('v1');
    expect(filters.vehicleLabel).toBe('WB25R9540');
  });

  it('drops dates that are not YYYY-MM-DD and quick ranges it does not know', () => {
    const filters = at('from=09-10-2026&to=2026-10-09&dates=FORTNIGHT');
    expect(filters.from).toBe('');
    expect(filters.to).toBe('2026-10-09');
    expect(filters.dates).toBe('');
  });
});

describe('writeFilterParams', () => {
  it('sets a filter and leaves the report selection alone', () => {
    expect(written('report=driver', { vehicle: 'v1' })).toBe('report=driver&vehicle=v1');
  });

  it('deletes a filter that falls back to unset instead of writing it empty', () => {
    expect(written('vehicle=v1', { vehicle: 'all' })).toBe('');
    expect(written('search=WB25', { search: '' })).toBe('');
  });

  it('choosing a quick range retires the picked dates', () => {
    expect(written('from=2026-08-01&to=2026-08-31', { dates: '7DAYS' })).toBe('dates=7DAYS');
  });

  it('picking dates retires the quick range', () => {
    expect(written('dates=30DAYS', { from: '2026-08-01', to: '2026-08-31' })).toBe(
      'from=2026-08-01&to=2026-08-31',
    );
  });

  it('never leaves an empty value in the query', () => {
    REPORT_FILTER_PARAMS.forEach((key) => {
      expect(written(`${key}=something`, { [key]: '' })).toBe('');
    });
  });
});

describe('resolveRange', () => {
  it('is empty when nothing narrows the dates, so a bare report stays unbounded', () => {
    expect(resolveRange(at(''), NOW)).toEqual({ from: '', to: '' });
  });

  it('expands a quick range into calendar days', () => {
    expect(resolveRange(at('dates=7DAYS'), NOW)).toEqual({
      from: '2026-10-03',
      to: '2026-10-09',
    });
    expect(resolveRange(at('dates=MONTH'), NOW)).toEqual({
      from: '2026-10-01',
      to: '2026-10-09',
    });
  });

  it('prefers picked dates over a quick range', () => {
    expect(resolveRange(at('dates=7DAYS&from=2026-08-01&to=2026-08-31'), NOW)).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
    });
  });

  it('ignores a half-picked or back-to-front range', () => {
    expect(resolveRange(at('from=2026-08-01'), NOW)).toEqual({ from: '', to: '' });
    expect(resolveRange(at('from=2026-08-31&to=2026-08-01'), NOW)).toEqual({ from: '', to: '' });
  });
});

describe('activePresetId', () => {
  it('is the quick range while one is showing', () => {
    expect(activePresetId(at('dates=30DAYS'))).toBe('30DAYS');
  });

  it('is null once dates are picked by hand', () => {
    expect(activePresetId(at('dates=30DAYS&from=2026-08-01&to=2026-08-31'))).toBeNull();
    expect(activePresetId(at(''))).toBeNull();
  });
});

describe('countActiveFilters', () => {
  it('counts nothing on a bare report', () => {
    expect(countActiveFilters(at(''), NOW)).toBe(0);
  });

  it('counts a quick range once, not twice', () => {
    expect(countActiveFilters(at('dates=30DAYS'), NOW)).toBe(1);
  });

  it('counts each narrowing control', () => {
    expect(
      countActiveFilters(at('dates=7DAYS&search=WB&vehicle=v1&driver=d1&status=ONGOING'), NOW),
    ).toBe(5);
  });
});

describe('toRequestParams', () => {
  it('sends nothing for an unfiltered report', () => {
    expect(toRequestParams(at(''), NOW)).toEqual({});
  });

  it('sends IST day bounds with an explicit offset', () => {
    expect(toRequestParams(at('dates=7DAYS'), NOW)).toEqual({
      startDate: '2026-10-03T00:00:00.000+05:30',
      endDate: '2026-10-09T23:59:59.999+05:30',
    });
  });

  it('names the entity filters the way the reports API expects', () => {
    expect(toRequestParams(at('vehicle=v1&driver=d1&search=WB&status=ONGOING'), NOW)).toEqual({
      search: 'WB',
      vehicleId: 'v1',
      driverId: 'd1',
      status: 'ONGOING',
    });
  });

  it('never sends the unset entity sentinel', () => {
    expect(toRequestParams(at('vehicle=all&driver=all'), NOW)).toEqual({});
  });
});

describe('manufacturer URL contract', () => {
  it('preserves the maker across report switches and sends one scalar parameter', () => {
    const params = writeFilterParams('report=vehicle&manufacturer=ASHOK+LEYLAND', {
      search: 'WB11',
    });
    params.set('report', 'driver');
    const filters = readFilterParams(params);
    expect(filters.manufacturer).toBe('ASHOK LEYLAND');
    expect(toRequestParams(filters, NOW)).toMatchObject({
      manufacturer: 'ASHOK LEYLAND',
      search: 'WB11',
    });
    expect(countActiveFilters(filters, NOW)).toBe(2);
  });
  it('reset removes the manufacturer without removing the chosen report', () => {
    const next = writeFilterParams('report=mileageIntervals&manufacturer=TATA', EMPTY_FILTERS);
    expect(next.toString()).toBe('report=mileageIntervals');
    expect(toRequestParams(readFilterParams(next), NOW)).not.toHaveProperty('manufacturer');
  });
});
