import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleDetailsCard from './VehicleDetailsCard';

const now = {
  identity: {
    make: 'TATA',
    model: '4830TC',
    modelLine: 'LPT 4830',
    vin: 'MAT566011S3E16394',
    year: 2021,
    service: {
      lastAt: '2026-10-02T04:10:00Z',
      lastKm: 392100,
      nextKm: 395000,
      nextDueAt: '2026-11-20T00:00:00Z',
      dueInKm: 2410,
    },
  },
};

describe('VehicleDetailsCard', () => {
  it('shows the make, the model and the VIN', () => {
    render(
      <MemoryRouter>
        <VehicleDetailsCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Tata')).toBeInTheDocument();
    expect(screen.getByText('4830TC')).toBeInTheDocument();
    expect(screen.getByText('MAT566011S3E16394')).toBeInTheDocument();
  });

  it('shows when the next service is due', () => {
    render(
      <MemoryRouter>
        <VehicleDetailsCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/at 3,95,000 km/)).toBeInTheDocument();
  });

  it('says Not known instead of guessing a make', () => {
    render(
      <MemoryRouter>
        <VehicleDetailsCard now={{ identity: { make: null, model: null, vin: null } }} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Not known').length).toBeGreaterThan(0);
  });
});
