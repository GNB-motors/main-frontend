import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorCard from './ErrorCard';

describe('ErrorCard', () => {
  it('explains a server failure in plain words and keeps the request id as support detail', () => {
    render(<ErrorCard error={{ status: 500, requestId: 'req-9' }} />);
    expect(screen.getByText("Couldn't load this.")).toBeInTheDocument();
    expect(screen.getByText(/The server had a problem/)).toBeInTheDocument();
    expect(screen.getByText('Reference: req-9')).toBeInTheDocument();
  });

  it('offers a retry', () => {
    const onRetry = vi.fn();
    render(<ErrorCard error={{ status: 500 }} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('copes with an error that carries no detail', () => {
    render(<ErrorCard error={null} />);
    expect(screen.getByText("Couldn't load this.")).toBeInTheDocument();
  });

  it('maps 403 to an access explanation and does not offer a pointless retry', () => {
    render(<ErrorCard error={{ status: 403 }} onRetry={vi.fn()} />);
    expect(screen.getByText("You don't have access to this.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('never prints the raw server message to the owner', () => {
    render(<ErrorCard error={{ status: 500, message: 'ECONNREFUSED 127.0.0.1:8000 /erp' }} />);
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });

  it('tells the owner to sign in again after a 401', () => {
    render(<ErrorCard error={{ status: 401 }} />);
    expect(screen.getByText('Your session has ended.')).toBeInTheDocument();
  });
});
