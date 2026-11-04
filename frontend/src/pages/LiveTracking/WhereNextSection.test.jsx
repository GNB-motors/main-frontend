import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { getWhereNext } = vi.hoisted(() => ({ getWhereNext: vi.fn() }));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getWhereNext },
}));

import WhereNextSection from './WhereNextSection';

const destination = {
  place: { id: 'site-dankuni', kind: 'SITE', name: 'DANKUNI SIDING', category: 'PLANT', lat: 22.6, lng: 88.3, radiusM: 500 },
  probability: 0.75,
  reason: 'Usually goes here after JK BUXAR (18 of 24 times)',
  eta: {
    at: '2026-11-02T19:10:00Z',
    earliestAt: '2026-11-02T18:40:00Z',
    latestAt: '2026-11-02T20:00:00Z',
    driveMin: 200,
    breakMin: 40,
    congestion: 'HEAVY',
    congestionWhy: 'Usual for Monday 18:00 on this road',
  },
  route: { polyline: [], km: 412, viaNames: ['NH19', 'Mohania'], usedTimes: 18 },
  breakHabit: {
    probability: 0.62,
    usualPlace: null,
    usualMin: 40,
    text: 'Usually stops 40 min at Mohania dhaba',
  },
  overspeedRisk: { probability: 0.4, place: null, text: 'Has gone over 60 km/h near Sasaram 3 times this month' },
};

describe('WhereNextSection', () => {
  beforeEach(() => {
    getWhereNext.mockReset();
  });

  it('asks for the prediction once, for the truck on screen', async () => {
    getWhereNext.mockResolvedValue({ destinations: [destination], basis: null, computedAt: null });
    render(<WhereNextSection registrationNumber="WB11L8862" />);
    await waitFor(() => expect(getWhereNext).toHaveBeenCalledTimes(1));
    expect(getWhereNext.mock.calls[0][0]).toBe('WB11L8862');
  });

  it('shows the top guess in the collapsed header once it knows it', async () => {
    getWhereNext.mockResolvedValue({ destinations: [destination], basis: null, computedAt: null });
    render(<WhereNextSection registrationNumber="WB11L8862" />);
    await waitFor(() =>
      expect(screen.getByText(/Likely → DANKUNI SIDING/)).toBeInTheDocument(),
    );
  });

  it('never shows a held guess in the header, and says why it is held', async () => {
    getWhereNext.mockResolvedValue({
      held: true,
      destinations: [destination],
      basis: { text: 'Last fix is not near any of this org\'s places.' },
    });
    render(<WhereNextSection registrationNumber="WB11J8562" />);
    expect(await screen.findByText('Where next · not sure yet')).toBeInTheDocument();
    expect(screen.queryByText(/Likely →/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText(/not near any of this org's places/)).toBeInTheDocument();
  });

  it('prints the reason the API gave, in words', async () => {
    getWhereNext.mockResolvedValue({ destinations: [destination], basis: null, computedAt: null });
    render(<WhereNextSection registrationNumber="WB11L8862" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await waitFor(() =>
      expect(screen.getByText('Usually goes here after JK BUXAR (18 of 24 times)')).toBeInTheDocument(),
    );
  });

  it('never shows a raw probability', async () => {
    getWhereNext.mockResolvedValue({ destinations: [destination], basis: null, computedAt: null });
    render(<WhereNextSection registrationNumber="WB11L8862" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await waitFor(() => expect(screen.getAllByText(/18 of 24 times/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/0\.75/)).not.toBeInTheDocument();
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('says the answer is not ready when the backend holds it', async () => {
    getWhereNext.mockResolvedValue({
      held: true,
      why: { text: 'Still being checked.', basis: '122 of 196 rows' },
    });
    render(<WhereNextSection registrationNumber="WB11L8862" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await waitFor(() => expect(screen.getByText('Not shown yet')).toBeInTheDocument());
  });

  // The endpoint is not on prod yet: a failed request, or no guess, is
  // nothing real to say — the section is not drawn at all (it used to print a
  // sentence under a truck that was plainly moving).
  it('draws nothing when the request fails', async () => {
    getWhereNext.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
    const { container } = render(<WhereNextSection registrationNumber="WB11L8862" />);
    await waitFor(() => expect(getWhereNext).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('draws nothing when there are no destinations', async () => {
    getWhereNext.mockResolvedValue({
      destinations: [],
      basis: null,
      computedAt: null,
      noPredictionWhy: { text: 'We do not have enough of this truck’s history to guess.' },
    });
    const { container } = render(<WhereNextSection registrationNumber="WB11L8862" />);
    await waitFor(() => expect(getWhereNext).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText(/do not have enough of this truck/)).not.toBeInTheDocument();
  });
});
