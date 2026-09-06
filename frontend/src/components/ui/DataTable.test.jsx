import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import DataTable from './DataTable';

const COLUMNS = [
  { key: 'plate', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
];

const ROWS = [
  { _id: 'a1', plate: 'WB 23 F 4821', driver: 'Rakesh Yadav' },
  { _id: 'b2', plate: 'DL 1 GC 9902', driver: 'Not assigned' },
];

function renderTable(extraProps = {}) {
  return render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r._id} {...extraProps} />);
}

describe('DataTable rowClassName', () => {
  it('marks only the row whose predicate matches as selected', () => {
    const { container } = renderTable({
      rowClassName: (row) => (row._id === 'b2' ? 'dt-row--selected' : ''),
    });
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(2);
    expect(bodyRows[0].className).toBe('dt-row');
    expect(bodyRows[1].className).toBe('dt-row dt-row--selected');
  });

  it('renders plain rows when no rowClassName is given', () => {
    const { container } = renderTable();
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows[0].className).toBe('dt-row');
    expect(bodyRows[1].className).toBe('dt-row');
  });
});
