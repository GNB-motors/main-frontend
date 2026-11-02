import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MileageVerdictBadge from './MileageVerdictBadge';

describe('MileageVerdictBadge', () => {
  it('names a round that adds up', () => {
    render(<MileageVerdictBadge item={{ verdict: 'ADDS_UP' }} />);
    expect(screen.getByText('Adds up')).toBeInTheDocument();
  });

  it('names a round that does not add up without accusing anyone', () => {
    render(<MileageVerdictBadge item={{ verdict: 'UNEXPLAINED' }} />);
    expect(screen.getByText("Doesn't add up")).toBeInTheDocument();
  });

  it('says we cannot tell yet when there is no verdict', () => {
    render(<MileageVerdictBadge item={null} />);
    expect(screen.getByText('Not enough data')).toBeInTheDocument();
  });

  it('never shows an accusation', () => {
    const { container } = render(<MileageVerdictBadge item={{ verdict: 'UNEXPLAINED' }} />);
    expect(container.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });
});
