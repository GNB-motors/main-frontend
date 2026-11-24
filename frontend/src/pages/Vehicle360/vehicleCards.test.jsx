import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FleetDataService from '../../services/FleetDataService';
import billPhotoService from '../../services/billPhotoService';
import VehicleHeaderCard from './VehicleHeaderCard';
import ServicePanel from './panels/ServicePanel';
import { ServiceCard } from './panels/overview/ReferenceOverviewCards';
import FuelPanel from './panels/FuelPanel';
import TelemetryPanel from './panels/TelemetryPanel';
import TyresPanel from './panels/TyresPanel';
import { getUserRole } from '@/utils/session';
import { vehicleAxles } from './vehicleAxles';
import { toISTDateString } from '../../utils/dateUtils';
import { fluidLevels } from './panels/overview/referenceOverviewModel';

vi.mock('../../services/FleetDataService', () => ({
  default: {
    getVehicleOverview: vi.fn(),
    getVehicleTelemetry: vi.fn(),
    getVehicleHealth: vi.fn().mockResolvedValue({ history: [] }),
    getTyreStatus: vi.fn(),
    fitTyreSet: vi.fn(),
  },
}));
vi.mock('@/utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: vi.fn(() => 'OWNER'),
}));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getVehicleTrack: vi.fn().mockResolvedValue({ points: [] }) },
}));
vi.mock('../../services/billPhotoService', () => ({ default: { uploadBillPhoto: vi.fn() } }));
vi.mock('./panels/ServiceInsights', () => ({ ServiceCentreCard: () => null }));
vi.mock('./VehicleMiniMap', () => ({ default: () => <div>Vehicle map</div> }));
vi.mock('../Compliance/OpenChallanBadge', () => ({ default: () => null }));
const mount = (node) => render(<MemoryRouter>{node}</MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  FleetDataService.fitTyreSet.mockResolvedValue({ id: 'set1' });
  FleetDataService.getVehicleOverview.mockResolvedValue({
    fuel: { litres: null, percent: null, at: null },
    def: { litres: null, percent: null, at: null },
  });
  FleetDataService.getTyreStatus.mockResolvedValue({ vehicles: [] });
  billPhotoService.uploadBillPhoto.mockResolvedValue({ id: 'fill-one', reviewStatus: 'AUTO_OK' });
});

describe('recorded axle configuration', () => {
  it('prefers recorded axle count and parses explicit classes without guessing by model', () => {
    expect(vehicleAxles({ axleCount: 3, axleClass: '4 axle' })).toBe(3);
    expect(vehicleAxles({ axleClass: '6x4' })).toBe(3);
    expect(vehicleAxles({ axleClass: '4 axle' })).toBe(4);
    expect(vehicleAxles({ model: '2820' })).toBeNull();
  });
  it('shows measured daily activity and gives live motion its own status', async () => {
    const day = toISTDateString(new Date());
    mount(
      <VehicleHeaderCard
        reg="WB11T0662"
        profile={{
          fleetMaster: { status: 'AVAILABLE', axleCount: 3 },
          livePosition: {
            eventDateTime: new Date().toISOString(),
            speed: 30,
            ignition: true,
            latitude: 22,
            longitude: 88,
            address: '22.0000, 88.0000',
            area: 'Dankuni',
          },
        }}
        overview={{
          days: [{ day, engineKm: 52 }],
          today: { day, idleMin: 0, dieselUsedL: null },
        }}
        onGoTab={vi.fn()}
      />,
    );
    expect(screen.getByText('Moving · ignition on')).toBeInTheDocument();
    expect(screen.queryByText('AVAILABLE')).not.toBeInTheDocument();
    expect(screen.getByText('Dankuni')).toBeInTheDocument();
    expect(screen.queryByText('22.0000, 88.0000')).not.toBeInTheDocument();
    const today = within(screen.getByRole('region', { name: 'Today’s truck activity' }));
    expect(today.getByText('52 km')).toBeInTheDocument();
    expect(today.getByText('0 min')).toBeInTheDocument();
    expect(today.getByText('Not measured')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View specs' }));
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('Axles').nextElementSibling).toHaveTextContent('3');
    await screen.findByText('Vehicle map');
  });
});

