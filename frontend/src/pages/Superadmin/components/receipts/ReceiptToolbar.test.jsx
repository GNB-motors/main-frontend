import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReceiptToolbar from './ReceiptToolbar';

const baseProps = {
  status: 'READY',
  setStatus: vi.fn(),
  counts: { READY: 3, PUBLISHED: 2 },
  loading: false,
  dateFilter: 'ALL',
  setDateFilter: vi.fn(),
  odoFilter: 'ALL',
  setOdoFilter: vi.fn(),
  anomalyFilter: 'ALL',
  setAnomalyFilter: vi.fn(),
  activeFiltersCount: 0,
  resetAllFilters: vi.fn(),
  query: '',
  setQuery: vi.fn(),
};

const renderToolbar = (overrides = {}) =>
  render(<ReceiptToolbar {...baseProps} {...overrides} />);

describe('The receipt toolbar', () => {
  it('names each filter in plain words', () => {
    renderToolbar();

    expect(
      screen.getByRole('combobox', { name: 'Filter receipts by date range' }).textContent,
    ).toContain('All dates');
    expect(
      screen.getByRole('combobox', { name: 'Filter receipts by odometer source' }).textContent,
    ).toContain('All odometers');
    expect(
      screen.getByRole('combobox', { name: 'Filter receipts by AI extraction health' }).textContent,
    ).toContain('All AI health');
  });

  it('shows the chosen filter on the button', () => {
    renderToolbar({ dateFilter: 'TODAY' });
    expect(
      screen.getByRole('combobox', { name: 'Filter receipts by date range' }).textContent,
    ).toContain('Today');
  });

  it('switches the tab that is shown', () => {
    const setStatus = vi.fn();
    renderToolbar({ setStatus });

    fireEvent.click(screen.getByRole('button', { name: /Published/ }));
    expect(setStatus).toHaveBeenCalledWith('PUBLISHED');
  });

  it('shows how many slips wait in a tab', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: /Pending/ }).textContent).toContain('3');
  });

  it('filters by date when a day is chosen', () => {
    const setDateFilter = vi.fn();
    const { container } = renderToolbar({ setDateFilter });

    const [dateSelect] = container.querySelectorAll('select');
    fireEvent.change(dateSelect, { target: { value: 'TODAY' } });
    expect(setDateFilter).toHaveBeenCalledWith('TODAY');
  });

  it('offers a way back when a filter is on', () => {
    const resetAllFilters = vi.fn();
    renderToolbar({ activeFiltersCount: 2, resetAllFilters });

    fireEvent.click(screen.getByRole('button', { name: /Reset/ }));
    expect(resetAllFilters).toHaveBeenCalled();
  });

  it('searches what the person typed', () => {
    const setQuery = vi.fn();
    renderToolbar({ setQuery });

    fireEvent.change(screen.getByPlaceholderText('Search vehicle, driver, station, plate…'), {
      target: { value: 'WB25' },
    });
    expect(setQuery).toHaveBeenCalledWith('WB25');
  });
});
