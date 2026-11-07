import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AssignedVehicleField from './AssignedVehicleField';
import { ReassignVehicleModal } from './DriverConfirmModals';
import * as vehicleService from '../../../services/vehicleListService';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';

vi.mock('../../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(),
}));

vi.mock('../../../services/DriverVehicleAssignmentService', () => ({
  default: {
    getAllActiveAssignments: vi.fn(),
    idOf: (ref) => (ref && typeof ref === 'object' ? ref._id : ref) || '',
  },
}));

describe('AssignedVehicleField and ReassignVehicleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('renders vehicles and flags when a vehicle is assigned to another driver', async () => {
    vehicleService.getVehicleList.mockResolvedValue([
      { _id: 'veh-1', registrationNumber: 'BR44GB1162', model: '5555' },
      { _id: 'veh-2', registrationNumber: 'WB11N9162', model: '' },
    ]);

    DriverVehicleAssignmentService.getAllActiveAssignments.mockResolvedValue([
      {
        _id: 'assign-1',
        vehicleId: { _id: 'veh-1', registrationNumber: 'BR44GB1162' },
        driverId: {
          _id: 'driver-99',
          firstName: 'Ramesh',
          lastName: 'Kumar',
          mobileNumber: '9876543210',
        },
        startDate: '2026-10-31T00:00:00.000Z',
      },
    ]);

    render(<AssignedVehicleField value="veh-1" onChange={vi.fn()} currentDriverId="driver-1" />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Assigned Vehicle' })).toHaveTextContent(
        /BR44GB1162 - 5555 \(Assigned to Ramesh Kumar\)/,
      );
    });

    expect(screen.getByText(/Currently assigned to/)).toBeInTheDocument();
    expect(screen.getAllByText(/Ramesh Kumar/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Saving will prompt for handover/)).toBeInTheDocument();
  });

  it('marks vehicle as (Current driver) when held by currentDriverId and does not show warning', async () => {
    vehicleService.getVehicleList.mockResolvedValue([
      { _id: 'veh-1', registrationNumber: 'BR44GB1162', model: '5555' },
    ]);

    DriverVehicleAssignmentService.getAllActiveAssignments.mockResolvedValue([
      {
        _id: 'assign-1',
        vehicleId: { _id: 'veh-1', registrationNumber: 'BR44GB1162' },
        driverId: { _id: 'driver-1', firstName: 'Alice', lastName: 'Smith' },
        startDate: '2026-10-31T00:00:00.000Z',
      },
    ]);

    render(<AssignedVehicleField value="veh-1" onChange={vi.fn()} currentDriverId="driver-1" />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Assigned Vehicle' })).toHaveTextContent(
        /Current driver/,
      );
    });

    expect(screen.queryByText(/Currently assigned to/)).not.toBeInTheDocument();
  });

  it('searches vehicles and submits the selected vehicle id', async () => {
    vehicleService.getVehicleList.mockResolvedValue([
      { _id: 'veh-1', registrationNumber: 'BR44GB1162', model: '5555' },
      { _id: 'veh-2', registrationNumber: 'WB11N9162', model: '' },
    ]);
    DriverVehicleAssignmentService.getAllActiveAssignments.mockResolvedValue([]);
    const onChange = vi.fn();
    render(<AssignedVehicleField value="" onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Assigned Vehicle' });
    await waitFor(() => expect(trigger).not.toBeDisabled());
    fireEvent.click(trigger);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Search options' }), {
      target: { value: 'WB11' },
    });
    expect(screen.queryByRole('option', { name: /BR44/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /WB11N9162/ }));
    expect(onChange).toHaveBeenCalledWith('veh-2');
  });

  it('ReassignVehicleModal displays conflict details and handles confirm and close actions', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    const conflict = {
      conflictingAssignmentId: 'assign-1',
      vehicleLabel: 'BR44GB1162 - 5555',
      currentDriverName: 'Ramesh Kumar',
      currentDriverPhone: '9876543210',
      startDate: '2026-10-31T00:00:00.000Z',
    };

    render(
      <ReassignVehicleModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        conflict={conflict}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Vehicle Already Assigned')).toBeInTheDocument();
    expect(screen.getByText('BR44GB1162 - 5555')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Kumar')).toBeInTheDocument();
    expect(screen.getByText(/9876543210/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('End Previous & Reassign'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
