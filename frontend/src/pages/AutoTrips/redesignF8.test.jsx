import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getTripsHistory, getPlaceQuestions, answerPlaceQuestion } = vi.hoisted(() => ({
  getTripsHistory: vi.fn(),
  getPlaceQuestions: vi.fn(),
  answerPlaceQuestion: vi.fn(),
}));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getTripsHistory, getPlaceQuestions, answerPlaceQuestion },
}));

import TripHistoryTab from './TripHistoryTab';
import PlaceQuestionCard from './PlaceQuestionCard';
import TripLegBar from './TripLegBar';
import TripStopList from './TripStopList';

const visit = {
  kind: 'VISIT',
  registrationNumber: 'WB11F6762',
  place: { id: 'site-dalmia', kind: 'SITE', name: 'DALMIA OCL', category: 'PLANT', lat: 25.3, lng: 84.9, radiusM: 700 },
  arrivedAt: '2026-11-01T12:40:00Z',
  departedAt: '2026-11-01T16:25:00Z',
  dwellMin: 225,
  purpose: 'LOADING',
  register: null,
  trip: { label: 'Open trip', to: '/auto-trips/trip-1' },
  replay: { label: 'Watch it', to: '/live-tracking?v=WB11F6762' },
};

const registerTrip = {
  kind: 'REGISTER_TRIP',
  registrationNumber: 'WB11F6762',
  place: null,
  arrivedAt: null,
  departedAt: null,
  dwellMin: null,
  purpose: null,
  register: {
    date: '2026-04-02',
    from: 'DALMIA OCL',
    to: ['FARAKKA AMBUJA PLANT'],
    driver: 'Ramesh Yadav',
    litres: 320,
  },
  trip: null,
  replay: null,
};

describe('TripHistoryTab', () => {
  beforeEach(() => {
    getTripsHistory.mockReset();
  });

  it('lists a visit with the place and how long', async () => {
    getTripsHistory.mockResolvedValue({ items: [visit], countsByPlace: [] });
    render(
      <MemoryRouter>
        <TripHistoryTab vehicle="WB11F6762" site="site-dalmia" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('DALMIA OCL')).toBeInTheDocument();
    expect(screen.getByText('3 h 45 min')).toBeInTheDocument();
  });

  it('badges a register row as coming from the oil report', async () => {
    getTripsHistory.mockResolvedValue({ items: [registerTrip], countsByPlace: [] });
    render(
      <MemoryRouter>
        <TripHistoryTab />
      </MemoryRouter>,
    );
    expect(await screen.findByText('From oil report')).toBeInTheDocument();
    expect(screen.getByText(/FARAKKA AMBUJA PLANT/)).toBeInTheDocument();
  });

  it('says where history is kept from when there is nothing', async () => {
    getTripsHistory.mockResolvedValue({ items: [], countsByPlace: [] });
    render(
      <MemoryRouter>
        <TripHistoryTab />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/History is kept from 15 Sep/)).toBeInTheDocument();
  });

  it('offers the two links on a visit row', async () => {
    getTripsHistory.mockResolvedValue({ items: [visit], countsByPlace: [] });
    render(
      <MemoryRouter>
        <TripHistoryTab />
      </MemoryRouter>,
    );
    expect(await screen.findByText('See on map →')).toBeInTheDocument();
    expect(screen.getByText('Trip →')).toBeInTheDocument();
  });
});

describe('PlaceQuestionCard', () => {
  const question = {
    id: 'q-501',
    point: { lat: 25.5, lng: 83.9, radiusM: 250 },
    tripsAffected: 124,
    trucks: 31,
    suggestion: { name: 'JSW Salboni gate 2', category: 'PLANT', source: 'OSM', confidence: 0.82 },
    alternatives: [{ name: 'Salboni weighbridge', category: 'PLANT', source: 'GOOGLE' }],
    sampleTrips: [{ label: 'Trip on 1 Nov', to: '/auto-trips/trip-1' }],
    why: { text: 'trucks stop here 1 h 30 min on average after loading.', basis: null },
  };

  it('says how many trips are waiting and what we think it is', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>
    );
    expect(screen.getByText(/This point is on 124 trips \(31 trucks\)/)).toBeInTheDocument();
    expect(screen.getByText('JSW Salboni gate 2')).toBeInTheDocument();
  });

  it('says why we are asking', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>
    );
    expect(screen.getByText(/trucks stop here 1 h 30 min/)).toBeInTheDocument();
  });

  it('lets an owner confirm the guess', () => {
    const onAnswer = vi.fn();
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} canAnswer onAnswer={onAnswer} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Yes, that's it/ }));
    expect(onAnswer).toHaveBeenCalledWith('q-501', { answer: 'CONFIRM' });
  });

  it('lets an owner say it is not a place', () => {
    const onAnswer = vi.fn();
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} canAnswer onAnswer={onAnswer} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Not a place' }));
    expect(onAnswer).toHaveBeenCalledWith('q-501', { answer: 'NOT_A_PLACE' });
  });

  it('is read-only for anybody else', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} canAnswer={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('Ask your manager to answer this.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Yes, that's it/ })).not.toBeInTheDocument();
  });

  it('never accuses anybody of stealing', () => {
    render(
      <MemoryRouter>
        <PlaceQuestionCard question={question} />
      </MemoryRouter>
    );
    expect(document.body.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen/);
  });
});

describe('TripLegBar', () => {
  it('draws one slice per leg, sized by its share', () => {
    const { container } = render(<TripLegBar trip={{ km: { laden: 300, return: 100 } }} />);
    const slices = container.querySelectorAll('[style*="width"]');
    expect(slices.length).toBe(2);
    expect(slices[0].style.width).toBe('75%');
  });

  it('says the kilometres of each leg', () => {
    render(<TripLegBar trip={{ km: { laden: 412, return: 88 } }} />);
    expect(screen.getByText('412 km')).toBeInTheDocument();
    expect(screen.getByText('88 km')).toBeInTheDocument();
  });

  it('says so when the trip has no distance', () => {
    render(<TripLegBar trip={{ km: {} }} />);
    expect(screen.getByText('No distance recorded for this trip.')).toBeInTheDocument();
  });
});

describe('TripStopList', () => {
  const stops = [
    {
      startAt: '2026-11-01T13:00:00Z',
      endAt: '2026-11-01T13:30:00Z',
      durationMin: 30,
      place: { id: 'p1', name: 'JK BUXAR' },
      reason: 'LOADING',
      reasonWhy: 'Stopped inside a plant gate.',
    },
    {
      startAt: '2026-11-01T15:05:00Z',
      endAt: '2026-11-01T15:45:00Z',
      durationMin: 40,
      place: null,
      reason: 'UNEXPLAINED',
      reasonWhy: 'Stopped on the road with no named place within 500 m.',
    },
  ];

  it('gives every stop its reason and its place', () => {
    render(
      <MemoryRouter>
        <TripStopList stops={stops} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByText('LOADING')).toBeInTheDocument();
    expect(screen.getByText('JK BUXAR')).toBeInTheDocument();
  });

  it('says an unexplained stop plainly, never as a warning', () => {
    render(
      <MemoryRouter>
        <TripStopList stops={stops} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Stopped, reason not known')).toBeInTheDocument();
  });

  it('shows the reason why', () => {
    render(
      <MemoryRouter>
        <TripStopList stops={stops} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Stopped inside a plant gate.')).toBeInTheDocument();
  });

  it('says so when there were no stops', () => {
    render(<TripStopList stops={[]} />);
    expect(screen.getByText('No stops were recorded on this trip.')).toBeInTheDocument();
  });
});
