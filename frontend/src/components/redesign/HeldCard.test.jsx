import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeldCard from './HeldCard';

describe('HeldCard', () => {
  it('says the feature is not shown yet and why', () => {
    render(
      <HeldCard why={{ text: 'Load state is right 62% of the time against BD’s register.', basis: '122 of 196 rows' }} />,
    );
    expect(screen.getByText('Not shown yet')).toBeInTheDocument();
    expect(screen.getByText(/Load state is right 62%/)).toBeInTheDocument();
    expect(screen.getByText('122 of 196 rows')).toBeInTheDocument();
  });

  it('still says the headline when there is no reason', () => {
    render(<HeldCard />);
    expect(screen.getByText('Not shown yet')).toBeInTheDocument();
  });
});
