import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddDriverPage from './AddDriverPage.jsx';
import { DriverService } from './DriverService.js';
import Assignments from '../../services/DriverVehicleAssignmentService';

const { navigate, formData } = vi.hoisted(() => ({
  navigate: vi.fn(),
  formData: {
    firstName: 'Mapped',
    lastName: 'Driver',
    mobileNumber: '+919876543210',
    password: 'test-password',
    enterpriseRoleId: 'role1',
    vehicleId: 'v1',
  },
}));
vi.mock('react-router-dom', async (original) => ({
  ...(await original()),
  useNavigate: () => navigate,
}));
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));
vi.mock('../../contexts/BranchContext', () => ({ useActiveBranch: () => ({ branchId: null }) }));
vi.mock('../AccessControl/accessControlService', () => ({
  default: { getRolesAndCatalog: async () => ({ roles: [] }) },
}));
vi.mock('./DriverService.js', () => ({
  DriverService: {
    addDriver: vi.fn(),
    updateDriver: vi.fn(),
    getEmployeeDocuments: async () => [],
  },
}));
vi.mock('../../services/DriverVehicleAssignmentService', () => ({
  default: {
    getActiveAssignment: vi.fn(),
    createAssignment: vi.fn(),
    endAssignment: vi.fn(),
    idOf: (value) => value?._id || value || '',
  },
}));
vi.mock('./Component/BasicInformationForm.jsx', () => ({
  default: ({ onSubmit, ref }) => (
    <form
      ref={ref}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(formData);
      }}
    />
  ),
}));
vi.mock('./Component/DocumentUpload.jsx', () => ({ default: () => null }));
vi.mock('./Component/PageHeader.jsx', () => ({ default: () => null }));
vi.mock('./ImportEmployeeDialog.jsx', () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  DriverService.addDriver.mockResolvedValue({ id: 'd1' });
  DriverService.updateDriver.mockResolvedValue({ id: 'd1' });
  Assignments.getActiveAssignment.mockResolvedValue(null);
});

it('keeps assignment failures on screen and retries the saved employee without creating a duplicate', async () => {
  Assignments.createAssignment
    .mockRejectedValueOnce(new Error('Assignment unavailable'))
    .mockResolvedValueOnce({ _id: 'a1' });
  render(
    <MemoryRouter>
      <AddDriverPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.success).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/drivers'));
  expect(DriverService.addDriver).toHaveBeenCalledOnce();
  expect(DriverService.updateDriver).toHaveBeenCalledWith(null, 'd1', expect.anything());
  expect(Assignments.createAssignment).toHaveBeenLastCalledWith(
    expect.objectContaining({ driverId: 'd1', vehicleId: 'v1' }),
  );
});
