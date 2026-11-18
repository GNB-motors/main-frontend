import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import OwnerReportPanel from './OwnerReportPanel';
import { fleetViewService } from '../../services/fleetViewService';

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: {
    getMorningBrief: vi.fn(),
    getOwnerReport: vi.fn(),
  },
}));

const REPORT = {
  day: '2026-11-04',
  generatedAt: '2026-11-04T04:00:00.000Z',
  sections: [
    {
      id: 'fleetNow',
      title: 'Fleet now',
      state: 'ok',
      numbers: { moving: 3, atPlant: null },
      notes: ['truck-state model not built yet'],
      rows: { drill: 'fleet.livePositions', params: { orgId: 'org-1', branchId: null } },
      footer: {
        text: 'How we know: LiveVehiclePosition (live tracking) (as of 2026-11-04T00:49:43.105Z)',
        sources: [
          { name: 'LiveVehiclePosition (live tracking)', freshAsOf: '2026-11-04T00:49:43.105Z' },
        ],
      },
    },
    {
      id: 'moneyOut',
      title: 'Money out',
      state: 'empty',
      numbers: {},
      notes: ['sensor litres unavailable for this day — bills shown alone'],
      footer: {
        text: 'How we know: TripFuelLog (no data yet) — sensor litres unavailable',
        sources: [],
      },
    },
    {
      id: 'exceptions',
      title: 'Exceptions',
      state: 'ok',
      numbers: {
        attentionVersion: 2,
        kinds: [
          { kind: 'moneyTheft', count: 2 },
          { kind: 'sos', count: 1 },
        ],
      },
      rows: [
        { kind: 'sos', period: 'day', state: 'ok', count: 1 },
        { kind: 'moneyTheft', period: 'day', state: 'ok', count: 2 },
        { kind: 'papersWaiting', period: 'live', state: 'empty', count: 0 },
        { kind: 'etaSlipping', period: 'day', state: 'unmeasured', count: null },
      ],
      notes: [],
      footer: { text: 'How we know: no source yet' },
    },
    {
      id: 'people',
      title: 'People',
      state: 'empty',
      numbers: { driversOnDuty: null },
      notes: ['not built yet'],
      footer: { text: 'How we know: no source yet' },
    },
    {
      id: 'moneyIn',
      title: 'Money in',
      state: 'error',
      numbers: {},
      notes: [],
      error: 'query failed',
      footer: { text: 'How we know: no source yet' },
    },
  ],
};

const TODAY_IST = '2026-11-04';

const renderPanel = (day = '2026-11-04', digest = { goodDrivers: [], needsAttention: [] }) =>
  render(
    <MemoryRouter>
      <OwnerReportPanel day={day} digest={digest} />
    </MemoryRouter>,
  );

