import { changeField } from '@/test/changeField';
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

// Stub the popover; use the real shared select for manufacturer scope checks.
vi.mock('@/components/ui/popover', async () => (await import('../../test/baseUiStubs')).popover);

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
        documentId: 'doc1',
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
  data: [
    {
      model: 'Signa',
      avgMileage: 3.8,
      totalDistanceKm: 3800,
      totalFuelL: 1000,
      vehicleCount: 4,
      vehicles: [
        {
          vehicleId: 'v1',
          vehicleNumber: 'KA01AB1234',
          avgMileage: 3.9,
          recordCount: 5,
          totalDistanceKm: 1950,
          totalFuelL: 500,
        },
      ],
    },
  ],
  meta: { excludedCycleCount: 2 },
};

const flagsFor = (on) => ({
  ready: true,
  canAccess: (key) => on.includes(key),
  isEnabled: (key) => on.includes(key),
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
    if (url === '/api/vehicles/metadata')
      return Promise.resolve({
        data: {
          data: {
            manufacturers: [
              { value: 'TATA', label: 'Tata' },
              { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
            ],
          },
        },
      });
    if (url === '/api/fuel-logs/unified') return Promise.resolve({ data: feed });
    if (url === '/api/mileage/model-comparison') return Promise.resolve({ data: models });
    if (url === '/api/fleet-view/mileage')
      return Promise.resolve({
        data: { status: 'success', data: { items: [], totals: {} } },
      });
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
    if (url === '/api/documents/doc1') {
      return Promise.resolve({
        data: { success: true, data: { _id: 'doc1', publicUrl: 'https://s3.example/bill-1.jpg' } },
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
    if (url === '/api/vehicles/options') {
      return Promise.resolve({
        data: {
          status: 'success',
          data: [{ _id: 'v9', registrationNumber: 'WB11J8562', model: 'SIGNA 5530.S 4x2' }],
          meta: { total: 1, page: 1, limit: 500, totalPages: 1 },
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

const daysBetween = (params) =>
  Math.round((new Date(params.to) - new Date(params.from)) / 86400000);

const rowOf = (plate) => screen.getAllByText(plate)[0].closest('tr');

describe('MileagePage', () => {
  beforeEach(mockApi);

  it('shows plain-word figures and tags, with the maths kept out of the rows', async () => {
    useFeatureFlags.mockReturnValue(
      flagsFor(['fuelIntegrity', 'vehicleActivity', 'fuelComparison']),
    );
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));

    expect(screen.getByRole('heading', { name: 'Diesel & Mileage' })).toBeInTheDocument();
    expect(document.getElementById('report-side-nav')).not.toBeInTheDocument();
    // The fleet km/L figure is read on the Mileage tab: the landing page says
    // where it lives instead of waiting for that read.
    expect(screen.getByLabelText('Fill-to-fill km/L')).toHaveTextContent(/\u2014/);
    expect(screen.getByRole('button', { name: 'Open Mileage' })).toBeInTheDocument();
    // (18 + 1) of (18 + 1 + 1) tank rises have a bill — meta counts as sent
    expect(screen.getByLabelText('Fills with a bill')).toHaveTextContent('19of 20');
    expect(screen.getByText('Bills up to date')).toBeInTheDocument();
    expect(screen.getByLabelText('Bills to check')).toHaveTextContent('1');
    expect(screen.getByText('Needs a look')).toBeInTheDocument();

    expect(within(rowOf('WB25V8040')).getByText('Bill too high')).toHaveClass('status-chip');
    expect(within(rowOf('WB25V8040')).getByText('80 L')).toBeInTheDocument();
    expect(within(rowOf('WB25V8040')).getByText('120 L')).toBeInTheDocument();
    expect(screen.getByText('Bill missing', { selector: '.status-chip' })).toBeInTheDocument();

    // The arithmetic is behind ⓘ, not printed in the row.
    expect(screen.queryByText(/Gauge rose/)).not.toBeInTheDocument();
    expect(screen.queryByText(/± 6\.2 L/)).not.toBeInTheDocument();
    expect(screen.queryByText('Corrected')).not.toBeInTheDocument();

    expect(screen.queryByText(/Watchlist/i)).not.toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith('/api/trips/active');

    const [, opts] = feedCalls()[0];
    expect(opts.params.from).toMatch(/T18:30:00\.000Z$/); // start of an IST day
    expect(opts.params.to).toMatch(/T18:29:59\.999Z$/); // end of an IST day
    expect(daysBetween(opts.params)).toBe(30);
  });

  it('reads the fleet km/L figure on the Mileage tab, not on the way in', async () => {
    useFeatureFlags.mockReturnValue(
      flagsFor(['fuelIntegrity', 'vehicleActivity', 'fuelComparison']),
    );
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    // The model comparison is the slow read: the landing page must not wait
    // for it, so it is not asked for until the Mileage tab is opened.
    expect(
      apiClient.get.mock.calls.filter(([url]) => url === '/api/mileage/model-comparison'),
    ).toHaveLength(0);

    fireEvent.click(screen.getByRole('tab', { name: /Mileage/ }));

    await waitFor(() =>
      expect(screen.getByLabelText('Fill-to-fill km/L')).toHaveTextContent('3.80km/L'),
    );
  });

  it('ⓘ next to a result shows how it was worked out', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(
      within(rowOf('WB25V8040')).getByRole('button', { name: 'How is this worked out?' }),
    );

    expect(await screen.findByText('Bill is more than the tank got')).toBeInTheDocument();
    expect(screen.getByText('Gauge rose')).toBeInTheDocument();
    expect(screen.getByText('76.4 L')).toBeInTheDocument();
    expect(screen.getByText('from 12 bills of this truck')).toBeInTheDocument();
    expect(screen.getByText('± 7.5 L')).toBeInTheDocument();
  });

  it('one date bar drives every list: quick dates and picked dates', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage');
    await waitFor(() => expect(feedCalls().length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    await waitFor(() => expect(daysBetween(feedCalls().at(-1)[1].params)).toBe(7));

    changeField(screen.getByLabelText('From date'), { target: { value: '2026-08-01' } });
    changeField(screen.getByLabelText('To date'), { target: { value: '2026-08-31' } });
    await waitFor(() => expect(feedCalls().at(-1)[1].params.from).toBe('2026-07-31T18:30:00.000Z'));
    expect(screen.getByText('1 Aug – 31 Aug 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens with picked dates from the URL', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage?from=2026-09-01&to=2026-09-03');
    await waitFor(() => expect(feedCalls().length).toBeGreaterThan(0));
    expect(daysBetween(feedCalls()[0][1].params)).toBe(3);
    expect(screen.getByText('1 Sep – 3 Sep 2026')).toBeInTheDocument();
  });

  it('links a fill made at a saved place to that place in Place Hub', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    const placed = {
      ...feed,
      data: [
        { ...feed.data[0], place: { id: 's1', hubId: 'site:s1', name: 'Dankuni pump' } },
        { ...feed.data[1], place: { id: 's2', hubId: 'site:s2', name: null } },
      ],
    };
    apiClient.get.mockImplementation((url) =>
      url === '/api/fuel-logs/unified'
        ? Promise.resolve({ data: placed })
        : Promise.resolve({ data: { status: 'success', data: [] } }),
    );
    renderAt('/mileage');

    const named = await screen.findByRole('link', { name: 'Dankuni pump' });
    expect(named).toHaveAttribute('href', '/place-hub?place=site%3As1');
    const unnamed = screen.getByRole('link', { name: 'Name this pump' });
    expect(unnamed).toHaveAttribute('href', '/place-hub?place=site%3As2');
  });

  it('keeps gauge jumps out of the list, behind their own chip', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage');

    const chip = await screen.findByRole('button', { name: /Gauge jumps/ });
    await waitFor(() => expect(within(chip).getByText('3')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /All fills/ })).toHaveTextContent('24');
    expect(feedCalls()[0][1].params.status).toBeUndefined();

    fireEvent.click(chip);
    await waitFor(() =>
      expect(feedCalls().some(([, o]) => o.params.status === 'sensor_glitch')).toBe(true),
    );
  });

  it('opens a fill with what happened, what to do, and the maths folded away', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity', 'vehicleActivity']));
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: 'Open fill for WB25V8040' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('The bill says 120 L, the tank got about 80 L.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Check the bill photo and ask the driver/)).toBeInTheDocument();
    expect(within(dialog).getByText('Bill too high')).toBeInTheDocument();
    expect(within(dialog).getByText('4,18,920 km (Truck tracker)')).toBeInTheDocument();
    expect(within(dialog).getByText('How we worked this out')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Edit/ })).toBeInTheDocument();
  });

  it('only owners and managers can edit or delete a bill', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    getUserRole.mockReturnValue('DRIVER');
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: 'Open fill for WB25V8040' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('opens the bill photo in a popup over the drawer, not a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: 'Open fill for WB25V8040' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /See bill photo/ }));

    const img = await screen.findByRole('img', { name: 'Fuel bill · WB25V8040' });
    expect(img).toHaveAttribute('src', 'https://s3.example/bill-1.jpg');
    expect(open).not.toHaveBeenCalled();

    // Closing the photo leaves the drawer open.
    fireEvent.click(screen.getByTitle('Close (Esc)'));
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: 'Fuel bill · WB25V8040' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    open.mockRestore();
  });

  it('edits a bill through PUT /api/mileage/fuel-log/:id and refetches', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    apiClient.put.mockResolvedValue({ data: { status: 'success' } });
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    const before = feedCalls().length;
    fireEvent.click(screen.getByRole('button', { name: 'Open fill for WB25V8040' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Edit/ }));
    changeField(within(dialog).getByLabelText('Litres'), { target: { value: '118' } });
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
    expect(screen.queryByRole('tab', { name: 'Mileage' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Fill-to-fill km/L')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bill check' })).toBeInTheDocument();
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
    expect(screen.queryByRole('tab', { name: 'Bill check' })).not.toBeInTheDocument();
  });

  it('shows register rounds when the org has no bill-based rounds', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity', 'autoTrips']));
    renderAt('/mileage?tab=live&subtab=completed');

    expect(await screen.findByText('WB11J8562')).toBeInTheDocument();
    expect(screen.getByText('3.00 km/L')).toBeInTheDocument();
    expect(screen.getByText('Low', { selector: '.status-chip' })).toBeInTheDocument();
    expect(screen.getByText('Checked')).toBeInTheDocument();
    const call = apiClient.get.mock.calls.find(([u]) => u === '/api/reports/fuel-cycles');
    expect(daysBetween(call[1].params)).toBe(30);
  });

  it('shows pump honesty for the hub’s dates', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage?tab=reconciliation&view=pumps&dates=90DAYS');

    expect(await screen.findByText('HP Bagnan')).toBeInTheDocument();
    expect(screen.getByText('Mostly fine')).toBeInTheDocument();
    expect(screen.getByLabelText('Fills checked')).toHaveTextContent('9');
    expect(screen.getByText('All ₹ figures are estimates.')).toBeInTheDocument();

    const call = apiClient.get.mock.calls.find(
      ([url]) => url === '/api/fuel-integrity/pump-ledger',
    );
    expect(daysBetween(call[1].params)).toBe(90);
  });

  it('pump search comes from the hub search box', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    renderAt('/mileage?tab=reconciliation&view=pumps&search=dankuni');

    expect(await screen.findByText('No pump matches this search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Pump or highway' })).toHaveValue('dankuni');
  });

  it('Bill vs tank sends the hub’s dates', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['fuelIntegrity']));
    apiClient.get.mockImplementation((url) =>
      url === '/api/fuel-comparison/records'
        ? Promise.resolve({
            data: {
              status: 'success',
              data: {
                records: [
                  {
                    _id: 'r1',
                    vehicleNumber: 'KA01AB1234',
                    billDate: '2026-10-01T10:00:00Z',
                    billLitres: 95,
                    telemetryLitres: 78,
                    varianceL: -17,
                    status: 'FLAGGED',
                  },
                ],
              },
              meta: { total: 1 },
            },
          })
        : Promise.resolve({ data: { status: 'success', data: [], meta: {} } }),
    );
    renderAt('/mileage?tab=reconciliation&view=tank&dates=7DAYS');

    expect(await screen.findByText('KA01AB1234')).toBeInTheDocument();
    expect(within(rowOf('KA01AB1234')).getByText('Bill too high')).toBeInTheDocument();
    const call = apiClient.get.mock.calls.find(([u]) => u === '/api/fuel-comparison/records');
    expect(daysBetween(call[1].params)).toBe(7);
  });

  it('By truck reads each truck’s mileage and DEF for the hub’s dates', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    apiClient.get.mockImplementation((url, opts) => {
      if (url === '/api/fleet-view/mileage') {
        if (opts?.params?.groupBy === 'truck') {
          return Promise.resolve({
            data: {
              status: 'success',
              data: {
                items: [
                  {
                    registrationNumber: 'KA01AB1234',
                    driverName: 'Ramesh Yadav',
                    from: '2026-10-02T00:00:00Z',
                    to: '2026-10-19T00:00:00Z',
                    km: 4820,
                    dieselL: 1420,
                    kmPerL: 3.4,
                    usualKmPerL: 3.2,
                    defL: 61,
                    defPctOfDiesel: 4.3,
                    defBand: { min: 3, max: 6 },
                    verdict: 'ADDS_UP',
                    verdictWhy: {
                      text: 'The diesel used matches the km driven at this truck’s usual km/L.',
                      basis: '4,820 km at 3.2 km/L',
                    },
                    source: 'RECONCILED_REGISTER',
                  },
                ],
                totals: { km: 4820, dieselL: 1420, defL: 61, kmPerL: 3.4 },
              },
            },
          });
        }
        return Promise.resolve({
          data: { status: 'success', data: { items: [], totals: {} } },
        });
      }
      return Promise.resolve({ data: { status: 'success', data: [], meta: {} } });
    });
    renderAt('/mileage?tab=performance');

    expect(await screen.findByText('KA01AB1234')).toBeInTheDocument();
    expect(within(rowOf('KA01AB1234')).getByText('3.40 km/L')).toBeInTheDocument();
    expect(within(rowOf('KA01AB1234')).getByText('Adds up')).toBeInTheDocument();
    expect(within(rowOf('KA01AB1234')).getByText('4.3%')).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalledWith(
      '/api/mileage/fleet-overview',
      expect.anything(),
    );
    const call = apiClient.get.mock.calls.find(([u]) => u === '/api/fleet-view/mileage');
    expect(call[1].params.groupBy).toBe('truck');
    expect(daysBetween(call[1].params)).toBe(30);
    expect(screen.getByRole('tab', { name: 'By model' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Used vs should use' })).not.toBeInTheDocument();
  });

  it('offers the reconciled fill-to-fill cycles under Mileage', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    apiClient.get.mockImplementation((url, opts) => {
      if (url === '/api/fleet-view/mileage' && opts?.params?.groupBy === 'cycle') {
        return Promise.resolve({
          data: {
            status: 'success',
            data: {
              items: [
                {
                  registrationNumber: 'KA01AB1234',
                  from: '2026-10-02T00:00:00Z',
                  to: '2026-10-19T00:00:00Z',
                  km: 4820,
                  dieselL: 1420,
                  kmPerL: 3.4,
                  usualKmPerL: 3.2,
                  defL: 61,
                  defPctOfDiesel: 4.3,
                  verdict: 'ADDS_UP',
                  source: 'RECONCILED_REGISTER',
                },
              ],
              totals: {},
            },
          },
        });
      }
      return Promise.resolve({ data: { status: 'success', data: { items: [], totals: {} } } });
    });
    renderAt('/mileage?tab=performance&view=cycles');

    expect(
      await screen.findByRole('tab', { name: 'Fill to fill (reconciled)' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('KA01AB1234')).toBeInTheDocument();
    expect(screen.getByText('From your oil report')).toBeInTheDocument();
  });
});

describe('Mileage → Used vs should use', () => {
  beforeEach(mockApi);

  it('needs the fuelModel flag and compares one truck at a time', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity', 'fuelModel']));
    renderAt('/mileage?tab=performance&view=expected');

    const truckSelect = await screen.findByRole('combobox', { name: 'Truck' });
    expect(truckSelect).toHaveTextContent('Choose a truck');
    expect(apiClient.get).not.toHaveBeenCalledWith('/api/fuel-model/expected', expect.anything());
    fireEvent.click(truckSelect);
    const option = await screen.findByRole('option', { name: /WB11J8562/ });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option);

    expect(await screen.findByText('Used extra')).toBeInTheDocument();
    const call = apiClient.get.mock.calls.find(([u]) => u === '/api/fuel-model/expected');
    expect(call[1].params.vehicleId).toBe('v9');
  });
});

