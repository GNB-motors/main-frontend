import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('shows the title, the one-line purpose and the primary action', () => {
    render(
      <PageHeader
        title="Driver coaching"
        purpose="Who needs coaching and why."
        action={<button type="button">Open coaching</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Driver coaching' })).toBeInTheDocument();
    expect(screen.getByText('Who needs coaching and why.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open coaching' })).toBeInTheDocument();
  });

  it('shows the scope the numbers belong to', () => {
    render(<PageHeader title="Places" scope="1–30 Nov 2026" />);
    expect(screen.getByText('1–30 Nov 2026')).toBeInTheDocument();
  });

  it('renders a breadcrumb trail', () => {
    render(<PageHeader title="Places" breadcrumb={['Fleet', 'Places workspace']} />);
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Places workspace')).toBeInTheDocument();
  });
});
