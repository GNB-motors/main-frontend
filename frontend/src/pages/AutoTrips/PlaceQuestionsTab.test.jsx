import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./PlaceReviewMap', () => ({ default: () => <div aria-label="Stop location map" /> }));
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
    vi.resetAllMocks();
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

    fireEvent.click(await screen.findByRole('button', { name: 'Review Place q-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm place' }));

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

    fireEvent.click(await screen.findByRole('button', { name: 'Review Place q-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm place' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Done: 2 trips updated'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps the queue in the order the server sent it', async () => {
    fleetViewService.getPlaceQuestions.mockResolvedValue({
      items: [question('q-1', 12), question('q-2', 340), question('q-3', 7)],
      total: 3,
    });
    renderTab();

    await screen.findByRole('button', { name: 'Review Place q-1' });
    const cards = within(screen.getByLabelText('Places to review')).getAllByRole('article');
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      'Place q-1',
      'Place q-2',
      'Place q-3',
    ]);
    expect(within(cards[0]).getByText(/12 trips/)).toBeInTheDocument();
    expect(within(cards[1]).getByText(/340 trips/)).toBeInTheDocument();
    expect(within(cards[2]).getByText(/7 trips/)).toBeInTheDocument();
  });

  it('shows the kilometres at stake when the server sends them', async () => {
    fleetViewService.getPlaceQuestions.mockResolvedValue({
      items: [question('q-1', 12, { kind: 'LONG_STOP', kmAtStake: 1240, suspicious: 4 })],
      total: 1,
    });
    renderTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Review Place q-1' }));
    expect(await screen.findByText('1,240 km depend on this answer')).toBeInTheDocument();
    expect(
      screen.getByText('Trucks stop here for a long time. Is this a delivery point?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 trips here look unusual/)).toBeInTheDocument();
  });
  it('confirms only selected suggestions and keeps failed places available for retry', async () => {
    const refetch = vi.fn();
    const onAnswered = vi.fn();
    const items = [question('q-1', 12), question('q-2', 7), question('q-3', 2)];
    fleetViewService.answerPlaceQuestion
      .mockResolvedValueOnce({ placeId: 'saved', tripsUpdated: 4 })
      .mockRejectedValueOnce(new Error('Try again'));
    render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items, total: 3 }, refetch }} onAnswered={onAnswered} />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('checkbox').every((input) => !input.checked)).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Place q-1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Place q-2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm 2 selected places' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.queryByText('Place q-3')).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Confirm 2 places' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fleetViewService.answerPlaceQuestion.mock.calls.map(([id]) => id)).toEqual([
      'q-1',
      'q-2',
    ]);
    expect(screen.queryByRole('button', { name: 'Review Place q-1' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Place q-2' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Place q-3' })).not.toBeChecked();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('1 place could not be confirmed'),
    );
    expect(refetch).toHaveBeenCalledOnce();
    expect(onAnswered).toHaveBeenCalledOnce();
  });

  it('resets edits when switching places and keeps review read-only for viewers', async () => {
    const items = [question('q-1', 12), question('q-2', 7)];
    const { rerender } = render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items } }} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Review Place q-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit name or type' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Place name' }), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Review Place q-2' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit name or type' }));
    expect(screen.getByRole('textbox', { name: 'Place name' })).toHaveValue('Place q-2');
    rerender(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items } }} canAnswer={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save place' })).not.toBeInTheDocument();
    expect(screen.getByText('Ask your manager to answer this.')).toBeInTheDocument();
  });

  it('opens the first place automatically, keeps bulk selection empty and advances after saving', async () => {
    const items = [question('first', 8), question('second', 4)];
    fleetViewService.answerPlaceQuestion.mockResolvedValue({ placeId: 'saved', tripsUpdated: 2 });
    render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items } }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Review Place first' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('checkbox').every((input) => !input.checked)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm place' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Review Place second' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
  });

  it('keeps a failed naming modal and its draft open, then saves and advances on retry', async () => {
    const items = [question('first', 8), question('second', 4)];
    fleetViewService.answerPlaceQuestion
      .mockRejectedValueOnce(new Error('Please try again'))
      .mockResolvedValueOnce({ placeId: 'saved', tripsUpdated: 1 });
    render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items } }} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit name or type' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Edit place' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Place name' }), {
      target: { value: '  New yard  ' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Save place' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent('Please try again');
    expect(dialog.getByRole('textbox', { name: 'Place name' })).toHaveValue('  New yard  ');
    fireEvent.click(dialog.getByRole('button', { name: 'Save place' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fleetViewService.answerPlaceQuestion).toHaveBeenLastCalledWith('first', {
      answer: 'RENAME',
      name: 'New yard',
      category: 'PLANT',
    });
    expect(screen.getByRole('button', { name: 'Review Place second' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows the list and detail skeletons while loading, then automatically opens the first result', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ loading: true }} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Loading places to review')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: /Confirm/ })).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ loading: false, data: { items: [question('first', 4)] } }} />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText('Loading places to review')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review Place first' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('names an unnamed place in the dialog and requires choosing its type before saving', async () => {
    const items = [question('unnamed', 2, { suggestion: null })];
    fleetViewService.answerPlaceQuestion.mockResolvedValue({ placeId: 'saved', tripsUpdated: 1 });
    render(
      <MemoryRouter>
        <PlaceQuestionsTab query={{ data: { items } }} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Name this place' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Name this place' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Place name' }), {
      target: { value: 'New delivery yard' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Save place' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent('Choose a place type');
    expect(fleetViewService.answerPlaceQuestion).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('combobox', { name: 'Place type' }));
    const option = await screen.findByRole('option', { name: 'Delivery / unloading point' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option);
    fireEvent.click(dialog.getByRole('button', { name: 'Save place' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fleetViewService.answerPlaceQuestion).toHaveBeenCalledWith('unnamed', {
      answer: 'RENAME',
      name: 'New delivery yard',
      category: 'UNLOADING',
    });
    expect(screen.getByRole('status')).toHaveTextContent('All places reviewed');
  });
});
