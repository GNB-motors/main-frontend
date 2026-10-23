import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GpsTripPanel from './GpsTripPanel';

const plan = {
  source: 'ERP',
  status: 'COMPLETED',
  autoTripId: 'gps1',
  plannedStartAt: '2026-10-20T08:00:00Z',
  expectedFreeAt: '2026-10-22T08:00:00Z',
  flags: ['DROP_MISMATCH'],
};

describe('ERP GPS trip card', () => {
  it('shows actual distance, an actionable link, and vehicle availability separately', () => {
    render(
      <MemoryRouter>
        <GpsTripPanel plan={plan} autoTrip={{ _id: 'gps1', km: { laden: 124 } }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'View GPS trip' }).getAttribute('href')).toBe(
      '/auto-trips/gps1',
    );
    expect(screen.getByText('124 km')).toBeTruthy();
    expect(screen.getByText('Expected vehicle availability')).toBeTruthy();
    expect(screen.getByText('Dropped elsewhere')).toBeTruthy();
    expect(screen.queryByText('Planned delivery')).toBeNull();
  });
  it('retains an explanation when association refresh fails', () => {
    render(<GpsTripPanel error />);
    expect(screen.getByText(/could not be refreshed/)).toBeTruthy();
  });
  it('does not add a GPS card when the feature is off or no eligible plan exists', () => {
    const { container } = render(<GpsTripPanel />);
    expect(container.textContent).toBe('');
  });
});
