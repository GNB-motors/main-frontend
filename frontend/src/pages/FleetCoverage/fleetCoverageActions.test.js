import { describe, it, expect } from 'vitest';
import {
  ADD_TO_FLEET_ROLES,
  isAddableRegistration,
  toVehiclePayload,
  edgeRowKey,
  selectedRowsFrom,
} from './fleetCoverageActions';

describe('fleetCoverageActions', () => {
  describe('ADD_TO_FLEET_ROLES', () => {
    it('matches the OWNER/MANAGER authorize() guard on the vehicles endpoints', () => {
      expect(ADD_TO_FLEET_ROLES).toEqual(['OWNER', 'MANAGER']);
    });
  });

  describe('isAddableRegistration', () => {
    it('accepts a real registration number', () => {
      expect(isAddableRegistration('MH12AB1234')).toBe(true);
    });

    it('rejects "NA" case-insensitively', () => {
      expect(isAddableRegistration('NA')).toBe(false);
      expect(isAddableRegistration('na')).toBe(false);
      expect(isAddableRegistration('  Na  ')).toBe(false);
    });

    // FleetEdge also fills placeholders like "TEMP" for trucks still on a
    // temporary number; two of them would collide on the unique registration.
    it('rejects FleetEdge placeholders: TEMP, NIL, NULL, NONE, dashes, zeros', () => {
      for (const reg of ['TEMP', 'temp', 'TEMP-1', 'NIL', 'NULL', 'NONE', '-', '--', '0', '000']) {
        expect(isAddableRegistration(reg)).toBe(false);
      }
    });

    it('still accepts real plates that merely contain those letters', () => {
      for (const reg of ['WB11T0662', 'MH12NA1234', 'KA01TE1234']) {
        expect(isAddableRegistration(reg)).toBe(true);
      }
    });

    it('rejects "N/A"', () => {
      expect(isAddableRegistration('N/A')).toBe(false);
    });

    it('rejects blank, null and undefined', () => {
      expect(isAddableRegistration('')).toBe(false);
      expect(isAddableRegistration('   ')).toBe(false);
      expect(isAddableRegistration(null)).toBe(false);
      expect(isAddableRegistration(undefined)).toBe(false);
    });
  });

  describe('toVehiclePayload', () => {
    it('maps a coverage row to the createVehicle/createVehiclesBulk shape, VIN as chassisNumber', () => {
      const row = {
        registrationNumber: 'MH12AB1234',
        vehicleModel: 'LPT 3118',
        manufacturer: 'TATA',
        vin: 'VIN12345678901234',
        fuelType: 'DIESEL', // not part of the vehicle payload — must be dropped
      };
      expect(toVehiclePayload(row)).toEqual({
        registrationNumber: 'MH12AB1234',
        model: 'LPT 3118',
        manufacturer: 'TATA',
        chassisNumber: 'VIN12345678901234',
      });
    });

    it('omits (not nulls) missing model/manufacturer/vin so the API defaults apply', () => {
      const payload = toVehiclePayload({ registrationNumber: 'MH12AB1234' });
      expect(payload.model).toBeUndefined();
      expect(payload.manufacturer).toBeUndefined();
      expect(payload.chassisNumber).toBeUndefined();
      expect('model' in payload).toBe(true);
    });
  });

  describe('edgeRowKey', () => {
    it('uses the registration number when present', () => {
      expect(edgeRowKey({ registrationNumber: 'MH12AB1234' }, 3)).toBe('MH12AB1234');
    });

    it('falls back to a position-based key when registration is missing, so rows stay distinguishable', () => {
      expect(edgeRowKey({ registrationNumber: null }, 0)).toBe('_no-reg-0');
      expect(edgeRowKey({ registrationNumber: null }, 1)).toBe('_no-reg-1');
    });
  });

  describe('selectedRowsFrom', () => {
    const rows = [
      { registrationNumber: 'MH12AB1234' },
      { registrationNumber: 'MH12CD5678' },
      { registrationNumber: null },
    ];

    it('returns only the rows whose key is in the selection set', () => {
      const selected = selectedRowsFrom(rows, new Set(['MH12CD5678']));
      expect(selected).toEqual([{ registrationNumber: 'MH12CD5678' }]);
    });

    it('resolves the position-based key for a row with no registration', () => {
      const selected = selectedRowsFrom(rows, new Set(['_no-reg-2']));
      expect(selected).toEqual([{ registrationNumber: null }]);
    });

    it('returns an empty array when nothing is selected', () => {
      expect(selectedRowsFrom(rows, new Set())).toEqual([]);
    });

    it('preserves row order regardless of selection insertion order', () => {
      const selected = selectedRowsFrom(rows, new Set(['MH12CD5678', 'MH12AB1234']));
      expect(selected.map((r) => r.registrationNumber)).toEqual(['MH12AB1234', 'MH12CD5678']);
    });
  });
});

describe('displayValue', () => {
  it('shows the literal NA and blanks as an em dash', async () => {
    const { displayValue } = await import('./fleetCoverageActions');
    expect(displayValue('NA')).toBe('—');
    expect(displayValue(' n/a ')).toBe('—');
    expect(displayValue('')).toBe('—');
    expect(displayValue(null)).toBe('—');
    expect(displayValue('TATA')).toBe('TATA');
  });
});
