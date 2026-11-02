import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotYetAvailable from './NotYetAvailable';

describe('NotYetAvailable', () => {
  it('names what is still being built', () => {
    render(<NotYetAvailable what="Fuel checks" />);
    expect(screen.getByText('Fuel checks is being built and will appear here.')).toBeInTheDocument();
  });

  it('has a neutral default', () => {
    render(<NotYetAvailable />);
    expect(screen.getByText(/is being built and will appear here/)).toBeInTheDocument();
  });
});
