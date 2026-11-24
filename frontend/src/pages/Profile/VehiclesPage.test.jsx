import { changeField } from '@/test/changeField';
import { it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehiclesPage from './VehiclesPage.jsx';
import { VehicleService } from './VehicleService.js';

vi.mock('./VehicleService.js', () => ({
  VehicleService: { getAllVehicles: vi.fn(), getManufacturerOptions: vi.fn() },
}));
vi.mock('../LiveTracking/LiveTrackingService', () => ({
  LiveTrackingService: { getPositions: vi.fn().mockResolvedValue([]) },
}));
vi.mock('./FleetEdgeAccountService.js', () => ({ listAccounts: vi.fn(async () => []) }));
vi.mock('../../contexts/fleetLinkContext', () => ({
  useFleetLink: () => ({ index: {}, data: { accounts: [] } }),
}));
vi.mock('../../components/ui/PageShell', () => ({
  default: ({ filters, children }) => (
    <div>
      {filters}
      {children}
    </div>
  ),
}));
vi.mock('../../components/ui/DataTable', () => ({
  default: ({ rows, columns, pagination }) => (
    <div>
      {columns.map((column) => (
        <span key={column.key}>{column.label}</span>
      ))}
      {rows.map((row) => (
        <div key={row.id}>{row.registration_no}</div>
      ))}
      {pagination}
    </div>
  ),
}));
vi.mock('./BulkUploadVehiclesPanel.jsx', () => ({ default: () => null }));
vi.mock('../../components/ui/ExportButton', () => ({ default: () => null }));
vi.mock('@/components/ui/popover', () =>
  import('../../test/baseUiStubs.jsx').then((module) => module.popover),
);

beforeEach(() => {
  vi.clearAllMocks();
  VehicleService.getManufacturerOptions.mockResolvedValue([
    { value: 'TATA', label: 'Tata' },
    { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
  ]);
  VehicleService.getAllVehicles.mockResolvedValue({ data: [], meta: { total: 20, totalPages: 2 } });
});

it('filters manufacturer on the server and resets pagination without stale rows', async () => {
  render(
    <MemoryRouter>
      <VehiclesPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Vehicle filters' }));
  fireEvent.click(screen.getByLabelText('Manufacturer'));
  await screen.findByRole('option', { name: 'Ashok Leyland' });
  await waitFor(() => expect(VehicleService.getAllVehicles).toHaveBeenCalled());
  expect(screen.getByText('Live status')).toBeInTheDocument();
  expect(screen.getByText('Details')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Next page'));
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(null, 2, 50, expect.anything()),
  );
  changeField(screen.getByLabelText('Manufacturer'), { target: { value: 'ASHOK LEYLAND' } });
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(
      null,
      1,
      50,
      expect.objectContaining({ manufacturer: 'ASHOK LEYLAND' }),
    ),
  );
  changeField(screen.getByRole('searchbox'), { target: { value: 'WB11' } });
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(
      null,
      1,
      50,
      expect.objectContaining({ manufacturer: 'ASHOK LEYLAND', search: 'WB11' }),
    ),
  );
});

it('applies document and account filters to the server page', async () => {
  render(
    <MemoryRouter>
      <VehiclesPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Vehicle filters' }));
  fireEvent.click(screen.getByText('Missing required documents'));
  changeField(screen.getByLabelText('Telematics account'), { target: { value: 'unlinked' } });
  changeField(screen.getByLabelText('Vehicles per page'), { target: { value: '25' } });
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(
      null,
      1,
      25,
      expect.objectContaining({ missingDocs: true, account: 'unlinked' }),
    ),
  );
});
