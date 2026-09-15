import { describe, it, expect } from 'vitest';
import {
  normalizeVehicle,
  buildAccountMap,
  filterVehicles,
  describeFleetEdgeAccount,
  VEHICLE_EXPORT_COLUMNS,
  mapVehicleForExport,
  vehicleExportMeta,
} from './vehicleList';

const apiVehicle = {
  _id: 'veh-1',
  registrationNumber: 'KA-01-AB-1234',
  vehicleType: 'TRUCK',
  chassisNumber: 'CHS-987',
  model: 'Volvo FH16',
  status: 'ACTIVE',
  inventory: [{ item: 'spare' }],
  manufacturer: 'VOLVO',
  vehicleCategory: 'HEAVY',
  classification: 'OWNED',
  fleetEdgeAccountId: 'acc-9',
  branchStatus: 'ACTIVE',
  isImported: true,
};

describe('normalizeVehicle', () => {
  it('maps camelCase API fields to snake_case UI shape', () => {
    const v = normalizeVehicle(apiVehicle);
    expect(v.id).toBe('veh-1');
    expect(v.registration_no).toBe('KA-01-AB-1234');
    expect(v.vehicle_type).toBe('TRUCK');
    expect(v.chassis_number).toBe('CHS-987');
    expect(v.model).toBe('Volvo FH16');
    expect(v.manufacturer).toBe('VOLVO');
    expect(v.vehicleCategory).toBe('HEAVY');
    expect(v.fleetEdgeAccountId).toBe('acc-9');
    expect(v.branchStatus).toBe('ACTIVE');
    expect(v.isImported).toBe(true);
  });

  it('fills missing fields with safe defaults', () => {
    const v = normalizeVehicle({});
    expect(v.id).toBeUndefined();
    expect(v.vehicle_type).toBe('');
    expect(v.chassis_number).toBe('');
    expect(v.model).toBe('');
    expect(v.inventory).toEqual([]);
    expect(v.manufacturer).toBeNull();
    expect(v.fleetEdgeAccountId).toBeNull();
  });

  it('falls back to snake_case fields when camelCase absent', () => {
    const v = normalizeVehicle({
      id: 'x',
      registration_no: 'OLD-1',
      vehicle_type: 'VAN',
      chassis_number: 'C1',
    });
    expect(v.id).toBe('x');
    expect(v.registration_no).toBe('OLD-1');
    expect(v.vehicle_type).toBe('VAN');
    expect(v.chassis_number).toBe('C1');
  });
});

describe('buildAccountMap', () => {
  it('keys accounts by stringified _id', () => {
    const map = buildAccountMap([{ _id: 42, friendlyName: 'Hub A' }]);
    expect(map['42'].friendlyName).toBe('Hub A');
  });

  it('tolerates null/undefined input', () => {
    expect(buildAccountMap(null)).toEqual({});
    expect(buildAccountMap(undefined)).toEqual({});
  });
});

describe('filterVehicles', () => {
  const vehicles = [
    { id: '1', registration_no: 'KA-01-AB-1234', fleetEdgeAccountId: 'acc-9' },
    { id: '2', registration_no: 'MH-02-CD-5678', fleetEdgeAccountId: null },
    { id: '3', registration_no: 'KA-03-EF-9012', fleetEdgeAccountId: 'acc-7' },
  ];

  it('returns everything for empty filters', () => {
    expect(filterVehicles(vehicles, {})).toHaveLength(3);
    expect(filterVehicles(null, {})).toEqual([]);
  });

  it('filters by registration substring, case-insensitive', () => {
    expect(filterVehicles(vehicles, { search: 'ka-0' })).toHaveLength(2);
    expect(filterVehicles(vehicles, { search: '  mh  ' })).toHaveLength(1);
    expect(filterVehicles(vehicles, { search: 'DL' })).toHaveLength(0);
  });

  it('filters untagged vehicles', () => {
    const result = filterVehicles(vehicles, { accountFilter: 'untagged' });
    expect(result.map((v) => v.id)).toEqual(['2']);
  });

  it('filters by specific account id', () => {
    const result = filterVehicles(vehicles, { accountFilter: 'acc-7' });
    expect(result.map((v) => v.id)).toEqual(['3']);
  });
});

