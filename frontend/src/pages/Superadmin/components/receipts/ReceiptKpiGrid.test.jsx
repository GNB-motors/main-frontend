import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReceiptKpiGrid from './ReceiptKpiGrid';
import { kpisFromSummary, computeReceiptKpis } from './receiptKpis';

const renderGrid = (props = {}) =>
  render(
    <ReceiptKpiGrid
      loading={false}
      kpis={kpisFromSummary({ totalCount: 0 })}
      odoFilter="ALL"
      setOdoFilter={() => {}}
      {...props}
    />,
  );

describe('The KPI cards', () => {
  it('shows the totals of the whole tab with the coverage of each total', () => {
    renderGrid({
      kpis: kpisFromSummary({
        totalCount: 10,
        totalLitres: 1000,
        totalAmount: 90000,
        pendingCount: 2,
        pendingAmount: 18000,
        missingOdoCount: 1,
        coverage: { totalBills: 10, billsWithAmount: 8, billsWithLitres: 9 },
      }),
    });

    expect(screen.getAllByText('₹90,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1,000 L').length).toBeGreaterThan(0);
    expect(screen.getByText(/8 of 10 bills have an amount/)).toBeTruthy();
    expect(screen.getByText(/9 of 10 bills have litres/)).toBeTruthy();
  });

  it('does not show a page number as a total of the tab', () => {
    renderGrid({
      kpis: computeReceiptKpis([{ litres: 100, rate: 90, amount: 9000, odometerReading: 10 }]),
    });

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not measured for this tab.').length).toBeGreaterThan(0);
    expect(screen.queryByText('₹9,000')).toBeNull();
  });

  it('shows a dash when the tab total was never measured', () => {
    renderGrid({ kpis: kpisFromSummary({ totalCount: 0 }) });
    expect(screen.getAllByText('Not measured for this tab.').length).toBeGreaterThan(0);
    expect(screen.queryByText('₹0')).toBeNull();
  });

  it('offers a retry when the inbox could not be read', () => {
    const onRetry = vi.fn();
    renderGrid({ error: 'The server is having a bad day.', onRetry });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText("Couldn't load")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('filters the inbox by the slips with no odometer', () => {
    const setOdoFilter = vi.fn();
    renderGrid({
      kpis: kpisFromSummary({ totalCount: 4, missingOdoCount: 2 }),
      setOdoFilter,
    });

    fireEvent.click(screen.getByText('Missing odometer'));
    expect(setOdoFilter).toHaveBeenCalledWith('MISSING');
  });
});
