import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ exportProps: null }));

vi.mock('../../../components/ui/ExportButton', () => ({
  default: (props) => {
    captured.exportProps = props;
    return <button type="button">Export</button>;
  },
}));

// The table, the columns and the panels are not what this test is about —
// only the export wiring of the page is.
vi.mock('../../../components/ui/DataTable', () => ({
  default: () => <div>table</div>,
}));
vi.mock('./useFuelCyclesColumns.jsx', () => ({
  useFuelCyclesColumns: () => [{ key: 'vehicle', label: 'Vehicle' }],
}));
vi.mock('./CycleTripsPanel', () => ({ default: () => <div>trips</div> }));
vi.mock('../../../components/filters/ManufacturerFilter', () => ({
  default: () => <div>manufacturers</div>,
}));
vi.mock('./ReportEntityPicker', () => ({ VehiclePicker: () => <div>vehicles</div> }));

vi.mock('../ReportsService.js', () => ({
  ReportsService: {
    getFuelCycles: vi.fn(async () => ({
      data: [
        {
          _id: 'c1',
          registrationNumber: 'WB25W1040',
          fullBasis: 'SLIP',
          flags: [],
          km: { odo: 1200 },
          tripSummary: { ladenKm: 900, otherKm: 180, cycleKm: 1200, count: 2 },
          mileage: { tankToTank: 3.1 },
          open: { at: '2026-09-01T00:00:00.000Z' },
          fuel: { bills: 100, unaccounted: 0 },
        },
      ],
    })),
    searchVehicles: vi.fn(async () => []),
    searchDrivers: vi.fn(async () => []),
  },
}));

vi.mock('../../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(async () => []),
}));

vi.mock('../../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn(async () => []),
}));

const FuelCyclesReport = (await import('./FuelCyclesReport')).default;

const mount = () =>
  render(
    <MemoryRouter>
      <FuelCyclesReport />
    </MemoryRouter>,
  );

describe('FuelCyclesReport — the report it mails', () => {
  beforeEach(() => {
    captured.exportProps = null;
  });

  it('spec 5: the server builds the oil report, with the filters on screen', async () => {
    mount();

    await waitFor(() => expect(captured.exportProps).not.toBeNull());
    const { email } = captured.exportProps;
    // The oil report is a server-built file, so the e-mail names the report
    // and hands the server the filters instead of uploading a file.
    expect(email.report).toBe('fuel-cycles');
    expect(email.label).toBe('Oil report');
    expect(email.params.format).toBe('xlsx');
    expect(email.params.fullToFull).toBe(true);
    expect(email.buildFile).toBeUndefined();
  });

  it('spec 5: the search box travels with the mailed report', async () => {
    mount();

    await waitFor(() => expect(captured.exportProps).not.toBeNull());
    fireEvent.change(screen.getByLabelText('Search vehicle'), {
      target: { value: 'WB25' },
    });

    await waitFor(() => expect(captured.exportProps.email.params.search).toBe('WB25'));
    expect(captured.exportProps.email.report).toBe('fuel-cycles');
  });
});
