import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AttentionCard from './AttentionCard';
import { fleetViewService } from '../../../services/fleetViewService';

vi.mock('../../../services/fleetViewService', () => ({
  fleetViewService: { getAttentionReview: vi.fn() },
}));

const DAY = '2026-11-04';
const READ = '2026-11-18T06:00:00Z';
const kindRow = (kind, count, period = 'day', extra = {}) => ({
  kind,
  count,
  period,
  state: count ? 'ok' : 'empty',
  readAt: READ,
  ...extra,
});
const SECTION = {
  state: 'ok',
  numbers: { attentionVersion: 2 },
  rows: [
    kindRow('sos', 0),
    kindRow('moneyTheft', 5),
    kindRow('routeDeviations', 2),
    kindRow('idling', 119, 'day', {
      numbers: {
        thresholdMin: 20,
        verifiedIdleMinutes: 8880,
        verifiedIdleMinutesUnknown: 3,
        unknownEngineState: 4,
      },
    }),
    kindRow('stuckAtPlant', 1),
    kindRow('papersWaiting', 0, 'live'),
    kindRow('documentsExpiring', 0, 'live'),
    kindRow('broadcastNotAcknowledged', 440, 'live'),
    kindRow('etaSlipping', null, 'day', { state: 'unmeasured' }),
  ],
};
const result = (extra = {}) => ({
  ...kindRow('moneyTheft', 5),
  day: DAY,
  page: 1,
  totalPages: 1,
  rows: [
    {
      id: 'loss-a',
      registrationNumber: 'TEST-A',
      missingL: 12,
      billedL: null,
      burnedL: 25,
      at: '2026-11-04T06:00:00Z',
    },
  ],
  ...extra,
});
const renderCard = (section = SECTION, day = DAY) =>
  render(
    <MemoryRouter>
      <AttentionCard key={day} section={section} day={day} onRetry={vi.fn()} />
    </MemoryRouter>,
  );

beforeEach(() => vi.resetAllMocks());

describe('Needs attention', () => {
  it('shows selected-day events and live queues separately, with explicit units and incomplete idle durations', () => {
    renderCard();
    expect(screen.getByText('4 Nov · IST')).toBeTruthy();
    expect(screen.getByText('Still open now')).toBeTruthy();
    expect(screen.getByText(/Includes earlier days · read 18 Nov/)).toBeTruthy();
    expect(
      screen.getByText(
        /148 h recorded · 3 unfinished durations excluded · 4 other events have unknown engine state/,
      ),
    ).toBeTruthy();
    expect(screen.getByText('No SOS or breakdown incidents recorded for this day.')).toBeTruthy();
    expect(screen.getByText('No expense bills awaiting review found.')).toBeTruthy();
    expect(screen.getByText('ETA delays are not tracked yet.')).toBeTruthy();
    expect(
      screen.queryByText(/567|in all|Broadcasts not acknowledged|Possible fuel theft/),
    ).toBeNull();
    const fuel = screen.getByRole('heading', { name: 'Suspected fuel loss' });
    const route = screen.getByRole('heading', { name: 'Route deviations' });
    expect(fuel.compareDocumentPosition(route) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens the exact selected-day loss evidence, distinguishing unknown litres from zero', async () => {
    fleetViewService.getAttentionReview.mockResolvedValue(result());
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Review Suspected fuel loss' }));
    const review = screen.getByRole('region', { name: 'Review Suspected fuel loss' });
    expect(await within(review).findByText('TEST-A')).toBeTruthy();
    expect(
      within(review).getByText('Missing: 12 L · billed: unknown · measured burn: 25 L'),
    ).toBeTruthy();
    expect(fleetViewService.getAttentionReview).toHaveBeenCalledWith({
      day: DAY,
      kind: 'moneyTheft',
      page: 1,
      signal: expect.any(AbortSignal),
    });
    expect(within(review).getByRole('link', { name: 'TEST-A' }).getAttribute('href')).toBe(
      '/vehicles/TEST-A',
    );
  });

  it('paginates matching records and updates a changed count when the review closes', async () => {
    fleetViewService.getAttentionReview.mockImplementation(async ({ page }) =>
      result({
        count: 21,
        totalPages: 2,
        page,
        rows: [{ id: `loss-${page}`, registrationNumber: `PAGE-${page}`, missingL: 4 }],
      }),
    );
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Review Suspected fuel loss' }));
    expect(await screen.findByText('PAGE-1')).toBeTruthy();
    expect(screen.getByText(/count changed since the card was read/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('PAGE-2')).toBeTruthy();
    expect(screen.queryByText('PAGE-1')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close review' }));
    expect(screen.queryByRole('region', { name: 'Review Suspected fuel loss' })).toBeNull();
    expect(screen.getByText('21')).toBeTruthy();
  });

  it('retries only a failed category and preserves other counts', async () => {
    const section = {
      ...SECTION,
      rows: SECTION.rows.map((r) =>
        r.kind === 'moneyTheft' ? { ...r, count: null, state: 'error' } : r,
      ),
    };
    fleetViewService.getAttentionReview
      .mockResolvedValueOnce(result({ state: 'error', count: null, rows: [] }))
      .mockResolvedValueOnce(result());
    renderCard(section);
    expect(screen.getByText('119')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Suspected fuel loss' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load these records");
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('TEST-A')).toBeTruthy();
    expect(screen.getByText('119')).toBeTruthy();
    expect(fleetViewService.getAttentionReview).toHaveBeenCalledTimes(2);
  });

  it('opens the current inbox without adding the selected historical date', async () => {
    fleetViewService.getAttentionReview.mockResolvedValue(
      result({
        kind: 'broadcastNotAcknowledged',
        period: 'live',
        count: 1,
        rows: [{ id: 'alert', subject: 'TEST-A', wants: 'Check the bill', at: READ }],
      }),
    );
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Review Alerts awaiting acknowledgement' }));
    const link = await screen.findByRole('link', { name: 'Open inbox to acknowledge alerts' });
    expect(link.getAttribute('href')).toBe('/alert-inbox?inboxStatus=OPEN');
    expect(screen.getByText('Open now · includes earlier days')).toBeTruthy();
  });

  it('cancels an in-flight review on a date change and does not show the previous date’s evidence', async () => {
    let finish;
    fleetViewService.getAttentionReview.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Review Suspected fuel loss' }));
    const signal = fleetViewService.getAttentionReview.mock.calls[0][0].signal;
    view.rerender(
      <MemoryRouter>
        <AttentionCard key="2026-11-05" section={SECTION} day="2026-11-05" />
      </MemoryRouter>,
    );
    expect(signal.aborted).toBe(true);
    finish(result());
    await waitFor(() => expect(screen.getByText('5 Nov · IST')).toBeTruthy());
    expect(screen.queryByText('TEST-A')).toBeNull();
  });

  it('does not pretend an older combined theft/deviation response has separate counts', () => {
    renderCard({ state: 'ok', numbers: { total: 7 }, rows: [kindRow('moneyTheft', 7)] });
    expect(screen.getByText(/Attention details are unavailable/)).toBeTruthy();
    expect(screen.queryByText('7')).toBeNull();
  });
});
