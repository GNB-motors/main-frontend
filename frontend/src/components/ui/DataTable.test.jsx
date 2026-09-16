import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

describe('DataTable row selection (plan WS4)', () => {
  it('renders no selection column when selectable is not set', () => {
    const { container } = renderTable();
    expect(container.querySelector('.dt-th-select')).toBeNull();
    expect(container.querySelectorAll('tbody input[type="checkbox"]')).toHaveLength(0);
  });

  it('checking a row calls onSelectionChange with that row added to the set', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(),
      onSelectionChange,
    });
    const rowCheckboxes = container.querySelectorAll('tbody input[type="checkbox"]');
    fireEvent.click(rowCheckboxes[1]);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['b2']));
  });

  it('unchecking a selected row removes it from the set, leaving others untouched', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(['a1', 'b2']),
      onSelectionChange,
    });
    const rowCheckboxes = container.querySelectorAll('tbody input[type="checkbox"]');
    fireEvent.click(rowCheckboxes[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['b2']));
  });

  it('select-all only affects the currently visible (filtered) rows', () => {
    const onSelectionChange = vi.fn();
    // Simulate an active search filter down to a single row — selectedKeys
    // already carries a selection from a row that is no longer visible.
    const { container } = renderTable({
      rows: [ROWS[1]],
      selectable: true,
      selectedKeys: new Set(['a1']),
      onSelectionChange,
    });
    const headerCheckbox = container.querySelector('.dt-th-select input');
    fireEvent.click(headerCheckbox);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['a1', 'b2']));
  });

  it('header checkbox is indeterminate when some but not all visible rows are selected', () => {
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(['a1']),
      onSelectionChange: () => {},
    });
    const headerCheckbox = container.querySelector('.dt-th-select input');
    expect(headerCheckbox.indeterminate).toBe(true);
    expect(headerCheckbox.checked).toBe(false);
  });

  it('header checkbox is checked (not indeterminate) once every visible row is selected', () => {
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(['a1', 'b2']),
      onSelectionChange: () => {},
    });
    const headerCheckbox = container.querySelector('.dt-th-select input');
    expect(headerCheckbox.indeterminate).toBe(false);
    expect(headerCheckbox.checked).toBe(true);
  });

  it('clicking select-all again clears only the visible selectable rows', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(['a1', 'b2']),
      onSelectionChange,
    });
    fireEvent.click(container.querySelector('.dt-th-select input'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('a row excluded by isRowSelectable renders a disabled checkbox and is skipped by select-all', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderTable({
      selectable: true,
      selectedKeys: new Set(),
      onSelectionChange,
      isRowSelectable: (row) => row._id !== 'b2',
    });
    const rowCheckboxes = container.querySelectorAll('tbody input[type="checkbox"]');
    expect(rowCheckboxes[1].disabled).toBe(true);

    fireEvent.click(container.querySelector('.dt-th-select input'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['a1']));
  });

  it('selection state survives a re-sort (rows reordered, same keys)', () => {
    const onSelectionChange = vi.fn();
    const reordered = [ROWS[1], ROWS[0]];
    const { container } = renderTable({
      rows: reordered,
      selectable: true,
      selectedKeys: new Set(['a1']),
      onSelectionChange,
    });
    const rowCheckboxes = container.querySelectorAll('tbody input[type="checkbox"]');
    // a1 (Rakesh) is now the second row after the reorder — still checked.
    expect(rowCheckboxes[0].checked).toBe(false);
    expect(rowCheckboxes[1].checked).toBe(true);
  });
});
