import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import FuelMileageReport from './FuelMileageReport';
import TripsRunningCostReport from './TripsRunningCostReport';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';

vi.mock('./ConsolidatedReportService', () => ({
  ConsolidatedReportService: {
    fuelMileage: vi.fn(),
    fuelDetails: vi.fn(),
    tripsRunningCost: vi.fn(),
  },
}));
vi.mock('../../../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn(async () => [{ value: 'TATA', label: 'Tata' }]),
}));
vi.mock('../ReportEntityPicker', () => ({
  VehiclePicker: () => <span>Vehicle picker</span>,
  DriverPicker: () => <span>Driver picker</span>,
}));

const period = '&from=2026-11-01&to=2026-11-30';
const row = (id, totalSpend) => ({
  id,
  label: `Truck ${id}`,
  totalSpend,
  dieselLitres: 100,
  dieselSpend: totalSpend,
  defLitres: 0,
  defSpend: 0,
  distanceKm: 400,
  mileageKmpl: 4,
  cycleCount: 1,
  excludedCycleCount: 0,
});
const summary = {
  totalSpend: 30000,
  dieselLitres: 300,
  defLitres: 10,
  mileageKmpl: 3.67,
  cycleCount: 2,
  excludedCycleCount: 1,
  distanceKm: 1100,
  measuredGroups: 2,
  groupCount: 2,
  measuredMembers: 2,
  memberCount: 2,
};
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function mount(Component, query) {
  return render(
    <MemoryRouter initialEntries={['/reports?' + query]}>
      <Component />
      <Location />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Service.fuelMileage.mockResolvedValue({ rows: [row('A', 10000), row('B', 20000)], summary });
  Service.fuelDetails.mockResolvedValue({ rows: [], meta: { total: 0, totalPages: 0 } });
});

