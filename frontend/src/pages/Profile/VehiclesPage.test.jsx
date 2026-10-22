import { it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehiclesPage from './VehiclesPage.jsx';
import { VehicleService } from './VehicleService.js';

vi.mock('./VehicleService.js', () => ({
  VehicleService: { getAllVehicles: vi.fn(), getManufacturerOptions: vi.fn() },
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
  await screen.findByRole('option', { name: 'Ashok Leyland' });
  await waitFor(() => expect(VehicleService.getAllVehicles).toHaveBeenCalled());
  expect(screen.getByText('Account')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Next page'));
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(null, 2, 10, expect.anything()),
  );
  fireEvent.change(screen.getByLabelText('Manufacturer'), { target: { value: 'ASHOK LEYLAND' } });
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(
      null,
      1,
      10,
      expect.objectContaining({ manufacturer: 'ASHOK LEYLAND' }),
    ),
  );
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'WB11' } });
  await waitFor(() =>
    expect(VehicleService.getAllVehicles).toHaveBeenLastCalledWith(
      null,
      1,
      10,
      expect.objectContaining({ manufacturer: 'ASHOK LEYLAND', search: 'WB11' }),
    ),
  );
});