describe('Reports → Diesel Report', () => {
  beforeEach(mockApi);

  it('is the hub fill list with fuelType fixed to DIESEL, not the legacy list', async () => {
    useFeatureFlags.mockReturnValue(flagsFor([]));
    render(
      <MemoryRouter>
        <DieselRefuelReport />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(feedCalls()[0][1].params.fuelType).toBe('DIESEL');
    expect(daysBetween(feedCalls()[0][1].params)).toBe(30);
    expect(apiClient.get).not.toHaveBeenCalledWith('api/fuel-logs', expect.anything());
  });
});

describe('manufacturer scope in the mileage hub', () => {
  beforeEach(() => {
    mockApi();
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity', 'autoTrips', 'fuelIntegrity']));
  });
  it('scopes the feed and both KPI sources, survives tabs, and clears back to All', async () => {
    renderAt('/mileage?dates=7DAYS');
    const select = await screen.findByRole('combobox', { name: 'Manufacturer' });
    fireEvent.click(select);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Tata' })).toBeInTheDocument());
    fireEvent.pointerDown(screen.getByRole('option', { name: 'Tata' }), { pointerType: 'mouse' });
    fireEvent.click(screen.getByRole('option', { name: 'Tata' }));
    await waitFor(() => expect(feedCalls().at(-1)[1].params.manufacturer).toBe('TATA'));
    const kpi = apiClient.get.mock.calls.filter(
      ([url, options]) => url === '/api/fuel-logs/unified' && options.params.limit === 1,
    );
    expect(kpi.at(-1)[1].params.manufacturer).toBe('TATA');
    // The model comparison is read on the Mileage tab, so that tab is opened
    // before the figure it feeds can be checked.
    fireEvent.click(screen.getByRole('tab', { name: /Mileage/ }));
    expect(select).toHaveTextContent('Tata');
    expect(screen.getAllByRole('combobox', { name: 'Manufacturer' })).toHaveLength(1);
    await waitFor(() =>
      expect(
        apiClient.get.mock.calls
          .filter(([url]) => url === '/api/mileage/model-comparison')
          .at(-1)[1].params.manufacturer,
      ).toBe('TATA'),
    );
    fireEvent.click(select);
    fireEvent.pointerDown(screen.getByRole('option', { name: 'All manufacturers' }), {
      pointerType: 'mouse',
    });
    fireEvent.click(screen.getByRole('option', { name: 'All manufacturers' }));
    await waitFor(() => {
      const calls = apiClient.get.mock.calls.filter(
        ([url]) => url === '/api/mileage/model-comparison',
      );
      expect(calls.at(-1)[1].params).not.toHaveProperty('manufacturer');
    });
  });
  it('restores a deep-linked maker in the interval fallback', async () => {
    renderAt('/mileage?subtab=completed&manufacturer=ASHOK+LEYLAND');
    await waitFor(() => {
      const calls = apiClient.get.mock.calls.filter(([url]) => url === '/api/mileage/intervals');
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.every(([, options]) => options.params.manufacturer === 'ASHOK LEYLAND')).toBe(
        true,
      );
    });
  });
  it('passes the shared picked dates to completed full-tank cycles', async () => {
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    renderAt('/mileage?subtab=completed&from=2026-11-01&to=2026-11-07');
    await waitFor(() => {
      const calls = apiClient.get.mock.calls.filter(
        ([url, opts]) => url === '/api/mileage/intervals' && opts.params.limit > 1,
      );
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.at(-1)[1].params).toMatchObject({
        from: '2026-10-31T18:30:00.000Z',
        to: '2026-11-07T18:29:59.999Z',
        status: 'COMPLETED',
      });
    });
  });
});

