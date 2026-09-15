import {
  normalizeVehicleDataset,
  normalizeDriverDataset,
  normalizeVehicleRow,
  normalizeDriverRow,
  validateVehicleRow,
  validateDriverRow,
  dedupeRows,
  dedupeRowsByContent,
} from './bulkNormalization.js';

describe('bulkNormalization.js — bulk upload column detection and normalization', () => {
  describe('normalizeVehicleDataset', () => {
    it('maps aliased headers and standardizes registration/chassis', () => {
      const rows = [
        {
          'Reg No': 'ka 01 ab 1234',
          'Vehicle Model': '  Tata  407   truck ',
          VIN: 'mat45504c8c12345',
          Year: '2019',
        },
      ];
      const out = normalizeVehicleDataset(rows);
      expect(out).toHaveLength(1);
      expect(out[0].registration_no).toBe('KA01AB1234');
      expect(out[0].model).toBe('Tata 407 truck');
      expect(out[0].chassis_number).toBe('MAT45504C8C12345');
      // unmapped columns land in extra (stringified, trimmed)
      expect(out[0].extra).toEqual({ Year: '2019' });
    });

    it('detects columns by content when headers are meaningless', () => {
      const rows = [
        { col1: 'KA01AB1234', col2: 'MAT45504C8C12345', col3: 'Tata 407 truck' },
        { col1: 'KA02CD5678', col2: 'MAT45504C8C99999', col3: 'Eicher van' },
      ];
      const out = normalizeVehicleDataset(rows);
      expect(out[0].registration_no).toBe('KA01AB1234');
      expect(out[0].chassis_number).toBe('MAT45504C8C12345');
      expect(out[0].model).toBe('Tata 407 truck');
    });

    it('falls back to empty strings when no column maps', () => {
      const out = normalizeVehicleDataset([{ foo: 'bar' }]);
      expect(out[0]).toEqual({
        registration_no: '',
        model: '',
        chassis_number: '',
        extra: { foo: 'bar' },
      });
    });

    it('treats null/undefined cells as empty strings', () => {
      const out = normalizeVehicleDataset([
        {
          'Registration Number': null,
          Model: undefined,
          Chassis: 123,
        },
      ]);
      expect(out[0].registration_no).toBe('');
      expect(out[0].model).toBe('');
      expect(out[0].chassis_number).toBe('123');
    });
  });

  describe('normalizeDriverDataset', () => {
    it('normalizes name, role and vehicle registration', () => {
      const rows = [
        {
          'Driver Name': '  ramesh   kumar ',
          Designation: 'SENIOR DRIVER',
          Vehicle: 'KA01AB1234',
        },
      ];
      const out = normalizeDriverDataset(rows);
      expect(out[0].name).toBe('Ramesh Kumar');
      expect(out[0].role).toBe('Senior driver');
      expect(out[0].vehicle_registration_no).toBe('KA01AB1234');
    });

    it('defaults a missing role to Employee', () => {
      const out = normalizeDriverDataset([{ name: 'Suresh' }]);
      expect(out[0].role).toBe('Employee');
      expect(out[0].name).toBe('Suresh');
      expect(out[0].vehicle_registration_no).toBe('');
    });
  });

  describe('single-row compat helpers', () => {
    it('normalizeVehicleRow matches dataset normalization', () => {
      const row = { 'Reg No': 'ka 01 ab 1234', Model: 'Tata truck', Chassis: 'abc123' };
      expect(normalizeVehicleRow(row)).toEqual(normalizeVehicleDataset([row])[0]);
    });

    it('normalizeDriverRow matches dataset normalization', () => {
      const row = { name: 'ramesh kumar', role: 'driver' };
      expect(normalizeDriverRow(row)).toEqual(normalizeDriverDataset([row])[0]);
    });
  });

  describe('validateVehicleRow', () => {
    it('accepts a fully valid row', () => {
      expect(
        validateVehicleRow({
          registration_no: 'KA01AB1234',
          model: 'Tata 407',
          chassis_number: 'MAT123456',
        }),
      ).toEqual([]);
    });

    it('flags short registration, missing model, short chassis', () => {
      const issues = validateVehicleRow({
        registration_no: 'AB1',
        model: 'x',
        chassis_number: 'abc',
      });
      expect(issues).toHaveLength(3);
    });

    it('flags empty fields', () => {
      const issues = validateVehicleRow({});
      expect(issues).toHaveLength(3);
    });
  });

  describe('validateDriverRow', () => {
    it('accepts a valid driver', () => {
      expect(validateDriverRow({ name: 'Ramesh Kumar', role: 'Driver' })).toEqual([]);
    });

    it('flags a short name', () => {
      expect(validateDriverRow({ name: 'R' })[0]).toMatch(/at least 2 characters/);
    });

    it('flags an invalid vehicle registration when present', () => {
      const issues = validateDriverRow({ name: 'Ramesh', vehicle_registration_no: 'AB' });
      expect(issues).toHaveLength(1);
    });

    it('allows an empty vehicle registration', () => {
      expect(validateDriverRow({ name: 'Ramesh', vehicle_registration_no: '' })).toEqual([]);
    });

    it('rejects the Super Admin role in bulk uploads', () => {
      const issues = validateDriverRow({ name: 'Ramesh', role: 'Super Admin' });
      expect(issues[0]).toMatch(/Super Admin/);
    });
  });

  describe('dedupe helpers', () => {
    it('dedupeRows keeps the first row per key value and keeps empties', () => {
      const rows = [{ reg: 'A' }, { reg: 'A' }, { reg: '' }, { reg: 'B' }, { reg: '' }];
      expect(dedupeRows(rows, 'reg')).toEqual([
        { reg: 'A' },
        { reg: '' },
        { reg: 'B' },
        { reg: '' },
      ]);
    });

    it('dedupeRowsByContent drops exact duplicate rows only', () => {
      const rows = [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
        { a: 1, b: 2 },
      ];
      expect(dedupeRowsByContent(rows)).toEqual([
        { a: 1, b: 2 },
        { a: 1, b: 3 },
      ]);
    });
  });
});
