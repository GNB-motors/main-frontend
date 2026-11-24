import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlertsTab from './AlertsTab.jsx';
import { MaintenanceService } from '../MaintenanceService.js';
import { FleetDataService } from '../../../services/FleetDataService';
import { getVehicleList } from '../../../services/vehicleListService';

vi.mock('../../../services/FleetDataService', () => ({
  FleetDataService: { getMaintenancePredictions: vi.fn() },
}));
vi.mock('../../../services/vehicleListService', () => ({ getVehicleList: vi.fn() }));

vi.mock('../MaintenanceService.js', () => ({
  MaintenanceService: {
    getAlerts: vi.fn(),
    resolveAlert: vi.fn(),
  },
}));

const ALERT = {
  id: 'HIGH_REPAIR_SPEND-v1',
  fingerprint: '2026-01-01T00:00:00.000Z',
  type: 'HIGH_REPAIR_SPEND',
  severity: 'CRITICAL',
  vehicleReg: 'WB1',
  model: 'X',
  description: 'WB1 repair spend needs review',
  createdDate: '2026-04-10T00:00:00.000Z',
  resolved: false,
  resolvedAt: null,
  resolvedBy: null,
};

function renderTab() {
  return render(
    <MemoryRouter>
      <AlertsTab />
    </MemoryRouter>,
  );
}

describe('AlertsTab — resolve workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicleList.mockResolvedValue([{ registrationNumber: 'WB1' }]);
    FleetDataService.getMaintenancePredictions.mockResolvedValue({ records: [] });
  });

  it('shows overdue forecasts even when the old alerts endpoint has none', async () => {
    MaintenanceService.getAlerts.mockResolvedValue([]);
    FleetDataService.getMaintenancePredictions.mockResolvedValue({
      records: [{ registrationNumber: 'WB1', risk: 'OVERDUE', kmUntilDue: -500 }],
    });
    renderTab();
    expect(await screen.findByText('Service overdue by 500 km')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View service' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Everything looks healthy/)).not.toBeInTheDocument();
  });

  it('shows an unresolved alert under "All Alerts" with a Resolve button', async () => {
    MaintenanceService.getAlerts.mockResolvedValue([ALERT]);
    renderTab();

    await waitFor(() => expect(screen.getByText(ALERT.description)).toBeInTheDocument());
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('resolving an alert calls the API with its fingerprint and refreshes the list', async () => {
    MaintenanceService.getAlerts.mockResolvedValueOnce([ALERT]);
    MaintenanceService.resolveAlert.mockResolvedValue({});
    renderTab();

    await waitFor(() => expect(screen.getByText('Resolve')).toBeInTheDocument());

    MaintenanceService.getAlerts.mockResolvedValueOnce([
      {
        ...ALERT,
        resolved: true,
        resolvedAt: '2026-04-11T00:00:00.000Z',
        resolvedBy: 'Rahul Singh',
      },
    ]);
    fireEvent.click(screen.getByText('Resolve'));

    expect(MaintenanceService.resolveAlert).toHaveBeenCalledWith(ALERT.id, {
      fingerprint: ALERT.fingerprint,
    });

    // Once refreshed, the alert is resolved and drops out of "All Alerts" —
    // the queue is unresolved-only by design.
    await waitFor(() => expect(screen.queryByText(ALERT.description)).toBeNull());
  });

  it('a resolved alert appears under the Resolved sub-tab, not under All Alerts', async () => {
    MaintenanceService.getAlerts.mockResolvedValue([
      {
        ...ALERT,
        resolved: true,
        resolvedAt: '2026-04-11T00:00:00.000Z',
        resolvedBy: 'Rahul Singh',
      },
    ]);
    renderTab();

    // The one alert we have is resolved, so "All Alerts" (active-only) is empty.
    await waitFor(() =>
      expect(screen.getByText('No alerts in this category.')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Resolved'));

    await waitFor(() => expect(screen.getByText(ALERT.description)).toBeInTheDocument());
    expect(screen.getByText(/by Rahul Singh/)).toBeInTheDocument();
    expect(screen.queryByText('Resolve')).toBeNull();
  });
});
