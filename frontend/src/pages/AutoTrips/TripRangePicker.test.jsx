import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TripRangePicker from './TripRangePicker';

afterEach(() => vi.useRealTimers());
it('keeps the selected IST calendar dates when applying a range from another browser timezone', async () => {
  const onChange = vi.fn();
  render(
    <TripRangePicker
      value={{ range: 'custom', from: '2026-10-01', to: '2026-10-05' }}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Trips in:/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Apply' }));
  expect(onChange).toHaveBeenCalledWith({ range: 'custom', from: '2026-10-01', to: '2026-10-05' });
});

it('allows today in IST when the browser is still on the previous day', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-09T20:30:00Z'));
  const onChange = vi.fn();
  render(
    <TripRangePicker
      value={{ range: 'custom', from: '2026-10-09', to: '2026-10-09' }}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Trips in:/ }));
  const day = await screen.findByRole('button', { name: /Saturday, October 10th, 2026/ });
  expect(day).not.toBeDisabled();
  fireEvent.click(day);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onChange).toHaveBeenCalledWith({ range: 'custom', from: '2026-10-09', to: '2026-10-10' });
});
