import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
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
      footer: { text: 'How we know: LiveVehiclePosition (live tracking)' },
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

describe('OwnerReportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fleetViewService.getMorningBrief.mockResolvedValue({
      date: '2026-11-04',
      totalRupees: 0,
      sections: [],
    });
    fleetViewService.getOwnerReport.mockResolvedValue(REPORT);
  });

  it('shows every section with its own state: ok, empty and error', async () => {
    render(<OwnerReportPanel day="2026-11-04" digest={{ goodDrivers: [], needsAttention: [] }} />);

    await waitFor(() => expect(screen.getByText('Fleet now')).toBeTruthy());

    // ok — the numbers are shown, and an unmeasured one is a dash, not a zero.
    expect(screen.getByText('Measured')).toBeTruthy();
    expect(screen.getByText('moving')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('at plant')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    // empty — one line of reason, and no number dressed as a zero.
    expect(screen.getByText('Nothing yet')).toBeTruthy();
    expect(screen.getByText('not built yet')).toBeTruthy();

    // error — the section is still there, with a retry.
    expect(screen.getByText(/Couldn't load/)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('query failed')).toBeTruthy();
  });

  it('always renders both people lists, and says "No one this time" when one is empty', async () => {
    render(<OwnerReportPanel day="2026-11-04" digest={{ goodDrivers: [], needsAttention: [] }} />);

    await waitFor(() => expect(screen.getByText('Who drove well')).toBeTruthy());
    expect(screen.getByText('Who needs a word')).toBeTruthy();
    expect(screen.getAllByText('No one this time')).toHaveLength(2);
  });

  it('names the drivers who drove well when there are any', async () => {
    render(
      <OwnerReportPanel
        day="2026-11-04"
        digest={{
          goodDrivers: [
            { id: 'drv-1', name: 'Ramesh Yadav', grade: 'EXCELLENT', score: 92 },
          ],
          needsAttention: [],
        }}
      />,
    );

    await waitFor(() => expect(screen.getByText('Ramesh Yadav')).toBeTruthy());
    expect(screen.getByText('92')).toBeTruthy();
    expect(screen.getAllByText('No one this time')).toHaveLength(1);
  });
});
