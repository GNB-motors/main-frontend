import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import MileagePage from './MileagePage';
import apiClient from '../../utils/axiosConfig';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: vi.fn(),
}));

const feed = {
  status: 'success',
  data: [
    {
      id: 'log_1',
      source: 'MATCHED',
      verificationStatus: 'FLAGGED',
      vehicleNumber: 'WB25V8040',
      vehicleModel: 'Signa 4825.TK',
      at: '2026-10-01T10:00:00.000Z',
      litres: 120,
      slip: {
        litres: 120,
        totalAmount: 11400,
        rate: 95,
        location: 'IOCL Dankuni',
        fuelType: 'DIESEL',
        odometerReading: 418920,
        odometerSource: 'FLEETEDGE',
      },
      sensor: { litres: 80, billVarianceL: -40, claimedLitres: 120, billFlag: true },
    },
    {
      id: 'fill_2',
      source: 'SENSOR',
      verificationStatus: 'UNVERIFIED',
      vehicleNumber: '',
      vehicleModel: null,
      at: '2026-10-02T08:30:00.000Z',
      litres: 65,
      slip: null,
      sensor: { litres: 65, lat: 22.57, lng: 88.36 },
    },
  ],
  meta: {
    total: 2,
    totalPages: 1,
    verified: 18,
    flagged: 1,
    unverified: 1,
    slipOnly: 4,
    totalSpendInr: 250000,
  },
};

const models = {
  status: 'success',
  data: [{ model: 'Signa', totalDistanceKm: 3800, totalFuelL: 1000, vehicleCount: 4 }],
  meta: {},
};

const flagsFor = (on) => ({
  ready: true,
  canAccess: (key) => on.includes(key),
});

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MileagePage />
    </MemoryRouter>,
  );

describe('MileagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/fuel-logs/unified') return Promise.resolve({ data: feed });
      if (url === '/api/mileage/model-comparison') return Promise.resolve({ data: models });
      if (url === '/api/mileage/fleet-overview') {
        return Promise.resolve({
          data: {
            status: 'success',
            data: [{ vehicleId: 'v1', vehicleNumber: 'KA01AB1234', avgMileage: 3.9 }],
            meta: { total: 1 },
          },
        });
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
  });

  it('renders real KPIs and real rows, with no watchlist and no invented values', async () => {
    useFeatureFlags.mockReturnValue(
      flagsFor(['fuelIntegrity', 'vehicleActivity', 'fuelComparison']),
    );
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));

    expect(screen.getByText('3.80 km/L')).toBeInTheDocument();
    // (18 + 1) of (18 + 1 + 1) tank rises have a bill
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('19 of 20 tank rises have a bill')).toBeInTheDocument();

    expect(screen.getByText('Flagged', { selector: '.mileage-badge' })).toBeInTheDocument();
    expect(screen.getByText('No bill', { selector: '.mileage-badge' })).toBeInTheDocument();
    expect(screen.getByText('4,18,920 (CAN)')).toBeInTheDocument();

    expect(screen.queryByText(/Watchlist/i)).not.toBeInTheDocument();
    expect(screen.queryByText('WB11G0962')).not.toBeInTheDocument();
    expect(screen.queryByText('IOCL Highway Station')).not.toBeInTheDocument();
    expect(screen.queryByText(/OMC Est/)).not.toBeInTheDocument();

    expect(apiClient.get).not.toHaveBeenCalledWith('/api/trips/active');
    const feedCall = apiClient.get.mock.calls.find(
      ([url, opts]) => url === '/api/fuel-logs/unified' && opts.params.limit !== 1,
    );
    expect(feedCall[1].params.from).toBeDefined();
    expect(feedCall[1].params.to).toBeDefined();
  });

  it('opens a flagged row as flagged in the detail drawer', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: 'View refuel detail' })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Flagged')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Verified Match/)).not.toBeInTheDocument();
    expect(within(dialog).getByText('-40.0 L')).toBeInTheDocument();
  });

  it('hides views the org is not entitled to', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelComparison']));
    renderAt('/mileage?tab=performance');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(screen.queryByText('Vehicle & Model Mileage')).not.toBeInTheDocument();
    expect(screen.queryByText('Fleet Avg Mileage')).not.toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith(
      '/api/mileage/model-comparison',
      expect.anything(),
    );
  });

  it('the mileage tab mounts the real Mileage Tracking page without its own title', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    renderAt('/mileage?tab=performance');

    expect(await screen.findByText('KA01AB1234')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mileage Tracking' })).not.toBeInTheDocument();
    expect(screen.queryByText('TKPL', { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText('By model')).toBeInTheDocument();
  });
});
