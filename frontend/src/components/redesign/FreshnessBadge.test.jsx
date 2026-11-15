import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FreshnessBadge from './FreshnessBadge';

describe('FreshnessBadge', () => {
  it('says Live for a fresh reading', () => {
    render(<FreshnessBadge reading={{ freshness: 'live', at: '2026-11-03T04:00:00Z' }} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows the age for a recent reading', () => {
    render(
      <FreshnessBadge
        reading={{ freshness: 'recent', at: '2026-11-03T03:48:00Z', ageMin: 12 }}
      />,
    );
    expect(screen.getByText('12 min ago')).toBeInTheDocument();
  });

  it('shows the date for a stale reading, and never claims Live', () => {
    render(<FreshnessBadge reading={{ freshness: 'stale', at: '2026-09-09T03:40:00Z' }} />);
    expect(screen.getByText('last known 9 Sep, 9:10 am')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('says Not received when the sensor never sent anything', () => {
    render(<FreshnessBadge reading={{ freshness: 'never', at: null }} />);
    expect(screen.getByText('Not received')).toBeInTheDocument();
  });

  it('holds the exact IST time in the title', () => {
    render(<FreshnessBadge reading={{ freshness: 'live', at: '2026-11-02T18:48:00Z' }} />);
    expect(screen.getByTitle('Last measured 3 Nov, 12:18 am')).toBeInTheDocument();
  });
});
