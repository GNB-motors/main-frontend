import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';

vi.mock('../utils/sentry', () => ({
  captureException: vi.fn(),
}));

import { captureException } from '../utils/sentry';

const Thrower = ({ message }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Thrower message="kaboom" />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('all good')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('reports the error to Sentry with the component stack', () => {
    render(
      <ErrorBoundary>
        <Thrower message="report me" />
      </ErrorBoundary>,
    );
    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context] = captureException.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('report me');
    expect(context.extra.componentStack).toBeTruthy();
  });

  it('recovering child re-renders after Try again resets the boundary', () => {
    let shouldThrow = true;
    const MaybeThrower = () => {
      if (shouldThrow) throw new Error('first failure');
      return <p>recovered</p>;
    };

    render(
      <ErrorBoundary>
        <MaybeThrower />
      </ErrorBoundary>,
    );
    expect(screen.getByText('first failure')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('isolates errors per boundary instance', () => {
    render(
      <div>
        <ErrorBoundary>
          <Thrower message="left broke" />
        </ErrorBoundary>
        <ErrorBoundary>
          <p>right fine</p>
        </ErrorBoundary>
      </div>,
    );
    expect(screen.getByText('left broke')).toBeInTheDocument();
    expect(screen.getByText('right fine')).toBeInTheDocument();
  });
});

describe('ErrorFallback', () => {
  it('renders the default message when error has none', () => {
    render(<ErrorFallback error={new Error('')} />);
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('renders without a reset handler (no Try again button)', () => {
    render(<ErrorFallback error={new Error('x')} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('invokes resetErrorBoundary when Try again is clicked', () => {
    const reset = vi.fn();
    render(<ErrorFallback error={new Error('x')} resetErrorBoundary={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('assigns to / on Go to Dashboard', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      writable: true,
    });
    render(<ErrorFallback error={new Error('x')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
    expect(assign).toHaveBeenCalledWith('/');
  });
});
