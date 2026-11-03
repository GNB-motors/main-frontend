import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrafficToggle from './TrafficToggle';

describe('TrafficToggle', () => {
  it('is off by default and says so', () => {
    render(<TrafficToggle on={false} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /Traffic/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('is pressed when traffic is on', () => {
    render(<TrafficToggle on onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /Traffic/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('asks for the traffic to be turned on or off', () => {
    const onToggle = vi.fn();
    render(<TrafficToggle on={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /Traffic/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
