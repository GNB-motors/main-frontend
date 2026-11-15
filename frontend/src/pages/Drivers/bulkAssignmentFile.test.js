import { describe, it, expect } from 'vitest';
import {
  assignmentTable,
  assignmentRows,
  maskAadhaar,
  reportRowView,
  rowCandidates,
} from './bulkAssignmentFile';

describe('bulk allocation spreadsheet mapping', () => {
  it('sends every mapped person column with the vehicle and keeps row numbers', () => {
    const table = assignmentTable([
      ['Name', 'Vehicle', 'Mobile', 'DL Number', 'Aadhaar'],
      ['Anil', ' WB01AB1234 ', '9876543210', 'DL123', '123456789012'],
      ['', '', '', '', ''],
      ['Sunil', 'WB01AB1235', '9876543211', 'DL124', '123456789013'],
    ]);
    expect(
      assignmentRows(table.rows, {
        name: '0',
        phone: '2',
        licence: '3',
        aadhaar: '4',
        vehicle: '1',
      }),
    ).toEqual([
      {
        rowNumber: 2,
        name: 'Anil',
        phone: '9876543210',
        licence: 'DL123',
        aadhaar: '123456789012',
        vehicle: 'WB01AB1234',
      },
      {
        rowNumber: 4,
        name: 'Sunil',
        phone: '9876543211',
        licence: 'DL124',
        aadhaar: '123456789013',
        vehicle: 'WB01AB1235',
      },
    ]);
  });
  it('leaves unmapped person columns empty and keeps numeric phones', () => {
    const table = assignmentTable([
      ['Mobile', 'Vehicle'],
      [9876543210, 'WB01'],
      ['', 'WB02'],
    ]);
    const rows = assignmentRows(table.rows, { phone: '0', vehicle: '1' });
    expect(rows[0]).toEqual({
      rowNumber: 2,
      name: '',
      phone: '9876543210',
      licence: '',
      aadhaar: '',
      vehicle: 'WB01',
    });
    expect(rows[1].phone).toBe('');
  });
  it('adds the driver the manager picked, and nothing else', () => {
    const table = assignmentTable([
      ['Mobile', 'Vehicle'],
      ['9876543210', 'WB01'],
    ]);
    const rows = assignmentRows(table.rows, { phone: '0', vehicle: '1' }, { 2: 'user-1' });
    expect(rows[0]).toEqual({
      rowNumber: 2,
      name: '',
      phone: '9876543210',
      licence: '',
      aadhaar: '',
      vehicle: 'WB01',
      userId: 'user-1',
    });
  });
  it('does not lose duplicate or unnamed headers', () => {
    expect(
      assignmentTable([
        ['Name', 'Name', ''],
        ['a', 'b', 'c'],
      ]).headers,
    ).toEqual([
      { index: 0, label: 'Name' },
      { index: 1, label: 'Name' },
      { index: 2, label: 'Column 3' },
    ]);
  });
  it('rejects empty or oversized sheets rather than truncating silently', () => {
    expect(() => assignmentTable([])).toThrow();
    expect(() => assignmentTable([['Mobile', 'Vehicle']])).toThrow();
    expect(() =>
      assignmentTable([['Mobile', 'Vehicle'], ...Array(501).fill(['9876543210', 'WB01'])]),
    ).toThrow('500');
  });
});

describe('bulk assignment report', () => {
  it('never shows a full Aadhaar number', () => {
    expect(maskAadhaar('123456789012')).toBe('XXXX9012');
    expect(maskAadhaar('')).toBe('');
    const view = reportRowView({ rowNumber: 2, aadhaar: '123456789012' });
    expect(view.aadhaar).toBe('XXXX9012');
    expect(view.aadhaar).not.toContain('123456789012');
  });
  it('reads the drivers the server is unsure between', () => {
    const candidates = rowCandidates({
      code: 'did_you_mean',
      candidates: [
        { userId: 'u1', name: 'Anil Das', phone: '9876543210', matched: ['name', 'phone'] },
        { name: 'No id' },
      ],
    });
    expect(candidates).toEqual([
      { userId: 'u1', name: 'Anil Das', phone: '9876543210', matched: ['name', 'phone'] },
    ]);
  });
});
