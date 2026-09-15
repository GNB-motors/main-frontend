import { describe, it, expect } from 'vitest';
import {
  FIELD_AGENT_FUEL_PAGE_SIZE,
  toInputDate,
  fmtNum,
  fmtMoney,
  agentName,
  LOG_EXPORT_COLUMNS,
  buildLogExportRows,
  buildDefaultFilters,
  buildLogQueryParams,
  filterLogsByNeedle,
  countLogFilters,
  groupVehiclesByOrg,
} from './fieldAgentFuelLogUtils';

describe('fmtNum / fmtMoney', () => {
  it('renders null as a dash / zero rupees', () => {
    expect(fmtNum(null)).toBe('-');
    expect(fmtMoney(null)).toBe('₹0');
  });

  it('formats en-IN numbers and whole-rupee money', () => {
    expect(fmtNum(12345.678)).toBe('12,345.68');
    expect(fmtNum(12345.678, 0)).toBe('12,346');
    expect(fmtMoney(12345.6)).toBe('₹12,346');
  });
});

describe('agentName', () => {
  it('joins first and last name, falling back to dash', () => {
    expect(agentName({ firstName: 'Amit', lastName: 'Singh' })).toBe('Amit Singh');
    expect(agentName({ firstName: 'Amit' })).toBe('Amit');
    expect(agentName(null)).toBe('-');
  });
});

describe('buildDefaultFilters', () => {
  it('defaults to all vehicles over a 30-day window ending today', () => {
    const filters = buildDefaultFilters();
    expect(filters.vehicleId).toBe('');
    expect(filters.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(filters.to).toBe(toInputDate(new Date()));
    expect(new Date(filters.from).getTime()).toBeLessThanOrEqual(new Date(filters.to).getTime());
  });
});

describe('buildLogQueryParams', () => {
  it('passes page and limit, omitting empty filters', () => {
    const params = buildLogQueryParams({ filters: { vehicleId: '', from: '', to: '' }, page: 2 });
    expect(params).toEqual({
      vehicleId: undefined,
      from: undefined,
      to: undefined,
      page: 2,
      limit: FIELD_AGENT_FUEL_PAGE_SIZE,
    });
  });

  it('widens the date range to day bounds as UTC ISO strings', () => {
    const params = buildLogQueryParams({
      filters: { vehicleId: 'veh-1', from: '2026-08-01', to: '2026-08-31' },
      page: 1,
    });
    expect(params.vehicleId).toBe('veh-1');
    expect(params.from).toBe(new Date('2026-08-01T00:00:00').toISOString());
    expect(params.to).toBe(new Date('2026-08-31T23:59:59.999').toISOString());
  });
});

describe('filterLogsByNeedle', () => {
  const logs = [
    { vehicleId: { registrationNumber: 'KA-01-AB-1234' }, fuelType: 'DIESEL', location: 'HP Pump' },
    { vehicleId: { registrationNumber: 'MH-12-XY-9999' }, fuelType: 'ADBLUE', location: 'Depot' },
  ];

  it('returns the page untouched when the needle is blank', () => {
    expect(filterLogsByNeedle(logs, '   ')).toBe(logs);
  });

  it('matches case-insensitively across vehicle, fuel and location', () => {
    expect(filterLogsByNeedle(logs, 'ka-01')).toHaveLength(1);
    expect(filterLogsByNeedle(logs, 'adblue')).toHaveLength(1);
    expect(filterLogsByNeedle(logs, 'pump')).toHaveLength(1);
    expect(filterLogsByNeedle(logs, 'zzz')).toHaveLength(0);
  });
});

describe('countLogFilters', () => {
  it('counts the vehicle filter and a non-blank needle only', () => {
    expect(countLogFilters({ vehicleId: '' }, '')).toBe(0);
    expect(countLogFilters({ vehicleId: 'veh-1' }, '')).toBe(1);
    expect(countLogFilters({ vehicleId: '' }, ' hp ')).toBe(1);
    expect(countLogFilters({ vehicleId: 'veh-1' }, 'hp')).toBe(2);
  });
});

describe('groupVehiclesByOrg', () => {
  it('groups vehicles under their org name with an Unknown Org fallback', () => {
    const vehicles = [
      { _id: 'v1', orgId: { companyName: 'Acme' } },
      { _id: 'v2', orgId: { companyName: 'Acme' } },
      { _id: 'v3' },
    ];
    const groups = groupVehiclesByOrg(vehicles);
    expect(groups).toHaveLength(2);
    const acme = groups.find(([name]) => name === 'Acme');
    expect(acme[1]).toHaveLength(2);
    const unknown = groups.find(([name]) => name === 'Unknown Org');
    expect(unknown[1]).toHaveLength(1);
  });
});

describe('buildLogExportRows', () => {
  it('maps logs to the export column shape with fallbacks', () => {
    const rows = buildLogExportRows([
      {
        refuelTime: null,
        orgId: null,
        vehicleId: { registrationNumber: 'KA-01-AB-1234' },
        loggedBy: { firstName: 'Amit', lastName: 'Singh' },
        fuelType: 'DIESEL',
        fillingType: 'FULL_TANK',
        litres: 25,
        rate: 95,
        totalAmount: 2375,
        odometerReading: 105450,
        location: 'HP Pump',
        reviewStatus: 'NEEDS_REVIEW',
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].refuelTime).toBe('—');
    expect(rows[0].organization).toBe('Unknown');
    expect(rows[0].uploadedBy).toBe('Amit Singh');
    expect(rows[0].litres).toBe(25);
    expect(rows[0].location).toBe('HP Pump');
  });

  it('covers every export column key', () => {
    expect(LOG_EXPORT_COLUMNS.map((c) => c.key)).toEqual([
      'refuelTime',
      'organization',
      'vehicle',
      'uploadedBy',
      'fuelType',
      'fillingType',
      'litres',
      'rate',
      'totalAmount',
      'odometerReading',
      'location',
      'reviewStatus',
    ]);
  });
});
