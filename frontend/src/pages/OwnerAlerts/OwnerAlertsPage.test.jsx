import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getAlerts } = vi.hoisted(() => ({ getAlerts: vi.fn() }));

vi.mock('./OwnerAlertsService.js', async (importOriginal) => {
  const actual = await importOriginal();
  // Keep the real view logic (severity + 400 fallback); fake only the HTTP call.
  actual.OwnerAlertsService.getAlerts = getAlerts;
  return actual;
});

import OwnerAlertsPage from './OwnerAlertsPage';

const criticalRow = {
  id: 'a1',
  type: 'FUEL_SIPHON_SUSPECTED',
  severity: 'CRITICAL',
  vehicleNumber: 'WB11G0662',
  message: 'Fuel went down while parked.',
  at: '2026-11-03T05:00:00Z',
  acknowledged: false,
};

function serverAnswer({
  records = [criticalRow],
  counts = { critical: 3, warning: 140, trucksCritical: 2 },
} = {}) {
  return {
    records,
    total: records.length,
    totalPages: 1,
    unacknowledgedCount: 451,
    meta: { counts },
  };
}

function renderPage(entry = '/owner-alerts') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <OwnerAlertsPage />
    </MemoryRouter>,
  );
}

describe('OwnerAlertsPage (F13: critical only)', () => {
  beforeEach(() => {
    getAlerts.mockReset();
  });

  it('asks the server for critical alerts by default', async () => {
    getAlerts.mockResolvedValue(serverAnswer());
    renderPage();
    await waitFor(() => expect(getAlerts).toHaveBeenCalled());
    expect(getAlerts.mock.calls[0][0]).toMatchObject({ severity: 'critical', acknowledged: false });
  });

  it('heads the page with meta.counts.critical, never the total', async () => {
    getAlerts.mockResolvedValue(serverAnswer());
    renderPage();
    expect(await screen.findByText(/3 critical to review/)).toBeInTheDocument();
    expect(screen.queryByText(/451/)).not.toBeInTheDocument();
    expect(screen.getByText('Trucks affected')).toBeInTheDocument();
  });

  it('offers the warnings when nothing is critical', async () => {
    getAlerts.mockResolvedValue(
      serverAnswer({ records: [], counts: { critical: 0, warning: 140 } }),
    );
    renderPage();
    expect(await screen.findByText(/Nothing critical · 140 warnings/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See warnings' }));
    await waitFor(() =>
      expect(getAlerts.mock.calls.at(-1)[0]).toMatchObject({ severity: 'warning' }),
    );
  });

  it('before the server update: shows every open alert and claims no severity count', async () => {
    // The server before B0b rejects `severity` with a 400.
    getAlerts.mockImplementation(async (params) => {
      if (params.severity) throw Object.assign(new Error('Bad request'), { status: 400 });
      return {
        records: [{ ...criticalRow, severity: undefined }],
        total: 451,
        totalPages: 23,
        unacknowledgedCount: 451,
      };
    });
    renderPage();
    expect(await screen.findByText(/Critical count needs the server update/)).toBeInTheDocument();
    expect(screen.queryByText(/critical to review/)).not.toBeInTheDocument();
    expect(screen.queryByText('Trucks affected')).not.toBeInTheDocument();
    expect(getAlerts.mock.calls.at(-1)[0].severity).toBeUndefined();
  });
});

it('opens linked warning records in their report period instead of the critical-only view', async () => {
  getAlerts.mockReset();
  getAlerts.mockResolvedValue(serverAnswer());
  renderPage(
    '/owner-alerts?vehicle=WB11G1262&severity=all&type=FUEL_SIPHON_SUSPECTED&from=2026-09-24T10%3A00%3A00.000Z&to=2026-09-24T10%3A00%3A00.000Z',
  );
  await waitFor(() => expect(getAlerts).toHaveBeenCalled());
  expect(getAlerts.mock.calls[0][0]).toMatchObject({
    acknowledged: false,
    vehicle: 'WB11G1262',
    type: 'FUEL_SIPHON_SUSPECTED',
    from: '2026-09-24T10:00:00.000Z',
    to: '2026-09-24T10:00:00.000Z',
  });
  expect(getAlerts.mock.calls[0][0].severity).toBeUndefined();
});
