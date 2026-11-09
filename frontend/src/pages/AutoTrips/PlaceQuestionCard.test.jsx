import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlaceQuestionCard from './PlaceQuestionCard';

/** A question as the old backend sends it: no kind, no km at stake, no count. */
const oldQuestion = {
  id: 'q-1',
  point: { lat: 22.5, lng: 88.2, radiusM: 120 },
  tripsAffected: 124,
  trucks: 18,
  suggestion: {
    name: 'JK BUXAR PLANT GATE',
    category: 'PLANT',
    source: 'OSM',
    confidence: 0.82,
  },
  alternatives: [{ name: 'JK BUXAR SIDING', category: 'PLANT', source: 'OSM' }],
  sampleTrips: [{ label: 'Trip on 1 Nov', to: '/auto-trips/trip-88213' }],
  why: { text: 'Trucks stop here 1.5 h on average after loading.' },
};

const renderCard = (question) =>
  render(
    <MemoryRouter>
      <PlaceQuestionCard question={question} onAnswer={() => {}} />
    </MemoryRouter>,
  );

describe('PlaceQuestionCard', () => {
  it('shows the kilometres at stake when the server sends them', () => {
    renderCard({ ...oldQuestion, kind: 'LONG_STOP', kmAtStake: 1240, suspicious: 3 });

    expect(screen.getByText('1,240 km depend on this answer')).toBeInTheDocument();
    expect(
      screen.getByText('Trucks stop here for a long time. Is this a delivery point?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 trips here look unusual/)).toBeInTheDocument();
  });

  it('says the same thing on the old backend, with no new lines at all', () => {
    const { container } = renderCard(oldQuestion);

    expect(screen.getByText('This point is on 124 trips (18 trucks)')).toBeInTheDocument();
    expect(screen.queryByText(/depend on this answer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/look unusual/)).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
  });

  it('prints a dash for a count the server did not send, never a blank', () => {
    const { container } = renderCard({ ...oldQuestion, tripsAffected: null, trucks: null });

    expect(container.textContent).toContain('Trucks are waiting on this answer (— trucks)');
    expect(container.textContent).not.toContain('undefined');
  });

  it('says nothing about kilometres when the field is null', () => {
    renderCard({ ...oldQuestion, kind: 'LONG_STOP', kmAtStake: null, suspicious: null });

    expect(screen.queryByText(/depend on this answer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/look unusual/)).not.toBeInTheDocument();
  });

  it('counts a single unusual trip in the singular', () => {
    renderCard({ ...oldQuestion, suspicious: 1 });

    expect(screen.getByText(/1 trip here looks unusual/)).toBeInTheDocument();
  });
});
