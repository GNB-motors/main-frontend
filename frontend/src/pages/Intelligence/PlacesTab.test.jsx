import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getPlaceQuestions: vi.fn(), getTripsHistory: vi.fn() },
}));

import IntelligenceService from './IntelligenceService';
import PlacesTab from './PlacesTab';

const questions = {
  items: [
    {
      id: 'q-501',
      tripsAffected: 124,
      trucks: 18,
      suggestion: { name: 'JK BUXAR PLANT GATE', category: 'PLANT', source: 'OSM', confidence: 0.82 },
      alternatives: [],
      sampleTrips: [{ label: 'Trip on 1 Nov', to: '/auto-trips/trip-88213' }],
      why: { text: 'Trucks stop here 1.5 h on average after loading.', basis: '124 trips from 18 trucks since 15 Sep' },
    },
  ],
  total: 1,
};

const history = {
  items: [
    {
      kind: 'VISIT',
      registrationNumber: 'WB11L8862',
      place: { id: 'poi-1', name: 'OCL Buxar', category: 'PLANT' },
      arrivedAt: '2026-11-01T10:00:00Z',
      departedAt: '2026-11-01T11:00:00Z',
      dwellMin: 60,
      purpose: 'LOADING',
    },
  ],
  total: 1,
  countsByPlace: [{ place: { id: 'poi-1', name: 'OCL Buxar', category: 'PLANT' }, visits: 14 }],
};

describe('PlacesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntelligenceService.getPlaceQuestions.mockResolvedValue(questions);
    IntelligenceService.getTripsHistory.mockResolvedValue(history);
  });

  it('shows the places waiting for an answer', async () => {
    render(
      <MemoryRouter>
        <PlacesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Places waiting for your answer (1)')).toBeInTheDocument();
    expect(screen.getByText('JK BUXAR PLANT GATE')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/auto-trips?tab=questions',
    );
  });

  it('says every place has a name when there is no question', async () => {
    IntelligenceService.getPlaceQuestions.mockResolvedValue({ items: [], total: 0 });

    render(
      <MemoryRouter>
        <PlacesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Every place the fleet visited has a name.')).toBeInTheDocument();
  });

  it('shows the busiest places of the period', async () => {
    render(
      <MemoryRouter>
        <PlacesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Busiest places')).toBeInTheDocument();
    expect(screen.getByText('OCL Buxar')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('1 h')).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getPlaceQuestions.mockRejectedValue({ status: 404 });
    IntelligenceService.getTripsHistory.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <PlacesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText(/is being built/).length).toBeGreaterThan(0));
  });
});
