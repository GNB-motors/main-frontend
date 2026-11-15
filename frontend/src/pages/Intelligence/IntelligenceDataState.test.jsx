import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntelligenceDataState from './IntelligenceDataState';

describe('IntelligenceDataState', () => {
  it('shows the shape of the content while it loads', () => {
    render(
      <IntelligenceDataState loading>
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.queryByText('the content')).not.toBeInTheDocument();
  });

  it('shows the content when the data is there', () => {
    render(
      <IntelligenceDataState>
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.getByText('the content')).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', () => {
    render(
      <IntelligenceDataState error={{ status: 404 }} what="The issues list">
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.getByText(/is being built/)).toBeInTheDocument();
    expect(screen.queryByText('the content')).not.toBeInTheDocument();
  });

  it('shows the error and a way out on any other failure', () => {
    render(
      <IntelligenceDataState error={{ status: 500, requestId: 'r-9' }} onRetry={vi.fn()}>
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.getByText("Couldn't load this.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
  });

  it('shows the reason the backend is holding the numbers back', () => {
    render(
      <IntelligenceDataState held={{ text: 'Not enough data yet', basis: 'From 1 Oct' }}>
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.getByText('Not shown yet')).toBeInTheDocument();
    expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
    expect(screen.getByText('From 1 Oct')).toBeInTheDocument();
  });

  it('shows the empty message when there is nothing to show', () => {
    render(
      <IntelligenceDataState isEmpty emptyMessage="No open issues.">
        <span>the content</span>
      </IntelligenceDataState>,
    );
    expect(screen.getByText('No open issues.')).toBeInTheDocument();
    expect(screen.queryByText('the content')).not.toBeInTheDocument();
  });
});