describe('sensor cards', () => {
  it('opens the working mileage page filtered to the current truck', async () => {
    mount(<FuelPanel registrationNumber="WB11T0662" />);
    const link = await screen.findByRole('link', { name: 'All fuel entries →' });
    expect(link).toHaveAttribute('href', '/mileage?vehicle=WB11T0662&search=WB11T0662');
    expect(screen.getByRole('link', { name: /Open fuel ledger/ })).toHaveAttribute(
      'href',
      link.getAttribute('href'),
    );
  });
  it('does not substitute a poll timestamp for a missing sensor timestamp', () => {
    const [fuel, def] = fluidLevels(
      { fuel: { at: null, percent: null }, def: { at: null, percent: null } },
      { primaryFuelLevel: 50, fuelLevelUnit: 'percent', pulledAt: '2026-11-07T10:00:00Z' },
    );
    expect(fuel.at).toBeNull();
    expect(fuel.percent).toBeNull();
    expect(def.at).toBeNull();
  });
  it('does not invent a tank capacity, mileage or range for missing readings', async () => {
    mount(<FuelPanel registrationNumber="WB11T0662" />);
    await screen.findByText('Fuel & DEF levels');
    expect(screen.getAllByText('Capacity not recorded')).toHaveLength(2);
    expect(screen.getByText('No estimate')).toBeInTheDocument();
    expect(screen.queryByText(/3\.8 km/)).not.toBeInTheDocument();
    expect(screen.getByText('Can’t audit yet')).toBeInTheDocument();
  });
  it('shows real zero sensor litres and derives a zero range from measured economy', async () => {
    FleetDataService.getVehicleOverview.mockResolvedValue({
      fuel: {
        litres: 0,
        percent: 0,
        capacityL: 160,
        at: '2026-11-07T10:00:00Z',
        litresBasis: 'SENSOR_LITRES',
      },
      def: { litres: 8.8, percent: null, at: '2026-11-07T10:00:00Z', litresBasis: 'SENSOR_LITRES' },
    });
    mount(<FuelPanel registrationNumber="WB11T0662" kmPerLitre={{ kmPerL: 4 }} />);
    await screen.findByText('Fuel & DEF levels');
    expect(screen.getByText('0 km')).toBeInTheDocument();
    expect(screen.getAllByText('Tank sensor · litres')).toHaveLength(2);
    expect(screen.getByText('160 L tank')).toBeInTheDocument();
  });
});

