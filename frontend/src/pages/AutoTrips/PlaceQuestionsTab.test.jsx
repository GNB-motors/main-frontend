import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getPlaceQuestions: vi.fn(), answerPlaceQuestion: vi.fn() },
}));
vi.mock('../../utils/session', () => ({ getUserRole: () => 'OWNER' }));

import { toast } from 'react-toastify';
import { fleetViewService } from '../../services/fleetViewService';
import PlaceQuestionsTab from './PlaceQuestionsTab';

const question = (id, tripsAffected, extra = {}) => ({
  id,
  point: { lat: 22.5, lng: 88.2, radiusM: 120 },
  tripsAffected,
  trucks: 3,
  suggestion: { name: `Place ${id}`, category: 'PLANT', source: 'OSM', confidence: 0.8 },
  alternatives: [],
  sampleTrips: [],
  why: { text: 'Trucks stop here.' },
  ...extra,
});

describe('PlaceQuestionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fleetViewService.getPlaceQuestions.mockResolvedValue({
      items: [question('q-1', 124)],
      total: 1,
    });
  });

  const renderTab = () =>
    render(
      <MemoryRouter>
        <PlaceQuestionsTab />
      </MemoryRouter>,
    );

  it('says the trips stay open when the answer closed no trip', async () => {
    fleetViewService.answerPlaceQuestion.mockResolvedValue({ tripsUpdated: 0, placeId: 'site-1' });
    renderTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm place' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Saved. These trips stay open until their drop is found.',
      ),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('counts the trips it closed', async () => {
    fleetViewService.answerPlaceQuestion.mockResolvedValue({ tripsUpdated: 2, placeId: 'site-1' });
    renderTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm place' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Done: 2 trips updated'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps the queue in the order the server sent it', async () => {
    fleetViewService.getPlaceQuestions.mockResolvedValue({
      items: [question('q-1', 12), question('q-2', 340), question('q-3', 7)],
      total: 3,
    });
    renderTab();

    await screen.findByText('Place q-1');
    const cards = screen.getAllByRole('article');
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      'Place q-1',
      'Place q-2',
      'Place q-3',
    ]);
    expect(within(cards[0]).getByText('12 trips')).toBeInTheDocument();
    expect(within(cards[1]).getByText('340 trips')).toBeInTheDocument();
    expect(within(cards[2]).getByText('7 trips')).toBeInTheDocument();
  });

  it('shows the kilometres at stake when the server sends them', async () => {
    fleetViewService.getPlaceQuestions.mockResolvedValue({
      items: [question('q-1', 12, { kind: 'LONG_STOP', kmAtStake: 1240, suspicious: 4 })],
      total: 1,
    });
    renderTab();

    expect(await screen.findByText('1,240 km depend on this answer')).toBeInTheDocument();
    expect(
      screen.getByText('Trucks stop here for a long time. Is this a delivery point?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 trips here look unusual/)).toBeInTheDocument();
  });
});
