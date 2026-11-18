import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AttentionCard from './AttentionCard';

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
    kindRow('moneyTheft', 2, 'day', {
      rows: [
        { id: 'l1', registrationNumber: 'WB11T0662', missingL: 329.7 },
        { id: 'l2', registrationNumber: 'WB11L8862', missingL: 255.2 },
      ],
    }),
    kindRow('routeDeviations', 2),
    kindRow('idling', 119, 'day', { numbers: { thresholdMin: 20, verifiedIdleMinutes: 8880 } }),
    kindRow('stuckAtPlant', 1),
    kindRow('papersWaiting', 3, 'live'),
    kindRow('documentsExpiring', 0, 'live'),
    kindRow('broadcastNotAcknowledged', 280, 'live'),
    kindRow('etaSlipping', null, 'day', { state: 'unmeasured' }),
  ],
};
const renderCard = (section = SECTION, day = DAY) =>
  render(
    <MemoryRouter>
      <AttentionCard section={section} day={day} />
    </MemoryRouter>,
  );
const reviewHref = (label) =>
  screen.getByRole('link', { name: `Review ${label}` }).getAttribute('href');

describe('Needs attention', () => {
  it('shows the chosen day and the open queues separately, in plain words', () => {
    renderCard();
    expect(screen.getByText('On 4 Nov')).toBeTruthy();
    expect(screen.getByText('Still open now')).toBeTruthy();
    expect(screen.getByText(/Includes earlier days · updated 18 Nov/)).toBeTruthy();
    expect(
      screen.getByText(/Engine left on at a stop for 20 min or more · 148 h in total\./),
    ).toBeTruthy();
    expect(screen.getByText('No SOS and breakdowns on this day.')).toBeTruthy();
    expect(screen.getByText('No documents to renew right now.')).toBeTruthy();
    expect(screen.getByText('Late arrivals are not tracked yet.')).toBeTruthy();
    expect(screen.queryByText(/in all|unfinished|engine state/)).toBeNull();
  });

  it('Review opens the page that handles it — never a panel inside the digest', () => {
    renderCard();
    // Day events open their page on the chosen day.
    expect(reviewHref('Off-route trips')).toBe(
      '/intelligence?tab=detours&from=2026-11-04&to=2026-11-04',
    );
    expect(reviewHref('Long idling')).toBe(
      '/intelligence?tab=idling&idleSubview=instances&idleView=spots&from=2026-11-04&to=2026-11-04',
    );
    expect(reviewHref('Long waits at plants')).toBe(
      '/auto-trips?tab=history&minDwellMin=180&from=2026-11-04&to=2026-11-04&range=custom',
    );
    // Open queues hold earlier days too: no date, or some items would be hidden.
    expect(reviewHref('Bills to approve')).toBe('/khata-ledger?tab=all&expenseStatus=PENDING');
    expect(reviewHref('Alerts to acknowledge')).toBe('/alert-inbox?inboxStatus=OPEN');
    expect(screen.queryByRole('region', { name: /^Review / })).toBeNull();
  });

  it('names the trucks with possible fuel loss, each opening its own Fuel tab (no page lists them)', () => {
    renderCard();
    expect(screen.queryByRole('link', { name: 'Review Possible fuel loss' })).toBeNull();
    const chip = screen.getByRole('link', { name: /WB11T0662/ });
    expect(chip.getAttribute('href')).toBe('/vehicles/WB11T0662?tab=fuel');
    expect(chip.textContent).toContain('329.7 L missing');
    expect(screen.getByRole('link', { name: /WB11L8862/ })).toBeTruthy();
  });

  it('says a day is not checked yet instead of "none" while the fuel check has not run', () => {
    renderCard({
      ...SECTION,
      rows: SECTION.rows.map((r) =>
        r.kind === 'moneyTheft' ? { ...r, count: null, state: 'pending', rows: [] } : r,
      ),
    });
    expect(screen.getByText('Fuel loss is checked after the day ends.')).toBeTruthy();
    expect(screen.queryByText('No possible fuel loss on this day.')).toBeNull();
  });

  it('a category that failed to load says so and shows no count', () => {
    renderCard({
      ...SECTION,
      rows: SECTION.rows.map((r) =>
        r.kind === 'moneyTheft' ? { ...r, count: null, state: 'error' } : r,
      ),
    });
    expect(screen.getByText('Could not load this. Try again.')).toBeTruthy();
    expect(screen.getByText('280')).toBeTruthy();
  });

  it('draws an older server’s counts the same way, naming its combined theft/deviation count honestly', () => {
    renderCard({
      state: 'ok',
      numbers: { total: 7 },
      rows: [
        { kind: 'moneyTheft', count: 7 },
        { kind: 'papersWaiting', count: 2 },
        { kind: 'sos', count: 0 },
      ],
    });
    expect(
      screen.getByRole('heading', { name: 'Possible fuel loss or off-route trips' }),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Possible fuel loss' })).toBeNull();
    expect(reviewHref('Bills to approve')).toBe('/khata-ledger?tab=all&expenseStatus=PENDING');
    expect(screen.getByText('No SOS and breakdowns on this day.')).toBeTruthy();
  });
});
