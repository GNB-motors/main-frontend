import { describe, it, expect } from 'vitest';
import { assignmentTable, assignmentRows } from './bulkAssignmentFile';

describe('bulk allocation spreadsheet mapping', () => {
  it('maps only two selected columns and preserves physical row numbers', () => {
    const table = assignmentTable([
      ['Name', 'Vehicle', 'Mobile', 'Salary'],
      ['Anil', ' WB01AB1234 ', '9876543210', 50000],
      ['', '', '', ''],
      ['Sunil', 'WB01AB1235', '9876543211', 60000],
    ]);
    expect(assignmentRows(table.rows, '2', '1')).toEqual([
      { rowNumber: 2, employee: '9876543210', vehicle: 'WB01AB1234' },
      { rowNumber: 4, employee: '9876543211', vehicle: 'WB01AB1235' },
    ]);
  });
  it('preserves blank required cells for server row errors and handles numeric phones', () => {
    const table = assignmentTable([
      ['Mobile', 'Vehicle'],
      [9876543210, 'WB01'],
      ['', 'WB02'],
    ]);
    expect(assignmentRows(table.rows, '0', '1')[0].employee).toBe('9876543210');
    expect(assignmentRows(table.rows, '0', '1')[1].employee).toBe('');
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
