import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoTip from './InfoTip';

describe('InfoTip', () => {
  it('shows a labelled button that explains the number', () => {
    render(<InfoTip text="Live means measured in the last 5 minutes." />);
    expect(screen.getByRole('button', { name: 'What is this?' })).toBeInTheDocument();
  });

  it('can carry its own label for screen readers', () => {
    render(<InfoTip text="x" label="What is Live?" />);
    expect(screen.getByRole('button', { name: 'What is Live?' })).toBeInTheDocument();
  });

  it('renders nothing when there is no text to explain', () => {
    const { container } = render(<InfoTip text={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
