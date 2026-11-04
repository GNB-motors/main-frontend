import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleDriverSection from './VehicleDriverSection';

describe('VehicleDriverSection', () => {
  it('shows the driver and the phone', () => {
    render(
      <MemoryRouter>
        <VehicleDriverSection driver={{ driverId: 'd1', name: 'Ramesh Yadav', phone: '9876543210', source: 'MANUAL', since: '2026-10-31T00:00:00Z' }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '9876543210' })).toHaveAttribute('href', 'tel:9876543210');
  });

  it('marks an inferred driver as inferred', () => {
    render(
      <MemoryRouter>
        <VehicleDriverSection driver={{ driverId: null, name: 'Ramesh Yadav', phone: null, source: 'INFERRED', since: null }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Inferred')).toBeInTheDocument();
  });

  it('never says "he drove it" for an inferred driver', () => {
    render(
      <MemoryRouter>
        <VehicleDriverSection driver={{ driverId: null, name: 'Ramesh Yadav', phone: null, source: 'INFERRED', since: null }} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/he drove it/i)).not.toBeInTheDocument();
  });

  it('says when there is no driver on record', () => {
    render(
      <MemoryRouter>
        <VehicleDriverSection driver={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No driver on record for this truck.')).toBeInTheDocument();
  });
});

it.each(['Rajesh NA', 'Rajesh N/A'])('omits a placeholder surname from %s', name => {
  render(<MemoryRouter><VehicleDriverSection driver={{ name }} /></MemoryRouter>);
  expect(screen.getByText('Rajesh')).toBeInTheDocument();
});
