import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FleetDataService from '../../services/FleetDataService';
import billPhotoService from '../../services/billPhotoService';
import VehicleHeaderCard from './VehicleHeaderCard';
import FuelPanel from './panels/FuelPanel';
import TelemetryPanel from './panels/TelemetryPanel';
import TyresPanel from './panels/TyresPanel';
import { vehicleAxles } from './vehicleAxles';
import { fluidLevels } from './panels/overview/referenceOverviewModel';

vi.mock('../../services/FleetDataService', () => ({
  default: {
    getVehicleOverview: vi.fn(),
    getVehicleTelemetry: vi.fn(),
    getTyreStatus: vi.fn(),
  },
}));
vi.mock('../../services/billPhotoService', () => ({ default: { uploadBillPhoto: vi.fn() } }));
vi.mock('./VehicleMiniMap', () => ({ default: () => <div>Vehicle map</div> }));
vi.mock('../Compliance/OpenChallanBadge', () => ({ default: () => null }));
const mount = (node) => render(<MemoryRouter>{node}</MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks();
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
  it('updates the truck drawing when the recorded axle count changes', async () => {
    const { rerender } = mount(
      <VehicleHeaderCard
        reg="WB11T0662"
        profile={{ fleetMaster: { axleCount: 3 } }}
        onGoTab={vi.fn()}
      />,
    );
    const drawing = screen.getByRole('img', { name: /3-axle truck/ });
    expect(drawing.querySelectorAll('g')).toHaveLength(3);
    rerender(
      <MemoryRouter>
        <VehicleHeaderCard
          reg="WB11T0662"
          profile={{ fleetMaster: { axleCount: 4 } }}
          onGoTab={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img', { name: /4-axle truck/ }).querySelectorAll('g')).toHaveLength(4);
    await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalled());
  });
});

describe('sensor cards', () => {
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
    mount(<FuelPanel registrationNumber="WB11T0662" kmPerLitre={{ kmPerLitre: 4 }} />);
    await screen.findByText('Fuel & DEF levels');
    expect(screen.getByText('0 km')).toBeInTheDocument();
    expect(screen.getAllByText('Tank sensor · litres')).toHaveLength(2);
    expect(screen.getByText('160 L tank')).toBeInTheDocument();
  });
});

describe('telemetry availability', () => {
  it('shows labelled placeholder zeroes when the backend is unavailable', async () => {
    FleetDataService.getVehicleTelemetry.mockRejectedValue({ status: 404 });
    mount(<TelemetryPanel registrationNumber="WB11T0662" />);
    await screen.findByText('Engine & electrical · readings');
    expect(screen.getAllByText('0').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Data unavailable').length).toBeGreaterThan(1);
    expect(screen.queryByText('Couldn’t load telemetry')).not.toBeInTheDocument();
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
    expect(screen.getByText('IALERT CAN')).toBeInTheDocument();
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
