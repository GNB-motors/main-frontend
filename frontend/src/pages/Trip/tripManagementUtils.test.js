import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  formatJourneyDate,
  filterTrips,
  renderPageItems,
} from './tripManagementUtils';

describe('getStatusColor', () => {
  it('maps known statuses to their colors', () => {
    expect(getStatusColor('COMPLETED')).toBe('#4caf50');
    expect(getStatusColor('ONGOING')).toBe('#ff9800');
    expect(getStatusColor('CANCELLED')).toBe('#f44336');
  });

  it('falls back to grey for an unknown status', () => {
    expect(getStatusColor('WEIRD_STATE')).toBe('#757575');
    expect(getStatusColor(undefined)).toBe('#757575');
  });
});

describe('formatJourneyDate', () => {
  it('returns a dash for a missing date', () => {
    expect(formatJourneyDate(null)).toBe('-');
    expect(formatJourneyDate(undefined)).toBe('-');
  });

  it('formats a date as "Mon D, YYYY"', () => {
    expect(formatJourneyDate('2026-03-05T10:00:00.000Z')).toBe('Mar 5, 2026');
  });
});

describe('filterTrips', () => {
  const weightSlipTrip = {
    _id: 'ws1',
    journeyId: {
      vehicleId: { registrationNumber: 'JH02BX1429' },
      driverId: { firstName: 'Ravi', lastName: 'Kumar' },
    },
    routeData: { name: 'Ranchi Loop' },
    materialType: 'Coal',
  };
  const refuelTrip = {
    _id: 'rf1',
    vehicleId: { registrationNumber: 'JH02BX4980' },
    driverId: { firstName: 'Suresh', lastName: 'Yadav' },
  };

  it('returns all trips when there is no search query', () => {
    expect(filterTrips([weightSlipTrip], '', 'trips')).toEqual([weightSlipTrip]);
    expect(filterTrips([refuelTrip], '', 'refuel')).toEqual([refuelTrip]);
  });

  it('matches weight-slip trips on vehicle, driver, route or material', () => {
    expect(filterTrips([weightSlipTrip], 'jh02bx1429', 'trips')).toEqual([weightSlipTrip]);
    expect(filterTrips([weightSlipTrip], 'ravi', 'trips')).toEqual([weightSlipTrip]);
    expect(filterTrips([weightSlipTrip], 'ranchi', 'trips')).toEqual([weightSlipTrip]);
    expect(filterTrips([weightSlipTrip], 'coal', 'trips')).toEqual([weightSlipTrip]);
    expect(filterTrips([weightSlipTrip], 'no-match', 'trips')).toEqual([]);
  });

  it('matches refuel journeys on vehicle or driver only', () => {
    expect(filterTrips([refuelTrip], 'jh02bx4980', 'refuel')).toEqual([refuelTrip]);
    expect(filterTrips([refuelTrip], 'suresh', 'refuel')).toEqual([refuelTrip]);
    expect(filterTrips([refuelTrip], 'no-match', 'refuel')).toEqual([]);
  });
});

describe('renderPageItems', () => {
  it('lists every page when there are few pages', () => {
    expect(renderPageItems(3, 1)).toEqual([1, 2, 3]);
  });

  it('windows around the current page with a single ellipsis run', () => {
    expect(renderPageItems(10, 5)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });

  it('has no leading ellipsis when the current page is near the start', () => {
    expect(renderPageItems(10, 1)).toEqual([1, 2, '...', 10]);
  });

  it('has no trailing ellipsis when the current page is near the end', () => {
    expect(renderPageItems(10, 10)).toEqual([1, '...', 9, 10]);
  });
});
