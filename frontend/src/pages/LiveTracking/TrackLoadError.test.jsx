import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackLoadError from './TrackLoadError.jsx';

/**
 * When the fleet read fails, the page says so and offers a way out. A blank
 * rail with "0 vehicles" is a lie; a message with a Retry button is a fact.
 */
describe('TrackLoadError', () => {
  it('says what went wrong and offers a retry', () => {
    const onRetry = vi.fn();
    render(<TrackLoadError onRetry={onRetry} />);

    expect(screen.getByText(/Couldn.t load your fleet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
