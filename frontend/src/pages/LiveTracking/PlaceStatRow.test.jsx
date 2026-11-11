import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlaceStatRow from './PlaceStatRow.jsx';

describe('compact place activity', () => {
  it('keeps missing history distinct from zero trucks', () => {
    render(<PlaceStatRow trucksHere={0} stats={null} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
  it('fits dwell time on one line while retaining its full duration and metric explanations', () => {
    render(<PlaceStatRow trucksHere={3} stats={{ usualDwellMin: 139, visits: 1147 }} />);
    expect(screen.getByText('2h 19m')).toHaveAttribute('title', '2 h 19 min');
    expect(screen.getByText('1,147')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About usual stay' })).toBeInTheDocument();
  });
});
