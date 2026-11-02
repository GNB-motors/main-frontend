import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleNowCard from './VehicleNowCard';

const now = {
  activity: {
    kind: 'LOADING',
    label: 'Loading at JK BUXAR',
    sinceAt: '2026-11-02T18:38:00Z',
    durationMin: 130,
    vsUsual: { usualMin: 185, diffMin: -55 },
    why: { text: 'The truck is stopped inside the plant gate with the engine off.', basis: 'Speed 0 km/h for 2 h 10 min' },
  },
  place: {
    at: { id: 'site-jk-buxar', kind: 'SITE', name: 'JK BUXAR', category: 'PLANT', lat: 25.5, lng: 83.9, radiusM: 600 },
    inside: true,
    sinceAt: '2026-11-02T18:38:00Z',
    dwellMin: 130,
    usualDwellMin: 185,
    truckVisits: 14,
    fleetVisits: 268,
    why: null,
  },
  trip: {
    autoTripId: 'trip-1',
    leg: 'LADEN',
    pickup: { id: 'site-jk-buxar', kind: 'SITE', name: 'JK BUXAR', category: 'PLANT', lat: 25.5, lng: 83.9, radiusM: 600, departedAt: null },
    drop: { id: 'site-dankuni', kind: 'SITE', name: 'DANKUNI SIDING', category: 'PLANT', lat: 22.6, lng: 88.3, radiusM: 500, arrivedAt: null },
    material: 'Cement or clinker',
    materialSource: 'PLANT_TYPE',
    tonnage: null,
    tonnageSource: null,
    kmSoFar: 214,
    link: { label: 'Open trip', to: '/auto-trips/trip-1' },
  },
};

describe('VehicleNowCard', () => {
  it('says what the truck is doing and for how long', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Loading at JK BUXAR' })).toBeInTheDocument();
    expect(screen.getByText('2 h 10 min')).toBeInTheDocument();
  });

  it('compares the stay with this truck’s usual stay', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Usually 3 h 5 min here/)).toBeInTheDocument();
  });

  it('says where the truck is and how many times it has been there', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText('JK BUXAR')).toBeInTheDocument();
    expect(screen.getByText(/this truck has been here 14 times/)).toBeInTheDocument();
  });

  it('shows the trip with the leg, the likely material and no fake tonnage', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Loaded run/)).toBeInTheDocument();
    expect(screen.getByText(/Likely Cement or clinker/)).toBeInTheDocument();
    expect(screen.getByText(/214 km so far/)).toBeInTheDocument();
    expect(screen.queryByText(/0 t/)).not.toBeInTheDocument();
  });

  it('links to the trip the API chose', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Open trip/ })).toHaveAttribute(
      'href',
      '/auto-trips/trip-1',
    );
  });

  it('says it will show the activity once the truck reports', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard now={{ ...now, activity: null }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/once it reports/)).toBeInTheDocument();
  });
});
