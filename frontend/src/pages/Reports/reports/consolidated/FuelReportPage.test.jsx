import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import FuelReportPage from './FuelReportPage';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';

vi.mock('./ConsolidatedReportService', () => ({
  ConsolidatedReportService: {
    dailyFuel: vi.fn(),
    fullTankCycles: vi.fn(),
    slipIntervals: vi.fn(),
    fuelMileage: vi.fn(),
    fuelDetails: vi.fn(),
  },
}));
vi.mock('../../../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn(async () => []),
}));
vi.mock('../ReportEntityPicker', () => ({
  VehiclePicker: () => <span>Vehicle picker</span>,
  DriverPicker: () => <span>Driver picker</span>,
}));
const slipRow = {
  id: 'interval',
  vehicleNumber: 'WB11TEST',
  driverName: 'Arun',
  startDate: '2026-11-01T08:00:00+05:30',
  endDate: '2026-11-02T08:00:00+05:30',
  distanceKm: 450,
  distanceBasis: 'SLIP_ODOMETERS',
  fuelUsedLitres: 150,
  mileageKmpl: 3,
  estimatedCost: 15000,
  closingFillLitres: 100,
  closingFillSpend: 10000,
  measuredMinutes: 1440,
  durationMinutes: 1440,
  completeCoverage: true,
  balanceAfterClosing: null,
  balanceStatus: 'CAPACITY_REQUIRED',
  sourceIds: ['engine'],
  priceReferences: [],
  quality: 'VALID',
  openingBill: {
    id: 'a',
    refuelTime: '2026-11-01T08:00:00+05:30',
    fillingType: 'FULL_TANK',
    litres: 400,
  },
  closingBill: {
    id: 'b',
    refuelTime: '2026-11-02T08:00:00+05:30',
    fillingType: 'PARTIAL',
    litres: 100,
  },
};
const slipSummary = {
  intervalCount: 1,
  completeIntervals: 1,
  incompleteIntervals: 0,
  fuelUsedLitres: 150,
  mileageKmpl: 3,
  estimatedCost: 15000,
  costedIntervals: 1,
  capacityMissing: 1,
};
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function mount(query = '') {
  return render(
    <MemoryRouter
      initialEntries={['/reports?report=fuelMileage&from=2026-11-01&to=2026-11-30' + query]}
    >
      <FuelReportPage />
      <Location />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  Service.dailyFuel.mockResolvedValue({
    rows: [],
    summary: {
      vehicleDays: 0,
      vehicleCount: 0,
      distanceMissingDays: 0,
      costedDays: 0,
      partialDays: 0,
    },
    meta: {},
  });
  Service.fullTankCycles.mockResolvedValue({
    rows: [],
    open: [],
    summary: {
      cycleCount: 0,
      eligibleCycles: 0,
      excludedCycles: 0,
      awaitingFull: 0,
      needsFirstFull: 0,
      unpricedCycles: 0,
    },
    meta: {},
  });
  Service.slipIntervals.mockResolvedValue({ rows: [slipRow], summary: slipSummary, meta: {} });
});

