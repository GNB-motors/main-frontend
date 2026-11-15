import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorCard from './ErrorCard';

describe('ErrorCard', () => {
  it('shows the status and the request id', () => {
    render(<ErrorCard error={{ status: 500, requestId: 'req-9' }} />);
    expect(screen.getByText("Couldn't load this.")).toBeInTheDocument();
    expect(screen.getByText('Error 500 · request req-9')).toBeInTheDocument();
  });

  it('offers a retry', () => {
    const onRetry = vi.fn();
    render(<ErrorCard error={{ status: 500 }} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('copes with an error that carries no detail', () => {
    render(<ErrorCard error={null} />);
    expect(screen.getByText('The request did not complete.')).toBeInTheDocument();
  });
});
