import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PanelErrorBoundary from './PanelErrorBoundary';
import { captureException } from '../../utils/sentry.js';

vi.mock('../../utils/sentry.js', () => ({ captureException: vi.fn() }));

const Broken = () => {
  throw new Error('panel exploded');
};

describe('PanelErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // It used to console.error only, so a panel crash never reached Sentry.
  it('shows the in-panel fallback and reports the crash to Sentry', () => {
    render(
      <PanelErrorBoundary name="Fuel efficiency">
        <Broken />
      </PanelErrorBoundary>,
    );

    expect(screen.getByText("This panel couldn't load")).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context] = captureException.mock.calls[0];
    expect(error.message).toBe('panel exploded');
    expect(context.tags.loggerTag).toBe('PanelErrorBoundary');
    expect(context.extra.data).toContain('Fuel efficiency');
  });
});
