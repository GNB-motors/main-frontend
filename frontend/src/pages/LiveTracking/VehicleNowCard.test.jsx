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

  // `/now` is not on prod yet. The card must never say "once it reports"
  // under a header that shows the truck live and moving.
  it('says what the last report proves when there is no activity yet', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard
          now={{ ...now, activity: null }}
          vehicle={{ plate: 'WB11L8862', status: 'moving', speed: 18, live: true, ago: 2, hasFix: true, area: 'Dankuni, Hooghly' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Now · Moving at 18 km/h' })).toBeInTheDocument();
    expect(screen.getByText('Dankuni, Hooghly')).toBeInTheDocument();
    expect(screen.queryByText(/once it reports/)).not.toBeInTheDocument();
  });

  it('says a truck is not reporting when it is offline', () => {
    render(
      <MemoryRouter>
        <VehicleNowCard
          now={{ ...now, activity: null }}
          vehicle={{ plate: 'WB11L8862', status: 'offline', live: false, ago: 300, hasFix: true, area: 'Dankuni' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Now · Not reporting' })).toBeInTheDocument();
  });

  it('draws nothing when it has neither an activity nor a truck', () => {
    const { container } = render(
      <MemoryRouter>
        <VehicleNowCard now={{ ...now, activity: null }} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
