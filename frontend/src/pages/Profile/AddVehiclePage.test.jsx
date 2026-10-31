import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddVehiclePage from './AddVehiclePage.jsx';
import { VehicleService } from './VehicleService.js';
import { reassignVehicleAccount } from './FleetEdgeAccountService.js';

vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false }),
}));
vi.mock('../../contexts/BranchContext.jsx', () => ({
  useActiveBranch: () => ({ branchId: null, branches: [] }),
}));
vi.mock('../../utils/session.js', () => ({
  getThemeColor: () => null,
  getToken: () => 'test',
  getProfileField: () => null,
  getUserRole: () => 'OWNER',
}));
vi.mock('./VehicleService.js', () => ({
  VehicleService: {
    getManufacturerOptions: vi.fn(),
    addVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    uploadVehicleDocument: vi.fn(),
    getVehicleDocuments: vi.fn(async () => []),
  },
}));
vi.mock('./FleetEdgeAccountService.js', () => ({
  listAccounts: vi.fn(async () => [
    { _id: 'account1', friendlyName: 'Main account', source: 'EXTENSION', status: 'ACTIVE' },
  ]),
  reassignVehicleAccount: vi.fn(),
}));
vi.mock('./Component/VehicleDocumentUpload.jsx', () => ({
  default: ({ onDocumentsChange }) => (
    <label>
      RC file
      <input
        type="file"
        aria-label="RC file"
        onChange={(event) =>
          onDocumentsChange({ rc: { front: { file: event.target.files[0] }, expiryDate: '' } })
        }
      />
    </label>
  ),
  VEHICLE_DOC_TYPES: [{ key: 'rc', backendType: 'RC', label: 'RC', sides: ['front'] }],
  emptyDocsState: () => ({}),
}));
vi.mock('./ImportVehicleDialog', () => ({ ImportVehicleDialog: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  VehicleService.getManufacturerOptions.mockResolvedValue([
    { value: 'TATA', label: 'Tata' },
    { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
  ]);
  VehicleService.addVehicle.mockResolvedValue({ _id: 'vehicle1' });
  VehicleService.updateVehicle.mockResolvedValue({ _id: 'vehicle1' });
  VehicleService.uploadVehicleDocument.mockResolvedValue({});
});
async function fillForm() {
  fireEvent.click(await screen.findByRole('radio', { name: 'Tata' }));
  fireEvent.change(screen.getByLabelText('Registration number'), {
    target: { value: 'WB11F1234' },
  });
  fireEvent.change(screen.getByLabelText('Chassis / VIN'), {
    target: { value: 'MAT12345678912345' },
  });
  fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Signa' } });
}
describe('Add Vehicle save flow', () => {
  it('retains a saved vehicle after account failure and retries assignment without duplicate create', async () => {
    reassignVehicleAccount
      .mockRejectedValueOnce(new Error('Account unavailable'))
      .mockResolvedValueOnce({});
    render(
      <MemoryRouter>
        <AddVehiclePage />
      </MemoryRouter>,
    );
    await fillForm();
    await screen.findByRole('option', { name: 'Main account' });
    fireEvent.change(screen.getByLabelText(/Account/), { target: { value: 'account1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
    await screen.findByText(/Vehicle saved.*Account unavailable/);
    expect(VehicleService.addVehicle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
    await waitFor(() => expect(reassignVehicleAccount).toHaveBeenCalledTimes(2));
    expect(VehicleService.addVehicle).toHaveBeenCalledTimes(1);
    expect(VehicleService.updateVehicle).toHaveBeenCalledWith(
      null,
      'vehicle1',
      expect.objectContaining({ manufacturer: 'TATA' }),
    );
  });
  it('clears an incompatible account when manufacturer changes', async () => {
    render(
      <MemoryRouter>
        <AddVehiclePage />
      </MemoryRouter>,
    );
    await fillForm();
    await screen.findByRole('option', { name: 'Main account' });
    fireEvent.change(screen.getByLabelText(/Account/), { target: { value: 'account1' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Ashok Leyland' }));
    expect(screen.getByLabelText(/Account/)).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Account cleared');
  });
});

it('retains files on an upload failure and retries without creating another vehicle', async () => {
  VehicleService.uploadVehicleDocument
    .mockRejectedValueOnce(new Error('Upload failed'))
    .mockResolvedValueOnce({});
  render(
    <MemoryRouter>
      <AddVehiclePage />
    </MemoryRouter>,
  );
  await fillForm();
  fireEvent.change(screen.getByLabelText('RC file'), {
    target: { files: [new File(['RC'], 'rc.pdf', { type: 'application/pdf' })] },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
  await screen.findByText(/Vehicle saved.*RC upload failed/);
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() => expect(VehicleService.uploadVehicleDocument).toHaveBeenCalledTimes(2));
  expect(VehicleService.addVehicle).toHaveBeenCalledTimes(1);
});

it('preserves an existing account when opening edit, even when it is unavailable', async () => {
  const editingVehicle = {
    id: 'vehicle1',
    registration_no: 'WB11F1234',
    chassis_number: 'MAT12345678912345',
    model: 'Signa',
    manufacturer: 'TATA',
    fleetEdgeAccountId: 'unavailable-account',
  };
  render(
    <MemoryRouter initialEntries={[{ pathname: '/vehicles/add', state: { editingVehicle } }]}>
      <AddVehiclePage />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Tata' })).toBeChecked());
  expect(screen.getByLabelText(/Account/)).toHaveValue('unavailable-account');
  fireEvent.click(screen.getByRole('button', { name: 'Update vehicle' }));
  await waitFor(() => expect(VehicleService.updateVehicle).toHaveBeenCalled());
  expect(reassignVehicleAccount).not.toHaveBeenCalled();
});
