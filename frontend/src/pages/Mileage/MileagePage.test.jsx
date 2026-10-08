import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import MileagePage from './MileagePage';
import DieselRefuelReport from '../Reports/reports/DieselRefuelReport';
import apiClient from '../../utils/axiosConfig';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session.js';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: vi.fn(),
}));

vi.mock('../../utils/session.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: vi.fn(),
}));

// A BD-style row as PR #142 sends it: matched, flagged against the corrected
// figure, with the old raw-gauge check kept for audit.
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
        id: 'log1',
        litres: 120,
        totalAmount: 11400,
        rate: 95,
        location: 'IOCL Dankuni',
        fuelType: 'DIESEL',
        fillingType: 'FULL_TANK',
        odometerReading: 418920,
        odometerSource: 'FLEETEDGE',
      },
      sensor: {
        litres: 80,
        rawLitres: 76.4,
        correction: 'V2_GAIN',
        gain: 1.05,
        gainBills: 12,
        bandL: 6.2,
        billVarianceL: -40,
        billToleranceL: 7.5,
        billFlag: true,
        claimedLitres: 120,
        v1BillVarianceL: -43.6,
        v1BillFlag: true,
      },
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
      sensor: {
        litres: 65,
        rawLitres: 65,
        correction: 'RAW',
        gainBills: 0,
        bandL: null,
        lat: 22.57,
        lng: 88.36,
        billVarianceL: null,
        billFlag: false,
      },
    },
  ],
  meta: {
    total: 2,
    totalPages: 1,
    verified: 18,
    flagged: 1,
    unverified: 1,
    slipOnly: 4,
    sensorGlitch: 3,
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

const feedCalls = () =>
  apiClient.get.mock.calls.filter(
    ([url, opts]) => url === '/api/fuel-logs/unified' && opts.params.limit !== 1,
  );

function mockApi() {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
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
    if (url === '/api/mileage/intervals') {
      return Promise.resolve({ data: { status: 'success', data: [], meta: { total: 0 } } });
    }
    if (url === '/api/reports/fuel-cycles') {
      return Promise.resolve({
        data: {
          status: 'success',
          data: {
            total: 1,
            rows: [
              {
                _id: 'c1',
                registrationNumber: 'WB11J8562',
                open: { source: 'BILL', at: '2026-10-01T04:00:00Z', odo: 100000 },
                close: { source: 'BILL', at: '2026-10-04T04:00:00Z', odo: 101200 },
                km: { odo: 1200 },
                fuel: { bills: 400, ecu: 380, tankDelta: 0 },
                mileage: { tankToTank: 3, ecu: 3.16 },
                coverage: { kmMeasured: 0.92, fuelEcu: 0.5 },
                flags: [],
                status: 'RECONCILED',
              },
            ],
          },
        },
      });
    }
    if (url === '/api/fuel-integrity/pump-ledger') {
      return Promise.resolve({
        data: {
          status: 'success',
          data: {
            fuelPriceInrPerL: 92.5,
            disclaimer: 'All ₹ figures are estimates.',
            pumps: [
              {
                pump: 'HP Bagnan',
                fills: 9,
                flaggedFills: 2,
                claimedLitres: 1800,
                actualLitres: 1750,
                shortfallLitres: 50,
                shortfallPct: 2.78,
                estimatedLossInr: 4625,
                lastFillAt: '2026-10-05T06:00:00Z',
              },
            ],
          },
        },
      });
    }
    if (url === '/api/vehicles') {
      return Promise.resolve({
        data: {
          status: 'success',
          data: [{ _id: 'v9', registrationNumber: 'WB11J8562', model: 'SIGNA 5530.S 4x2' }],
        },
      });
    }
    if (url === '/api/fuel-model/expected') {
      return Promise.resolve({
        data: {
          success: true,
          windows: [
            {
              windowFrom: '2026-10-08T03:00:00Z',
              distanceKm: 40,
              actualL: 12,
              expectedL: 10,
              deviationL: 2,
              deviationPct: 20,
              source: 'REGRESSION',
            },
          ],
          summary: { count: 1, scoredCount: 1, totalDeviationL: 2, avgDeviationPct: 20 },
        },
      });
    }
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

describe('MileagePage', () => {
  beforeEach(mockApi);

  it('renders real KPIs and corrected rows, with no watchlist and no invented values', async () => {
    useFeatureFlags.mockReturnValue(
      flagsFor(['fuelIntegrity', 'vehicleActivity', 'fuelComparison']),
    );
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));

    expect(screen.getByText('3.80 km/L')).toBeInTheDocument();
    // (18 + 1) of (18 + 1 + 1) tank rises have a bill — meta counts as sent
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('19 of 20 tank rises have a bill')).toBeInTheDocument();

    expect(screen.getByText('Flagged', { selector: '.mileage-badge' })).toBeInTheDocument();
    expect(screen.getByText('No bill', { selector: '.mileage-badge' })).toBeInTheDocument();
    expect(screen.getByText('4,18,920 (CAN)')).toBeInTheDocument();

    // Corrected litres ± band, the raw gauge rise, and the correction badge.
    expect(screen.getByText('± 6.2 L')).toBeInTheDocument();
    expect(screen.getByText('Gauge rose 76.4 L')).toBeInTheDocument();
    expect(screen.getByText('Corrected')).toHaveAttribute('title', 'Calibrated on 12 bills');
    expect(screen.getByText('Gauge reading')).toHaveAttribute('title', 'Fleet default');
    // The server's bill check, not a client rule.
    expect(screen.getByText(/allowed ±7\.5 L/)).toBeInTheDocument();

    expect(screen.queryByText(/Watchlist/i)).not.toBeInTheDocument();
    expect(screen.queryByText('WB11G0962')).not.toBeInTheDocument();
    expect(screen.queryByText(/OMC Est/)).not.toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith('/api/trips/active');

    const [, opts] = feedCalls()[0];
    expect(opts.params.from).toMatch(/T18:30:00\.000Z$/); // start of an IST day
    expect(opts.params.to).toMatch(/T18:29:59\.999Z$/); // end of an IST day
  });

  it('keeps gauge glitches out of the list, behind their own chip', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage');

    const chip = await screen.findByRole('button', { name: /Gauge glitches/ });
    expect(within(chip).getByText('3')).toBeInTheDocument();
    expect(feedCalls()[0][1].params.status).toBeUndefined();

    fireEvent.click(chip);
    await waitFor(() =>
      expect(feedCalls().some(([, o]) => o.params.status === 'sensor_glitch')).toBe(true),
    );
  });

  it('opens a flagged row as flagged, with the allowance and the old check', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity', 'vehicleActivity']));
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: 'View refuel detail' })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Flagged')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Verified Match/)).not.toBeInTheDocument();
    expect(within(dialog).getByText('-40.0 L')).toBeInTheDocument();
    expect(within(dialog).getByText(/Allowed ±7\.5 L for this truck/)).toBeInTheDocument();
    expect(within(dialog).getByText('Old check: -43.6 L, flagged')).toBeInTheDocument();
    expect(within(dialog).getByText('76.4 L')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Edit/ })).toBeInTheDocument();
  });

  it('edits a bill through PUT /api/mileage/fuel-log/:id and refetches', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    apiClient.put.mockResolvedValue({ data: { status: 'success' } });
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    const before = feedCalls().length;
    fireEvent.click(screen.getAllByRole('button', { name: 'View refuel detail' })[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Edit/ }));
    fireEvent.change(within(dialog).getByLabelText('Litres'), { target: { value: '118' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [url, body] = apiClient.put.mock.calls[0];
    expect(url).toBe('/api/mileage/fuel-log/log1');
    expect(body).toMatchObject({ litres: 118, fuelType: 'DIESEL', fillingType: 'FULL_TANK' });
    await waitFor(() => expect(feedCalls().length).toBeGreaterThan(before));
  });

  it('hides views the viewer is not entitled to — by flag and by role', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelComparison']));
    getUserRole.mockReturnValue('MANAGER');
    const { unmount } = renderAt('/mileage?tab=performance');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(screen.queryByText('Vehicle & Model Mileage')).not.toBeInTheDocument();
    expect(screen.queryByText('Fleet Avg Mileage')).not.toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith(
      '/api/mileage/model-comparison',
      expect.anything(),
    );
    unmount();

    // fuel reads are OWNER/MANAGER only
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity', 'fuelComparison']));
    getUserRole.mockReturnValue('DRIVER');
    renderAt('/mileage');
    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(screen.queryByText('Reconciliation')).not.toBeInTheDocument();
  });

  it('shows fuel cycles when the org has no slip intervals', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity', 'autoTrips']));
    renderAt('/mileage?tab=live&subtab=completed');

    expect(await screen.findByText('WB11J8562')).toBeInTheDocument();
    expect(screen.getByText('3.00 km/L')).toBeInTheDocument();
    expect(screen.getByText('ECU 3.16 km/L')).toBeInTheDocument();
    expect(screen.getByText('km 92%')).toBeInTheDocument();
    expect(screen.getByText('Reconciled')).toBeInTheDocument();
  });

  it('shows the pump short-delivery ledger with its disclaimer', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage?tab=reconciliation&view=pumps');

    expect(await screen.findByText('HP Bagnan')).toBeInTheDocument();
    expect(screen.getByText('2 flagged')).toBeInTheDocument();
    expect(screen.getByText('2.78%')).toBeInTheDocument();
    expect(screen.getByText('All ₹ figures are estimates.')).toBeInTheDocument();
  });

  it('the mileage tab mounts the real Mileage Tracking page without its own title', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    renderAt('/mileage?tab=performance');

    expect(await screen.findByText('KA01AB1234')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mileage Tracking' })).not.toBeInTheDocument();
    expect(screen.queryByText('TKPL', { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText('By model')).toBeInTheDocument();
    expect(screen.queryByText('Expected vs actual')).not.toBeInTheDocument();
  });
});

describe('Vehicle & model mileage → Expected vs actual', () => {
  beforeEach(mockApi);

  it('needs the fuelModel flag and compares one truck at a time', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity', 'fuelModel']));
    renderAt('/mileage?tab=performance&view=expected');

    const picker = await screen.findByLabelText('Vehicle');
    await screen.findByRole('option', { name: /WB11J8562/ });
    fireEvent.change(picker, { target: { value: 'v9' } });

    expect(await screen.findByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByText('Truck model')).toBeInTheDocument();
    const call = apiClient.get.mock.calls.find(([u]) => u === '/api/fuel-model/expected');
    expect(call[1].params.vehicleId).toBe('v9');
  });
});

describe('Reports → Diesel Report', () => {
  beforeEach(mockApi);

  it('is the hub refuel stream with fuelType fixed to DIESEL, not the legacy list', async () => {
    useFeatureFlags.mockReturnValue(flagsFor([]));
    render(
      <MemoryRouter>
        <DieselRefuelReport />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(feedCalls()[0][1].params.fuelType).toBe('DIESEL');
    expect(apiClient.get).not.toHaveBeenCalledWith('api/fuel-logs', expect.anything());
  });
});
