import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TrailDateFilter from './TrailDateFilter.jsx';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('map trail date filter', () => {
  it('loads Yesterday directly from the map', () => {
    const onSelect = vi.fn();
    render(<TrailDateFilter selection={{ period: 'today' }} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yesterday' }));
    expect(onSelect).toHaveBeenCalledWith({ period: 'yesterday' });
  });
  it('applies start and end dates only after Show trail, and prevents invalid ranges', () => {
    const onSelect = vi.fn();
    render(<TrailDateFilter selection={{ period: 'today' }} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Custom date' }));
    expect(screen.getByRole('button', { name: 'Custom date' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-22' } });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Show trail' }));
    expect(onSelect).toHaveBeenCalledWith({
      period: 'custom',
      startDate: '2026-10-20',
      endDate: '2026-10-22',
    });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-11-03' } });
    expect(screen.getByRole('button', { name: 'Show trail' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-19' } });
    expect(screen.getByRole('button', { name: 'Show trail' })).toBeDisabled();
    expect(screen.getByText('End date must be on or after start date.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '' } });
    expect(screen.getByLabelText('End date')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Show trail' })).toBeDisabled();
  });
  it.each(['Today', 'Yesterday'])(
    'closes an applied custom date immediately when choosing %s',
    (preset) => {
      const onSelect = vi.fn();
      render(
        <TrailDateFilter
          selection={{ period: 'custom', startDate: '2026-10-20', endDate: '2026-10-22' }}
          onSelect={onSelect}
        />,
      );
      expect(screen.getByLabelText('Start date')).toBeVisible();
      expect(screen.getByLabelText('End date')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: preset }));
      expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('End date')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom date' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(screen.getByRole('button', { name: preset })).toHaveAttribute('aria-pressed', 'true');
      expect(onSelect).toHaveBeenCalledWith({ period: preset.toLowerCase() });
    },
  );
  it('keeps date choices available after an empty result', () => {
    render(
      <TrailDateFilter
        selection={{ period: 'yesterday' }}
        notice="No recorded trail for this day."
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No recorded trail');
    expect(screen.getByRole('button', { name: 'Today' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Custom date' })).toBeEnabled();
  });
});