describe('OwnerReportPanel', () => {
  it('explains the server overlap deduction without showing additive category percentages', async () => {
    fleetViewService.getMorningBrief.mockResolvedValue({
      totalRupees: 20675,
      totalRule: 'per truck, the larger of excess idling and fuel over expected — never both',
      sections: [
        { key: 'fuelOverModel', rupees: 18592, vehicles: [] },
        { key: 'excessIdling', rupees: 4367, vehicles: [] },
      ],
    });
    const { container } = renderPanel();
    const math = await screen.findByLabelText('How the fuel cost total is calculated');
    expect(within(math).getByText('₹22,959')).toBeTruthy();
    expect(within(math).getByText('−₹2,284')).toBeTruthy();
    expect(within(math).getByText('₹20,675')).toBeTruthy();
    expect(container.querySelector('.db-leak-share, .db-leak-split')).toBeNull();
  });

  it('keeps an unavailable total unknown and does not invent an overlap deduction', async () => {
    fleetViewService.getMorningBrief.mockResolvedValue({
      totalRupees: null,
      totalRule: 'per truck, the larger of excess idling and fuel over expected — never both',
      sections: [{ key: 'excessIdling', rupees: null, vehicles: [] }],
    });
    renderPanel();
    expect(await screen.findByText('Not estimated for this day')).toBeTruthy();
    expect(screen.queryByLabelText('How the fuel cost total is calculated')).toBeNull();
  });

  it('shows calculated losses with an explicit incomplete-data notice', async () => {
    fleetViewService.getMorningBrief.mockResolvedValue({
      date: TODAY_IST,
      totalRupees: 89900,
      partial: true,
      coverageNote: 'Some losses are not included: 1 item could not be calculated.',
      sections: [
        {
          key: 'excessIdling',
          label: 'Diesel used while stopped',
          status: 'partial',
          partial: true,
          rupees: 89900,
          coverageNote: '1 idle event is not included because consumption is unavailable.',
          vehicles: [{ registrationNumber: 'AA1', rupees: 89900, partial: true }],
        },
      ],
    });
    renderPanel();
    await waitFor(() => expect(screen.getAllByText('₹89,900').length).toBeGreaterThan(0));
    expect(screen.getByText(/Some losses are not included/)).toBeTruthy();
    expect(screen.getByText(/1 idle event is not included/)).toBeTruthy();
    expect(screen.getAllByText(/Incomplete/).length).toBeGreaterThan(0);
    // An older server still calls it "Diesel used while stopped": the owner reads "Idling".
    expect(screen.getByText('Idling')).toBeTruthy();
    expect(screen.queryByText('Diesel used while stopped')).toBeNull();
  });

  beforeEach(() => {
    // Keep the fixture day "today" in IST, regardless of the machine's clock.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-04T06:30:00Z'));
    vi.resetAllMocks();
    fleetViewService.getMorningBrief.mockResolvedValue({
      date: '2026-11-04',
      totalRupees: 17635.8,
      sections: [
        {
          key: 'moneyTheft',
          label: 'Fuel theft',
          status: 'ok',
          rupees: 2206.85,
          suggestedAction: 'Check the receipts',
          vehicles: [{ registrationNumber: 'MH12AB1234', rupees: 269.8 }],
        },
      ],
    });
    fleetViewService.getOwnerReport.mockResolvedValue(REPORT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows every section with its own state: ok, empty and error', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    // ok — the numbers are shown, and an unmeasured one is a dash with its
    // reason, grouped on one line instead of a column of dashes.
    expect(screen.getByText('Moving')).toBeTruthy();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('— Not available yet: At plant')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    // empty — one line of reason, and no number dressed as a zero.
    expect(screen.getByText('Not tracked yet: People')).toBeTruthy();

    // error — the section is still there, with a retry.
    expect(screen.getByText(/Couldn't load/)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('query failed')).toBeTruthy();
  });

  it('uses toll wording for the earlier response that grouped toll charges under expenses', async () => {
    fleetViewService.getOwnerReport.mockResolvedValue({
      ...REPORT,
      sections: [
        {
          id: 'moneyOut',
          title: 'Money out',
          state: 'ok',
          notes: [],
          numbers: {
            tollCount: null,
            tollInr: null,
            tollUnknownCount: null,
            expenseApprovedCount: 13,
            expenseApprovedInr: 2930,
            expenseRejectedCount: 4,
          },
        },
      ],
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('Toll crossings')).toBeTruthy());
    expect(screen.getByText('Toll crossings').closest('div').textContent).toContain('13');
    expect(screen.getByText('Estimated toll cost').closest('div').textContent).toContain('₹2,930');
    expect(screen.getByText('Ignored toll crossing records').closest('div').textContent).toContain(
      '4',
    );
    expect(screen.queryByText('Approved bills')).toBeNull();
    expect(screen.queryByText('Approved bill amount')).toBeNull();
  });

  it('labels detected crossings and estimates separately from approved bills', async () => {
    fleetViewService.getOwnerReport.mockResolvedValue({
      ...REPORT,
      sections: [
        {
          id: 'moneyOut',
          title: 'Money out',
          state: 'ok',
          notes: [],
          numbers: {
            tollCount: 13,
            tollInr: 2930,
            tollUnknownCount: 8,
            expenseApprovedCount: 0,
            expenseApprovedInr: 0,
            expenseRejectedCount: 0,
          },
        },
      ],
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('Detected toll crossings')).toBeTruthy());
    expect(screen.getByText('Detected toll crossings').closest('div').textContent).toContain('13');
    expect(screen.getByText('Estimated toll cost').closest('div').textContent).toContain('₹2,930');
    expect(
      screen.getByText('Crossings with unknown toll cost').closest('div').textContent,
    ).toContain('8');
    expect(screen.getByText('Approved bills').closest('div').textContent).toContain('0');
    expect(screen.queryByText('Expenses approved')).toBeNull();
  });

  it('says a partly measured section instead of dropping the flag', async () => {
    fleetViewService.getOwnerReport.mockResolvedValue({
      ...REPORT,
      sections: [
        {
          id: 'yesterdaysWork',
          title: "Yesterday's work",
          state: 'ok',
          numbers: { trips: 9, km: 325, kmPartial: true },
          notes: [],
        },
      ],
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('Partly measured')).toBeTruthy());
    expect(screen.getByText(/Some distance was not measured/)).toBeTruthy();
  });

  it('never prints the drill target, its params or a raw key', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    expect(screen.queryByText(/drill/i)).toBeNull();
    expect(screen.queryByText(/params/i)).toBeNull();
    expect(screen.queryByText(/\[object Object\]/)).toBeNull();
    expect(screen.queryByText('moving')).toBeNull();
  });

  it('gives a section one small link to the page its drill points at', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    const open = screen.getByRole('link', { name: 'Open' });
    expect(open.getAttribute('href')).toBe('/live-tracking');
  });

  it('explains a section in one plain line behind its info tip, with a readable update time', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());
    // Info tips open on hover and keyboard focus, not on a click.
    const tip = screen.getByRole('button', { name: 'About Fleet now' });
    act(() => tip.focus());
    fireEvent.focus(tip);
    expect(
      await screen.findByText('Where your trucks are right now, from their live GPS.'),
    ).toBeTruthy();
    expect(screen.getByText(/^Updated 4 Nov, 6:19 am$/)).toBeTruthy();
    // No engineer words: source model names, raw timestamps, method notes.
    expect(screen.queryByText(/LiveVehiclePosition|T00:49|truck-state model/)).toBeNull();
  });

  it('says an empty section in one short sentence, without the method notes', async () => {
    renderPanel();
    expect(
      await screen.findByText('No diesel bills or expenses were recorded for this day.'),
    ).toBeTruthy();
    expect(screen.queryByText(/sensor litres unavailable/)).toBeNull();
  });

  it('separates day events from open queues without a misleading combined total', async () => {
    renderPanel();
    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Needs attention' });
    expect(within(card).getByText('Possible fuel loss')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Review SOS and breakdowns' })).toBeTruthy();
    expect(within(card).getByText('Still open now')).toBeTruthy();
    expect(within(card).getByText('No bills to approve right now.')).toBeTruthy();
    expect(within(card).getByText('Late arrivals are not tracked yet.')).toBeTruthy();
    expect(within(card).queryByText(/in all/)).toBeNull();
    expect(within(card).queryByText('Possible fuel theft')).toBeNull();
  });

  it('writes the morning brief the way an owner reads it', async () => {
    renderPanel();

    await screen.findByText('estimated extra fuel cost for this period');

    expect(screen.getAllByText('₹17,636').length).toBeGreaterThan(0);
    expect(screen.getByText('estimated extra fuel cost for this period')).toBeTruthy();
    expect(screen.getByText('₹2,207')).toBeTruthy();
    expect(screen.getByText('Check the receipts')).toBeTruthy();
    // each truck is a chip that opens its own page
    const chip = screen.getByText('MH12AB1234').closest('a');
    expect(chip.getAttribute('href')).toBe('/vehicles/MH12AB1234');
    expect(chip.textContent).toContain('₹270');
    expect(screen.queryByText('17,635.8')).toBeNull();
  });

  it('calls the day "Today so far" and leaves a live day\'s percentages open', async () => {
    fleetViewService.getOwnerReport.mockResolvedValue({
      day: TODAY_IST,
      sections: [
        {
          id: 'yesterdaysWork',
          title: "Yesterday's work",
          state: 'ok',
          numbers: { trips: 0, km: 0, kmVsPrev7Pct: -100 },
          rows: null,
          notes: [],
          footer: { text: 'How we know: AutoTrip' },
        },
      ],
    });

    renderPanel(TODAY_IST);

    await waitFor(() => expect(screen.getByText('Today so far')).toBeTruthy());
    expect(screen.queryByText("Yesterday's work")).toBeNull();
    expect(screen.getByText(/Day not over yet: Km vs last 7 days/)).toBeTruthy();
    const kpis = within(screen.getByRole('region', { name: 'Key numbers for the day' }));
    expect(kpis.getByRole('link', { name: /Trips started today/ })).toHaveTextContent('0');
    expect(kpis.getByRole('link', { name: /km today/ })).toHaveTextContent('0');
    expect(kpis.getByText('Completed / confirmed · so far today')).toBeInTheDocument();
    const work = within(screen.getByText('Today so far').closest('section'));
    expect(work.getByText('0')).toBeInTheDocument();
    expect(work.getByText('0 km')).toBeInTheDocument();
    expect(screen.queryByText(/Not counted yet: Trips, Distance covered/)).toBeNull();
    expect(screen.queryByText('-100.0%')).toBeNull();
  });

  it('keeps both driver cards visible when no driver scores are available', async () => {
    renderPanel();

    await screen.findByRole('heading', { name: 'Who drove well' });
    expect(screen.getByRole('heading', { name: 'Who needs a word' })).toBeInTheDocument();
    expect(screen.getAllByText('No one this time')).toHaveLength(2);
  });

  it('names the drivers who drove well when there are any', async () => {
    renderPanel('2026-11-04', {
      goodDrivers: [{ id: 'drv-1', name: 'Ramesh Yadav', grade: 'EXCELLENT', score: 92 }],
      needsAttention: [],
    });

    await waitFor(() => expect(screen.getByText('Ramesh Yadav')).toBeTruthy());
    expect(screen.getByText('92')).toBeTruthy();
    expect(screen.getAllByText('No one this time')).toHaveLength(1);
  });

  it('on a past day names the day card by its date and marks the live cards', async () => {
    renderPanel('2026-10-28');
    expect(await screen.findByText('Fleet now')).toBeTruthy();
    // Fleet now is read live: on a past day it carries the "Live" tag.
    expect((await screen.findAllByText('Live')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Fleet at /)).toBeNull();
  });
});
