import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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
      },
    },
    {
      id: 'exceptions',
      title: 'Exceptions',
      state: 'ok',
      numbers: {
        total: 3,
        kinds: [
          { kind: 'moneyTheft', count: 2 },
          { kind: 'sos', count: 1 },
        ],
      },
      rows: [
        { kind: 'moneyTheft', count: 2 },
        { kind: 'sos', count: 1 },
        { kind: 'papersWaiting', count: 0 },
        { kind: 'etaSlipping', count: null, note: 'not built yet' },
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
    expect(screen.getByText('— Not measured: At plant')).toBeTruthy();
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

  it('keeps "How we know" behind an info tip and writes its timestamps for a person', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    // Collapsed until asked for.
    expect(screen.queryByText(/\(as of [^)]+\)/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'How we know: Fleet now' }));
    expect(await screen.findByText(/\(as of [^)]+\)/)).toBeTruthy();
    expect(screen.queryByText(/T00:49/)).toBeNull();
  });

  it('bars the counted exception kinds, biggest first, and names the rest in one line', async () => {
    renderPanel();

    const theft = (await screen.findByText('Possible fuel theft')).closest('a');
    const sos = screen.getByText('SOS').closest('a');
    expect(theft.getAttribute('href')).toBe('/intelligence?tab=fuel');
    expect(sos.getAttribute('href')).toBe('/alert-inbox');
    // biggest first
    expect(theft.compareDocumentPosition(sos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // a zero is "none today", an unbuilt kind is "not measured" — never a bar
    expect(screen.queryByText('Papers waiting')).toBeNull();
    expect(screen.getByText(/None today: Papers waiting\./)).toBeTruthy();
    expect(screen.getByText(/Not measured yet: ETA slipping\./)).toBeTruthy();
    expect(screen.queryByText('kinds')).toBeNull();
    expect(screen.getByText('3 in all')).toBeTruthy();
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
    expect(screen.getByText(/Day not over yet: km vs last 7-day average/)).toBeTruthy();
    const kpis = within(screen.getByRole('region', { name: 'Key numbers for the day' }));
    expect(kpis.getByRole('link', { name: /Trips today/ })).toHaveTextContent('0');
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
});
