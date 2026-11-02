import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlaceQuestionCard from './PlaceQuestionCard';

const question = {
  id: 'q-501',
  point: { lat: 25.5647, lng: 83.9754, radiusM: 250 },
  tripsAffected: 124,
  trucks: 18,
  suggestion: { name: 'JK BUXAR PLANT GATE', category: 'PLANT', source: 'OSM', confidence: 0.82 },
  alternatives: [
    { name: 'JK BUXAR SIDING', category: 'PLANT', source: 'GOOGLE' },
    { name: 'Near Buxar', category: 'ADDRESS', source: 'ADDRESS' },
  ],
  sampleTrips: [
    { label: 'Trip on 1 Nov', to: '/auto-trips/trip-88213' },
    { label: 'Trip on 28 Oct', to: '/auto-trips/trip-88190' },
  ],
  why: { text: 'Trucks stop here 1.5 h on average after loading.', basis: '124 trips from 18 trucks since 15 Sep' },
};

describe('PlaceQuestionCard', () => {
  it('says what the place is called and why it is being asked about', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>,
    );

    expect(screen.getByText('JK BUXAR PLANT GATE')).toBeInTheDocument();
    expect(screen.getByText('Trucks stop here 1.5 h on average after loading.')).toBeInTheDocument();
    expect(screen.getByText('124 trips from 18 trucks since 15 Sep')).toBeInTheDocument();
  });

  it('shows the other names and the trips behind the question', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>,
    );

    expect(screen.getByText('JK BUXAR SIDING')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Trip on 1 Nov/ })).toHaveAttribute(
      'href',
      '/auto-trips/trip-88213',
    );
  });

  it('says how sure the system is', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/likely/)).toBeInTheDocument();
  });
});