describe('describeFleetEdgeAccount', () => {
  const map = buildAccountMap([
    {
      _id: 'acc-9',
      friendlyName: 'Hub A',
      source: 'lemu',
      externalAccountId: 'EXT-1',
      status: 'ACTIVE',
    },
    { _id: 'acc-7', externalAccountId: 'EXT-7', source: 'lemu', status: 'DISABLED' },
  ]);

  it('returns untagged for vehicles without an account', () => {
    expect(describeFleetEdgeAccount({ fleetEdgeAccountId: null }, map)).toEqual({ tagged: false });
  });

  it('resolves friendlyName and disabled state', () => {
    const a = describeFleetEdgeAccount({ fleetEdgeAccountId: 'acc-9' }, map);
    expect(a.tagged).toBe(true);
    expect(a.label).toBe('Hub A');
    expect(a.isDisabled).toBe(false);
    expect(a.tip).toContain('EXT-1');
  });

  it('falls back to externalAccountId and flags disabled', () => {
    const a = describeFleetEdgeAccount({ fleetEdgeAccountId: 'acc-7' }, map);
    expect(a.label).toBe('EXT-7');
    expect(a.isDisabled).toBe(true);
  });

  it('falls back to id tail for unknown accounts', () => {
    const a = describeFleetEdgeAccount({ fleetEdgeAccountId: 'acc-unknown-123456' }, map);
    expect(a.label).toBe('123456');
    expect(a.tip).toBe('');
    expect(a.isDisabled).toBe(false);
  });
});

describe('vehicle export', () => {
  it('has plain-text columns (no typed numerics on this page)', () => {
    expect(VEHICLE_EXPORT_COLUMNS.map((c) => c.key)).toEqual([
      'registration_no',
      'model',
      'manufacturer',
      'vehicleCategory',
      'chassis_number',
      'fleetEdgeAccount',
    ]);
  });

  it('maps rows, resolving account labels and UNKNOWN placeholders', () => {
    const map = buildAccountMap([
      { _id: 'acc-9', friendlyName: 'Hub A', source: 'lemu', externalAccountId: 'EXT-1' },
    ]);
    const row = mapVehicleForExport(
      {
        registration_no: 'KA-01',
        model: '',
        manufacturer: 'UNKNOWN',
        vehicleCategory: 'HEAVY',
        chassis_number: '',
        fleetEdgeAccountId: 'acc-9',
      },
      map,
    );
    expect(row).toEqual({
      registration_no: 'KA-01',
      model: 'N/A',
      manufacturer: '—',
      vehicleCategory: 'HEAVY',
      chassis_number: 'N/A',
      fleetEdgeAccount: 'Hub A',
    });
  });

  it('marks untagged vehicles in exports', () => {
    const row = mapVehicleForExport({ registration_no: 'KA-02', fleetEdgeAccountId: null }, {});
    expect(row.fleetEdgeAccount).toBe('untagged');
  });
});

describe('vehicleExportMeta', () => {
  it('describes search and account filters', () => {
    const meta = vehicleExportMeta({ search: 'KA', accountFilter: 'untagged' });
    expect(meta.filters).toEqual([
      { label: 'Search', value: 'KA' },
      { label: 'FleetEdge account', value: 'Untagged' },
    ]);
    expect(meta.generatedAt).toBeInstanceOf(Date);
  });

  it('resolves account names and omits empty filters', () => {
    const map = buildAccountMap([{ _id: 'a1', friendlyName: 'Hub A' }]);
    const meta = vehicleExportMeta({ search: '', accountFilter: 'a1', accountMap: map });
    expect(meta.filters).toEqual([{ label: 'FleetEdge account', value: 'Hub A' }]);
    expect(vehicleExportMeta({}).filters).toEqual([]);
  });
});
