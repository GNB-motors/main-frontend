import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReportDateRange } from './ReportFrame';
import { istDayString, shiftDay } from '../../../utils/dateUtils';

describe('ReportDateRange component', () => {
  it('renders quick range preset selector and formatted date badge', () => {
    const today = istDayString();
    render(<ReportDateRange from={today} to={today} onChange={() => {}} />);

    // Quick range selector should be present
    expect(screen.getByRole('button', { name: /Quick range/i })).toBeInTheDocument();

    // Clear range display badge
    expect(screen.getByTitle(/Current date range:/i)).toBeInTheDocument();
  });

  it('calculates and triggers onChange when selecting presets', () => {
    const onChange = vi.fn();
    const today = istDayString();
    render(<ReportDateRange from={today} to={today} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Quick range/i });
    fireEvent.click(trigger);

    // Pick 'Last 7 Days'
    const option7Days = screen.getByText('Last 7 Days');
    fireEvent.mouseDown(option7Days);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: shiftDay(today, -6),
        to: today,
        dates: '7DAYS',
      }),
    );
  });

  it('calculates Last 15 Days preset correctly', () => {
    const onChange = vi.fn();
    const today = istDayString();
    render(<ReportDateRange from={today} to={today} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Quick range/i });
    fireEvent.click(trigger);

    const option15Days = screen.getByText('Last 15 Days');
    fireEvent.mouseDown(option15Days);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: shiftDay(today, -14),
        to: today,
        dates: '15DAYS',
      }),
    );
  });

  it('calculates Last Month preset correctly', () => {
    const onChange = vi.fn();
    const today = istDayString();
    render(<ReportDateRange from={today} to={today} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Quick range/i });
    fireEvent.click(trigger);

    const optionLastMonth = screen.getByText('Last Month');
    fireEvent.mouseDown(optionLastMonth);

    const lastDayOfPrevMonth = shiftDay(`${today.slice(0, 7)}-01`, -1);
    const firstDayOfPrevMonth = `${lastDayOfPrevMonth.slice(0, 7)}-01`;

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: firstDayOfPrevMonth,
        to: lastDayOfPrevMonth,
        dates: 'LAST_MONTH',
      }),
    );
  });

  it('shows From and To inputs when Custom Range is selected and allows editing', () => {
    const onChange = vi.fn();
    const today = istDayString();
    render(<ReportDateRange from={today} to={today} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Quick range/i });
    fireEvent.click(trigger);

    const optionCustom = screen.getByText('Custom Range');
    fireEvent.mouseDown(optionCustom);

    // From and To date inputs should now appear
    const fromInput = screen.getByLabelText('From date');
    const toInput = screen.getByLabelText('To date');
    expect(fromInput).toBeInTheDocument();
    expect(toInput).toBeInTheDocument();

    fireEvent.change(fromInput, { target: { value: '2026-05-01' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '2026-05-01',
        dates: '',
      }),
    );
  });
});
