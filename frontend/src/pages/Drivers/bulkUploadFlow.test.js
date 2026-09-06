import { describe, it, expect } from 'vitest';
import {
  applyColumnMapping,
  filterRowsByStatus,
  summarizeRowErrors,
  buildEmployeesPayload,
  buildCredentialsCsv,
  MAX_ROWS,
} from './bulkUploadFlow';

const validMapping = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  role: 'Role',
  location: 'Location',
};

describe('applyColumnMapping', () => {
  it('normalizes raw spreadsheet rows into employee rows with passwords', () => {
    const rawRows = [
      {
        Name: 'Asha Singh',
        Phone: '9876543210',
        Email: 'Asha@Example.com',
        Role: 'manager',
        Location: 'Delhi',
      },
    ];

    const { normalized, errors, passwordMap } = applyColumnMapping(rawRows, validMapping);

    expect(normalized).toHaveLength(1);
    const row = normalized[0];
    expect(row.clientRowId).toMatch(/^row-\d+-0$/);
    expect(row.firstName).toBe('Asha');
    expect(row.lastName).toBe('Singh');
    expect(row.email).toBe('asha@example.com');
    expect(row.mobileNumber).toBe('+919876543210');
    expect(row.location).toBe('Delhi');
    expect(row.role).toBe('MANAGER');
    expect(row.password).toHaveLength(12);
    expect(passwordMap.get(row.clientRowId)).toBe(row.password);
    expect(row._rawRow).toBe(rawRows[0]);
    expect(row._index).toBe(0);
    expect(errors[0]).toEqual({});
  });

  it('defaults missing optional fields and flags required-field errors', () => {
    const rawRows = [{ Name: '', Phone: 'abc' }];

    const { normalized, errors } = applyColumnMapping(rawRows, validMapping);

    expect(normalized[0].location).toBe('Kolkata');
    expect(normalized[0].role).toBe('DRIVER');
    expect(normalized[0].email).toBeNull();
    expect(normalized[0].mobileNumber).toBeNull();
    expect(errors[0].firstName).toBeTruthy();
    expect(errors[0].mobileNumber).toBeTruthy();
  });

  it('handles numeric phone cells from Excel', () => {
    const { normalized } = applyColumnMapping([{ Name: 'Ram', Phone: 9876543210 }], {
      name: 'Name',
      phone: 'Phone',
    });
    expect(normalized[0].mobileNumber).toBe('+919876543210');
  });

  it('generates distinct clientRowIds per row', () => {
    const rawRows = [{ Name: 'A' }, { Name: 'B' }];
    const { normalized } = applyColumnMapping(rawRows, validMapping);
    expect(new Set(normalized.map((r) => r.clientRowId)).size).toBe(2);
  });
});

describe('filterRowsByStatus', () => {
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const errors = [{}, { firstName: 'required' }, {}];

  it('returns all rows for the all filter', () => {
    expect(filterRowsByStatus(rows, errors, 'all')).toHaveLength(3);
  });

  it('returns only invalid rows for the error filter', () => {
    expect(filterRowsByStatus(rows, errors, 'error')).toEqual([{ id: 2 }]);
  });

  it('returns only valid rows for the valid filter', () => {
    expect(filterRowsByStatus(rows, errors, 'valid')).toEqual([{ id: 1 }, { id: 3 }]);
  });
});

describe('summarizeRowErrors', () => {
  it('counts valid and error rows', () => {
    const rows = [{}, {}, {}];
    const errors = [{}, { phone: 'bad' }, {}];
    expect(summarizeRowErrors(rows, errors)).toEqual({ errorCount: 1, validCount: 2 });
  });
});

describe('buildEmployeesPayload', () => {
  it('strips internal fields and keeps null emails', () => {
    const payload = buildEmployeesPayload([
      {
        clientRowId: 'r1',
        firstName: 'A',
        lastName: 'B',
        email: null,
        mobileNumber: '+91x',
        location: 'Kolkata',
        password: 'p',
        role: 'DRIVER',
        _rawRow: { secret: true },
        _index: 0,
      },
    ]);
    expect(payload).toEqual([
      {
        clientRowId: 'r1',
        firstName: 'A',
        lastName: 'B',
        email: null,
        mobileNumber: '+91x',
        location: 'Kolkata',
        password: 'p',
        role: 'DRIVER',
      },
    ]);
  });
});

describe('buildCredentialsCsv', () => {
  it('joins created rows with passwords and escapes CSV values', () => {
    const passwordMap = new Map([
      ['r1', 'pw,1'],
      ['r2', 'pw2'],
    ]);
    const { csvContent } = buildCredentialsCsv(
      [
        {
          clientRowId: 'r1',
          firstName: 'A',
          lastName: 'B',
          email: null,
          mobileNumber: '1',
          role: 'DRIVER',
          location: null,
        },
        {
          clientRowId: 'r2',
          firstName: 'C, D',
          lastName: 'E',
          email: 'c@d.e',
          mobileNumber: '2',
          role: 'MANAGER',
          location: 'Pune',
        },
      ],
      passwordMap,
    );

    const lines = csvContent.split('\n');
    expect(lines[0]).toBe('firstName,lastName,email,mobileNumber,role,location,password');
    expect(lines[1]).toBe('A,B,,1,DRIVER,,"pw,1"');
    expect(lines[2]).toBe('"C, D",E,c@d.e,2,MANAGER,Pune,pw2');
  });

  it('falls back to N/A when the password is missing and dates the filename', () => {
    const { csvContent, fileName } = buildCredentialsCsv(
      [{ clientRowId: 'missing', firstName: 'A', lastName: 'B' }],
      new Map(),
    );
    expect(csvContent.split('\n')[1]).toContain('N/A');
    expect(fileName).toMatch(/^employee-credentials-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('MAX_ROWS', () => {
  it('caps files at 500 rows', () => {
    expect(MAX_ROWS).toBe(500);
  });
});