describe('bill approval placement', () => {
  it('does not render the bills to confirm card', () => {
    mockApi();
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    renderAt('/mileage');
    expect(screen.queryByText('Bills to confirm')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add bill photo/ })).toBeInTheDocument();
  });
});

describe('WhatsApp chat upload on the mileage page', () => {
  it('offers the upload to people who can edit bills', async () => {
    mockApi();
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /Upload WhatsApp chat/ })).toBeInTheDocument();
  });

  it('keeps the upload away from people who cannot edit bills', async () => {
    mockApi();
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    getUserRole.mockReturnValue('DRIVER');
    renderAt('/mileage');

    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: /Upload WhatsApp chat/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add bill photo/ })).not.toBeInTheDocument();
  });

  it('reads the list again after a chat has been imported', async () => {
    mockApi();
    useFeatureFlags.mockReturnValue(flagsFor(['vehicleActivity']));
    apiClient.post.mockResolvedValue({
      data: { data: { filename: 'chat.zip', messages: 4, photos: 2, failed: [] } },
    });
    renderAt('/mileage');
    await waitFor(() => expect(screen.getAllByText('WB25V8040').length).toBeGreaterThan(0));
    const before = feedCalls().length;

    fireEvent.click(screen.getByRole('button', { name: /Upload WhatsApp chat/ }));
    fireEvent.change(await screen.findByLabelText('WhatsApp chat export'), {
      target: { files: [new File(['zip'], 'chat.zip', { type: 'application/zip' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    await waitFor(() => expect(feedCalls().length).toBeGreaterThan(before));
  });
});
