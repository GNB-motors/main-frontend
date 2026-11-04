import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

const TODAY_IST = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const renderPanel = (day = '2026-11-04', digest = { goodDrivers: [], needsAttention: [] }) =>
  render(
    <MemoryRouter>
      <OwnerReportPanel day={day} digest={digest} />
    </MemoryRouter>,
  );

describe('OwnerReportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('shows every section with its own state: ok, empty and error', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    // ok — the numbers are shown, and an unmeasured one is a dash, not a zero.
    expect(screen.getAllByText('Measured').length).toBeGreaterThan(0);
    expect(screen.getByText('Moving')).toBeTruthy();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('At plant')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    // empty — one line of reason, and no number dressed as a zero.
    expect(screen.getByText('Nothing yet')).toBeTruthy();
    expect(screen.getByText('not built yet')).toBeTruthy();

    // error — the section is still there, with a retry.
    expect(screen.getByText(/Couldn't load/)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('query failed')).toBeTruthy();
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

    const open = screen.getByText('Open →');
    expect(open.getAttribute('href')).toBe('/live-tracking');
  });

  it('keeps "How we know" collapsed and writes its timestamps for a person', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    expect(screen.getAllByText('How we know').length).toBeGreaterThan(0);
    expect(screen.getByText(/\(as of [^)]+\)/)).toBeTruthy();
    expect(screen.queryByText(/T00:49/)).toBeNull();
  });

  it('lists the exception kinds once, biggest first, and drops the empty ones', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Exceptions')).toBeTruthy());

    expect(screen.getByText('Possible fuel theft')).toBeTruthy();
    expect(screen.getByText('SOS')).toBeTruthy();
    expect(screen.queryByText('Papers waiting')).toBeNull();
    expect(screen.queryByText('ETA slipping')).toBeNull();
    expect(screen.queryByText('kinds')).toBeNull();
  });

  it('writes the morning brief the way an owner reads it', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Morning brief')).toBeTruthy());

    expect(screen.getByText('₹17,636')).toBeTruthy();
    expect(screen.getByText(/lost · /)).toBeTruthy();
    expect(screen.getByText('₹2,207')).toBeTruthy();
    expect(screen.getByText('₹270')).toBeTruthy();
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
    expect(screen.getAllByText('Day not over yet').length).toBeGreaterThan(0);
    expect(screen.queryByText('-100.0%')).toBeNull();
  });

  it('always renders both people lists, and says "No one this time" when one is empty', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Who drove well')).toBeTruthy());
    expect(screen.getByText('Who needs a word')).toBeTruthy();
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
