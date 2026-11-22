import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageState from './PageState';

describe('PageState', () => {
  it('shows a loading label instead of an empty surface while loading', () => {
    render(<PageState loading loadingLabel="Loading drivers…" />);
    expect(screen.getByText('Loading drivers…')).toBeInTheDocument();
  });

  it('shows the failure with a retry when the request failed', () => {
    const onRetry = vi.fn();
    render(<PageState error={{ status: 500 }} onRetry={onRetry} />);
    expect(screen.getByText(/The server had a problem/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the empty message only when the request succeeded with nothing in it', () => {
    render(
      <PageState empty emptyTitle="No drivers yet" emptyHint="Add a driver to start coaching." />,
    );
    expect(screen.getByText('No drivers yet')).toBeInTheDocument();
    expect(screen.getByText('Add a driver to start coaching.')).toBeInTheDocument();
  });

  it('keeps the content when there is no state to show', () => {
    render(
      <PageState>
        <p>Real content</p>
      </PageState>,
    );
    expect(screen.getByText('Real content')).toBeInTheDocument();
  });

  it('prefers the failure over the empty state so one error never blanks the page', () => {
    render(<PageState error={{ status: 403 }} empty emptyTitle="Nothing" />);
    expect(screen.getByText("You don't have access to this.")).toBeInTheDocument();
    expect(screen.queryByText('Nothing')).not.toBeInTheDocument();
  });
});
