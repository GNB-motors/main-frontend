import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatTile from './StatTile';

describe('StatTile', () => {
  it('shows the label and the value', () => {
    render(<StatTile label="Loaded km" value="4,820 km" tone="good" />);
    expect(screen.getByText('Loaded km')).toBeInTheDocument();
    expect(screen.getByText('4,820 km')).toBeInTheDocument();
  });

  it('shows the sub line', () => {
    render(<StatTile label="km/L" value="3.4 km/L" tone="info" sub="This truck's usual 3.2" />);
    expect(screen.getByText("This truck's usual 3.2")).toBeInTheDocument();
  });

  it('becomes a link when the evidence has a place to go', () => {
    render(
      <MemoryRouter>
        <StatTile
          label="Empty km"
          value="1,240 km"
          tone="watch"
          link={{ label: 'See', to: '/intelligence?tab=runs' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/intelligence?tab=runs');
  });

  it('is a plain card when there is no evidence link', () => {
    render(<StatTile label="Trucks" value="124" tone="info" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