describe('telemetry availability', () => {
  it('shows a retry instead of zero readings when telemetry fails', async () => {
    FleetDataService.getVehicleTelemetry.mockRejectedValue({ status: 404 });
    mount(<TelemetryPanel registrationNumber="WB11T0662" />);
    expect(await screen.findByText('Could not load telemetry')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    FleetDataService.getVehicleTelemetry.mockResolvedValue({ channels: [], readings: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText('Engine & electrical · last known readings');
    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    expect(FleetDataService.getVehicleHealth).toHaveBeenLastCalledWith(
      'WB11T0662',
      { days: 7, limit: 2000 },
      expect.any(AbortSignal),
    );
  });
  it('preserves a reported zero RPM and does not manufacture missing readings', async () => {
    FleetDataService.getVehicleTelemetry.mockResolvedValue({
      channels: [],
      readings: [
        {
          key: 'rpm',
          label: 'Engine speed',
          value: 0,
          unit: 'rpm',
          at: '2026-11-07T10:00:00Z',
          source: 'IALERT_CAN',
        },
        { key: 'gear', label: 'Gear', value: null, unit: '' },
      ],
    });
    mount(<TelemetryPanel registrationNumber="WB11T0662" />);
    await screen.findByText('Engine & electrical · last known readings');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});

it('shows set data without attributing it to every individual wheel', async () => {
  FleetDataService.getTyreStatus.mockResolvedValue({
    vehicles: [
      {
        vehicleId: 'v1',
        registrationNumber: 'WB11T0662',
        tyreCount: 10,
        fittedOdometer: 100,
        currentOdometer: null,
        kmRun: 0,
        remainingKm: 80000,
      },
    ],
  });
  mount(<TyresPanel fleetMaster={{ id: 'v1', registrationNumber: 'WB11T0662', axleCount: 3 }} />);
  await screen.findByText('10 tyres recorded');
  expect(within(screen.getByRole('table')).getAllByText('Not recorded')).toHaveLength(10);
  expect(screen.queryByText('80,000 km')).not.toBeInTheDocument();
});

it('opens the compact photo dialog for this vehicle and refreshes after saving', async () => {
  mount(
    <VehicleHeaderCard
      reg="WB11T0662"
      profile={{ fleetMaster: { _id: 'vehicle-one' } }}
      onGoTab={vi.fn()}
    />,
  );
  await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Log fuel' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add bill photo' });
  expect(dialog).toHaveTextContent('WB11T0662');
  expect(within(dialog).queryByLabelText('Litres')).not.toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText('Bill photo'), {
    target: { files: [new File(['bill'], 'bill.jpg', { type: 'image/jpeg' })] },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Upload' }));
  fireEvent.click(within(dialog).getByRole('combobox', { name: 'Tank full?' }));
  fireEvent.click(screen.getByRole('option', { name: 'No — partial fill' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Upload & save' }));
  await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalledTimes(2));
  expect(billPhotoService.uploadBillPhoto.mock.calls[0][0].body.get('vehicleId')).toBe(
    'vehicle-one',
  );
  fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('shows the same service distance in the header, overview and service tab after live km advances', async () => {
  const prediction = {
    currentOdometer: 10000,
    lastServiceOdometer: 5000,
    projectedServiceDueOdometer: 15000,
    kmUntilDue: 5000,
    risk: 'FINE',
  };
  const health = { canOdo: 12000 };
  mount(
    <>
      <div data-testid="service-header">
        <VehicleHeaderCard reg="WB11T0662" profile={{ prediction, health }} onGoTab={vi.fn()} />
      </div>
      <div data-testid="service-overview">
        <ServiceCard
          prediction={prediction}
          health={health}
          overview={{ odometer: { value: 13000 } }}
          onGoTab={vi.fn()}
        />
      </div>
      <div data-testid="service-tab">
        <ServicePanel prediction={prediction} health={health} />
      </div>
    </>,
  );
  await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalled());
  for (const id of ['service-header', 'service-overview', 'service-tab']) {
    expect(within(screen.getByTestId(id)).getAllByText('5,000 km').length).toBeGreaterThan(0);
    expect(within(screen.getByTestId(id)).queryByText('2,000 km')).not.toBeInTheDocument();
  }
  expect(
    within(screen.getByTestId('service-overview')).getByText('10,000 at forecast'),
  ).toBeInTheDocument();
});

it('shows one actionable empty tyre state and saves the real set', async () => {
  mount(<TyresPanel fleetMaster={{ id: 'v1', registrationNumber: 'WB11T0662' }} />);
  const form = await screen.findByRole('form', { name: 'Add tyre details' });
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByText('Change layout')).not.toBeInTheDocument();
  fireEvent.change(within(form).getByLabelText('Fitted on'), { target: { value: '2026-11-24' } });
  for (const [label, value] of [
    ['Odometer at fitment (km)', '125000'],
    ['Number of tyres', '10'],
    ['Total set cost (₹)', '250000'],
    ['Expected life (km)', '80000'],
  ]) {
    fireEvent.change(within(form).getByLabelText(label), { target: { value } });
  }
  fireEvent.submit(form);
  await waitFor(() =>
    expect(FleetDataService.fitTyreSet).toHaveBeenCalledWith({
      vehicleId: 'v1',
      fittedAt: '2026-11-24T00:00:00+05:30',
      fittedOdometer: 125000,
      tyreCount: 10,
      totalCostInr: 250000,
      expectedLifeKm: 80000,
    }),
  );
  await waitFor(() => expect(FleetDataService.getTyreStatus).toHaveBeenCalledTimes(2));
});
it('shows a retry state for a failed tyre read instead of a blank layout', async () => {
  FleetDataService.getTyreStatus.mockRejectedValue(new Error('Offline'));
  mount(<TyresPanel fleetMaster={{ id: 'v1' }} />);
  expect(await screen.findByText('Couldn’t load tyre details')).toBeInTheDocument();
  expect(screen.queryByText('Add tyre details')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
it('keeps tyre writes restricted to owners and managers', async () => {
  getUserRole.mockReturnValue('DRIVER');
  mount(<TyresPanel fleetMaster={{ id: 'v1' }} />);
  await screen.findByText('Add tyre details');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
});
it('preserves entered tyre details when saving fails', async () => {
  FleetDataService.fitTyreSet.mockRejectedValue(new Error('Offline'));
  mount(<TyresPanel fleetMaster={{ id: 'v1' }} />);
  const form = await screen.findByRole('form', { name: 'Add tyre details' });
  fireEvent.change(within(form).getByLabelText('Brand (optional)'), { target: { value: 'MRF' } });
  fireEvent.submit(form);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save tyre details');
  expect(within(form).getByLabelText('Brand (optional)')).toHaveValue('MRF');
  expect(screen.getByRole('button', { name: 'Save tyre details' })).toBeEnabled();
});