describe('Fuel & Mileage report modes', () => {
  it('labels invalid slip odometers without hiding known engine consumption', async () => {
    Service.slipIntervals.mockResolvedValue({
      rows: [
        {
          ...slipRow,
          distanceKm: null,
          mileageKmpl: null,
          quality: 'INVALID_ODOMETER',
          distanceBasis: 'INVALID_SLIP_ODOMETERS',
        },
      ],
      summary: slipSummary,
      meta: {},
    });
    mount('&fuelView=bill&billView=slips');
    expect(await screen.findByText('Invalid odometer')).toBeInTheDocument();
    expect(screen.getByText('Invalid slip odometers')).toBeInTheDocument();
    expect(screen.queryByText('Engine windows')).not.toBeInTheDocument();
    expect(screen.getAllByText('150 L').length).toBeGreaterThan(0);
  });
  it('shows minor movement without downgrading an otherwise priced day', async () => {
    Service.dailyFuel.mockResolvedValue({
      rows: [
        {
          id: 'minor',
          day: '2026-11-16',
          vehicleNumber: 'WB11TEST',
          driverName: 'Arun',
          fuelUsedLitres: 20,
          distanceKm: 60.2,
          mileageKmpl: 3,
          mileagePartial: true,
          mileageDistanceKm: 60,
          mileageFuelLitres: 20,
          mileageExcludedMinutes: 60,
          minorMovementWindows: 1,
          minorMovementKm: 0.2,
          knownCost: 2000,
          estimatedCost: 2000,
          costStatus: 'COSTED',
          inconsistentZero: false,
          measuredMinutes: 1440,
          fullDay: true,
          rateMin: 100,
          rateMax: 100,
          priceDates: [],
          priceReferences: [],
          sources: [],
          sourceIds: [],
          qualityWarnings: [
            {
              id: 'w',
              from: '2026-11-16T06:00:00Z',
              to: '2026-11-16T07:00:00Z',
              distanceKm: 0.2,
              reason: 'MINOR_ZERO_FUEL_MOVEMENT',
            },
          ],
        },
      ],
      summary: {
        vehicleDays: 1,
        vehicleCount: 1,
        knownCostSubtotal: 2000,
        costedDays: 1,
        positivelyPricedDays: 1,
        positivelyPricedTrucks: 1,
      },
      meta: {},
    });
    mount();
    expect(await screen.findByText('Minor movement · within allowance')).toBeInTheDocument();
    expect(screen.queryByText('Partial subtotal')).not.toBeInTheDocument();
    expect(screen.queryByText('Measurement needs checking')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /View details for/ }));
    expect(screen.getByText('Minor movement · report retained')).toBeInTheDocument();
    expect(screen.getByText(/downgrade fuel cost or report eligibility/)).toBeInTheDocument();
  });
  it('shows known partial cost and keeps zero-use trucks separate from trucks with priced fuel', async () => {
    Service.dailyFuel.mockResolvedValue({
      rows: [
        {
          id: 'day',
          day: '2026-11-17',
          vehicleNumber: 'WB11TEST',
          driverName: 'Arun',
          fuelUsedLitres: 20,
          distanceKm: 60.1,
          mileageKmpl: 3,
          mileagePartial: true,
          knownCost: 2000,
          estimatedCost: null,
          costStatus: 'PARTIAL',
          inconsistentZero: true,
          measuredMinutes: 1440,
          fullDay: true,
          rateMin: 100,
          rateMax: 100,
          priceDates: [],
          priceReferences: [],
          sources: [],
          sourceIds: [],
        },
      ],
      summary: {
        vehicleDays: 121,
        vehicleCount: 121,
        knownCostSubtotal: 2000,
        costedDays: 55,
        positivelyPricedDays: 79,
        positivelyPricedTrucks: 79,
        partialCostDays: 24,
        zeroUseDays: 35,
        unpricedDays: 7,
        mileagePartialDays: 24,
        partialDays: 5,
      },
      meta: {
        missingVehicleCount: 5,
        fleetVehicleCount: 126,
        missingVehicleNumbers: ['MISSING-TRUCK'],
      },
    });
    mount();
    expect(await screen.findByText('Partial subtotal')).toBeInTheDocument();
    expect(
      screen.getByText('79 distinct trucks · 79 truck-days with priced fuel'),
    ).toBeInTheDocument();
    expect(screen.getByText(/35 zero fuel reported/)).toBeInTheDocument();
    expect(screen.getByText(/5 of 126 fleet trucks have no usable engine/)).toBeInTheDocument();
    expect(screen.queryByText(/90.*fully priced/)).not.toBeInTheDocument();
    expect(screen.getByText('Usable windows only')).toBeInTheDocument();
    expect(screen.getAllByText(/2,000/).length).toBeGreaterThan(0);
  });
  it('shows Digest state-history price evidence and flags a latest-earlier quote', async () => {
    Service.dailyFuel.mockResolvedValue({
      rows: [
        {
          id: 'day',
          vehicleNumber: 'WB11TEST',
          day: '2026-11-05',
          driverName: 'Arun',
          fuelUsedLitres: 20,
          distanceKm: 60,
          mileageKmpl: 3,
          rateMin: 99,
          rateMax: 99,
          priceDates: ['2026-11-04'],
          pricingRegions: 'BR',
          stalePrice: true,
          estimatedCost: 1980,
          unpricedLitres: 0,
          measuredMinutes: 60,
          fullDay: false,
          apportioned: false,
          sources: ['FleetEdge'],
          sourceIds: ['engine'],
          priceReferences: [
            {
              id: 'price',
              at: '2026-11-03T08:00:00+05:30',
              regionCode: 'BR',
              priceDate: '2026-11-04',
              inrPerL: 99,
              rate: 99,
              source: 'STATE_HISTORY',
              stale: true,
            },
          ],
        },
      ],
      summary: {
        vehicleDays: 1,
        vehicleCount: 1,
        partialDays: 1,
        costedDays: 1,
        stalePriceDays: 1,
      },
      meta: {},
    });
    mount();
    expect(await screen.findByText(/BR.*earlier quote/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Diesel valuation' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Last-slip price' })).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'View details for WB11TEST on 2026-11-05' }),
    );
    expect(await screen.findByText('State history · earlier stored quote')).toBeInTheDocument();
  });
  it('defaults to day-wise engine reporting and keeps all scope when switching bill modes', async () => {
    mount('&manufacturer=TATA&vehicle=truck-id');
    await screen.findByText('Daily engine consumption');
    expect(Service.dailyFuel).toHaveBeenCalledWith(
      expect.objectContaining({ manufacturer: 'TATA', vehicleId: 'truck-id' }),
      expect.anything(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bill-to-bill' }));
    await waitFor(() => expect(Service.fullTankCycles).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Slip → Slip' }));
    await screen.findByText('WB11TEST');
    expect(Service.slipIntervals).toHaveBeenCalledWith(
      expect.objectContaining({ manufacturer: 'TATA', vehicleId: 'truck-id' }),
      expect.anything(),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('billView=slips');
    expect(screen.getByTestId('location')).toHaveTextContent('manufacturer=TATA');
  });
  it('keeps complete engine mileage visible when capacity is missing and explains the evidence', async () => {
    mount('&fuelView=bill&billView=slips');
    expect(await screen.findByText('Tank capacity required')).toBeInTheDocument();
    expect(screen.getAllByText('3 km/L').length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole('button', { name: 'View details for WB11TEST slip interval' }),
    );
    expect(
      await screen.findByText('Engine consumption and tank reconciliation'),
    ).toBeInTheDocument();
    expect(screen.getByText(/closing purchase updates the tank/)).toBeInTheDocument();
  });
  it('shows partial coverage without presenting its measured subtotal as full-interval consumption', async () => {
    Service.slipIntervals.mockResolvedValue({
      rows: [
        {
          ...slipRow,
          completeCoverage: false,
          measuredMinutes: 720,
          fuelUsedLitres: null,
          mileageKmpl: null,
          estimatedCost: null,
          quality: 'ENGINE_GAP',
        },
      ],
      summary: {
        ...slipSummary,
        incompleteIntervals: 1,
        fuelUsedLitres: null,
        mileageKmpl: null,
        estimatedCost: null,
        costedIntervals: 0,
      },
      meta: {},
    });
    mount('&fuelView=bill&billView=slips');
    expect(await screen.findByText('Incomplete engine data')).toBeInTheDocument();
    expect(screen.getByText('12 / 24 h covered')).toBeInTheDocument();
    expect(screen.queryByText('3 km/L')).not.toBeInTheDocument();
  });
  it('preserves the purchases view alongside the new calculation modes', async () => {
    Service.fuelMileage.mockResolvedValue({
      rows: [],
      summary: { groupCount: 0, measuredGroups: 0 },
      meta: {},
    });
    mount('&fuelView=bill&billView=purchases');
    await waitFor(() => expect(Service.fuelMileage).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Purchases' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
  it('does not query slip intervals for an incomplete date range', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/reports?report=fuelMileage&fuelView=bill&billView=slips&from=2026-11-01',
        ]}
      >
        <FuelReportPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Choose both');
    expect(Service.slipIntervals).not.toHaveBeenCalled();
  });
});