describe('new report workflows', () => {
  it('explains when direct trip fuel overrides a conflicting saved role reading', async () => {
    Service.tripsRunningCost.mockResolvedValue({
      rows: [],
      summary: { tripCount: 1, costedTrips: 1, totalCost: 1500 },
      meta: {},
      records: [
        {
          id: 'conflict',
          kind: 'trip',
          vehicleNumber: 'QA11TEST',
          fuelUsedLitres: 12,
          roleFuelL: 10,
          fuelSource: 'TRIP_ENGINE',
          fuelReadingConflict: true,
          mileageKmPerL: 2.5,
          totalCostInr: 1500,
        },
      ],
    });
    mount(TripsRunningCostReport, 'report=tripsRunningCost' + period + '&view=trips');
    expect(
      await screen.findByText('Saved role fuel differs; direct measurement used'),
    ).toBeInTheDocument();
    expect(screen.getByText('12 L')).toBeInTheDocument();
    expect(screen.getByText('2.5 km/L')).toBeInTheDocument();
  });
  it('explains an empty completed-trip period using scoped data freshness and open records', async () => {
    Service.tripsRunningCost.mockResolvedValue({
      rows: [],
      records: [],
      summary: {
        tripCount: 0,
        costedTrips: 0,
        distanceMeasuredTrips: 0,
        approvedCount: 0,
        deviationCount: 0,
      },
      meta: {
        coverage: {
          latestCompletedDeparture: '2026-11-15T13:30:40Z',
          openTripsInPeriod: 11,
          reviewTripsInPeriod: 0,
        },
      },
    });
    mount(TripsRunningCostReport, 'report=tripsRunningCost&from=2026-11-17&to=2026-11-17');
    expect(
      await screen.findByText(/Latest completed-trip departure:.*15.*Nov.*2026/),
    ).toBeInTheDocument();
    expect(screen.getByText(/11 open.*0 awaiting review/)).toBeInTheDocument();
  });
  it('shows the Digest price source and older quote date beside the repriced trip cost', async () => {
    Service.tripsRunningCost.mockResolvedValue({
      rows: [],
      summary: {
        tripCount: 1,
        costedTrips: 1,
        totalCost: 5250,
        distanceMeasuredTrips: 1,
        approvedCount: 0,
        deviationCount: 0,
      },
      meta: { priceBasis: 'DIGEST_LAST_REFUEL_STATE_HISTORY' },
      records: [
        {
          id: 'trip-1',
          kind: 'trip',
          vehicleNumber: 'WB11A1234',
          distanceKm: 150,
          fuelUsedLitres: 50,
          refuelLitres: 200,
          fuelCostInr: 4950,
          wearCostInr: 300,
          totalCostInr: 5250,
          fuelPricing: {
            inrPerL: 99,
            regionCode: 'BR',
            priceDate: '2026-11-02',
            stale: true,
            source: 'STATE_HISTORY',
            refuelAt: '2026-11-01T10:00:00+05:30',
            refuelSource: 'DETECTED_FILL',
          },
        },
      ],
    });
    mount(TripsRunningCostReport, 'report=tripsRunningCost' + period + '&view=trips');
    const quote = await screen.findByText(/99.*BR.*earlier quote/);
    fireEvent.click(quote);
    expect(screen.getByText(/last refuelling state and the reporting day/)).toBeInTheDocument();
    expect(
      screen.getByText(/Price date:.*02.*Nov.*2026.*earlier stored quote/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Refuelling evidence:.*Detected refill/)).toBeInTheDocument();
    expect(screen.getByText('200 L bought during trip')).toBeInTheDocument();
  });
  it('shows the last recorded bill date so an empty current period is not mistaken for fresh zero spending', async () => {
    Service.fuelMileage.mockResolvedValue({
      rows: [],
      summary,
      meta: { dataAsOf: '2026-08-19T12:03:00.000Z' },
    });
    mount(FuelMileageReport, 'report=fuelMileage' + period);
    const notice = await screen.findByText(/Latest recorded fuel bill:/);
    expect(notice.textContent).toMatch(/19.*Aug.*2026/);
    expect(
      screen.getByText(/An empty period does not establish zero fuel use/),
    ).toBeInTheDocument();
  });
  it('retains fast search edits while committing the final text to the shareable URL', async () => {
    mount(FuelMileageReport, 'report=fuelMileage' + period);
    await screen.findByText('Truck A');
    const input = screen.getByPlaceholderText('Search truck or model');
    for (const value of ['W', 'WB', 'WB11', 'WB11B5678'])
      fireEvent.change(input, { target: { value } });
    expect(input).toHaveValue('WB11B5678');
    await waitFor(() =>
      expect(Service.fuelMileage).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'WB11B5678' }),
        expect.anything(),
      ),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('search=WB11B5678');
    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => expect(Service.fuelMileage.mock.lastCall[0]).not.toHaveProperty('search'));
  });
  it('keeps a partially entered period visible and waits for both dates before querying', async () => {
    mount(FuelMileageReport, 'report=fuelMileage&from=2026-11-01&manufacturer=TATA');
    expect(screen.getByLabelText('From date')).toHaveValue('2026-11-01');
    expect(screen.getByLabelText('To date')).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose both');
    expect(Service.fuelMileage).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-11-30' } });
    await screen.findByText('Truck A');
    expect(Service.fuelMileage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: '2026-11-01T00:00:00.000+05:30',
        to: '2026-11-30T23:59:59.999+05:30',
        manufacturer: 'TATA',
      }),
      expect.anything(),
    );
  });

  it('preserves scope across grouping and sends that exact period into the evidence request', async () => {
    mount(
      FuelMileageReport,
      'report=fuelMileage' + period + '&vehicle=vehicle-id&manufacturer=TATA',
    );
    await screen.findByText('Truck A');
    fireEvent.click(screen.getByRole('button', { name: 'View details for Truck A' }));
    await waitFor(() => expect(Service.fuelDetails).toHaveBeenCalled());
    expect(Service.fuelDetails).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groupId: 'A',
        kind: 'cycles',
        vehicleId: 'vehicle-id',
        manufacturer: 'TATA',
        from: '2026-11-01T00:00:00.000+05:30',
      }),
      expect.anything(),
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Group report by' })).getByRole('button', {
        name: 'Model',
      }),
    );
    await waitFor(() =>
      expect(Service.fuelMileage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          groupBy: 'model',
          vehicleId: 'vehicle-id',
          manufacturer: 'TATA',
        }),
        expect.anything(),
      ),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('group=model');
    expect(screen.getByText(/these figures do not rank the best model/)).toBeInTheDocument();
  });

  it('changes the initial descending spend sort into ascending without getting stuck on the default', async () => {
    mount(FuelMileageReport, 'report=fuelMileage' + period);
    await screen.findByText('Truck A');
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Truck B');
    fireEvent.click(screen.getByRole('button', { name: 'Fuel spend' }));
    await waitFor(() => expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Truck A'));
  });

  it('blocks reversed dates without displaying a stale subtotal', async () => {
    mount(FuelMileageReport, 'report=fuelMileage&from=2026-11-30&to=2026-11-01');
    expect(screen.getByRole('alert')).toHaveTextContent('start date must be on or before');
    expect(Service.fuelMileage).not.toHaveBeenCalled();
    expect(document.querySelector('.rpt-kpis')).toBeNull();
    await waitFor(() =>
      expect(screen.queryByText('Loading manufacturers…')).not.toBeInTheDocument(),
    );
  });

  it('shows trip purchases separately from consumption and links approved movement to its real review record', async () => {
    Service.tripsRunningCost.mockResolvedValue({
      rows: [],
      summary: {
        tripCount: 1,
        costedTrips: 0,
        totalCost: null,
        distanceMeasuredTrips: 1,
        uncostedRecords: 1,
        partialCostRecords: 0,
        approvedCount: 1,
        deviationCount: 0,
      },
      meta: {},
      records: [
        {
          id: 'trip-1',
          kind: 'trip',
          vehicleNumber: 'WB11A1234',
          from: 'Plant',
          to: 'Depot',
          distanceKm: 150,
          fuelUsedLitres: 50,
          refuelLitres: 200,
          totalCostInr: null,
        },
        {
          id: 'move-1',
          kind: 'approved',
          vehicleNumber: 'WB11A1234',
          purpose: 'Workshop service',
          extraKm: 10,
          totalCostInr: 200,
        },
      ],
    });
    mount(TripsRunningCostReport, 'report=tripsRunningCost' + period + '&view=trips');
    expect(await screen.findByRole('link', { name: 'Open trip' })).toHaveAttribute(
      'href',
      '/auto-trips/trip-1',
    );
    expect(screen.getByText('200 L bought during trip')).toBeInTheDocument();
    expect(screen.getByText('50 L')).toBeInTheDocument();
    expect(screen.getByText('1 not costed')).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Report view' })).getByRole('button', {
        name: 'Extra movement',
      }),
    );
    expect(await screen.findByText('Approved non-business')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review movement' })).toHaveAttribute(
      'href',
      '/auto-trips/excursions/move-1',
    );
  });
});
