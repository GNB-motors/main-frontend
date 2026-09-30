import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MaintenanceBasicInformationForm, {
  DEFAULT_SERVICE_TYPES,
  DEFAULT_REPAIR_TYPES,
} from './MaintenanceBasicInformationForm.jsx';

describe('MaintenanceBasicInformationForm', () => {
  const dummyVehicles = [
    { _id: 'veh-1', registrationNumber: 'WB19A1234', model: 'Tata Prima' },
    { _id: 'veh-2', registrationNumber: 'DL01B5678', model: 'Ashok Leyland' },
  ];

  const dummyDrivers = [
    { _id: 'dr-1', name: 'Ramesh Singh', phone: '9876543210' },
    { _id: 'dr-2', name: 'Suresh Kumar', phone: '9123456780' },
  ];

  it('includes Others / Miscellaneous in service and repair types', () => {
    expect(DEFAULT_SERVICE_TYPES).toContain('Others / Miscellaneous');
    expect(DEFAULT_REPAIR_TYPES).toContain('Others / Miscellaneous');
  });

  it('renders driver dropdown and vehicle dropdown cleanly', () => {
    render(
      <MaintenanceBasicInformationForm
        recordType="SERVICE"
        vehicles={dummyVehicles}
        drivers={dummyDrivers}
        initialData={{
          vehicleId: 'veh-1',
          driverId: 'dr-1',
          date: '2026-10-01',
          amount: '4500',
        }}
      />,
    );

    expect(screen.getByText('Service Details')).toBeInTheDocument();
    expect(screen.getByText('Driver (Assigned / Reported by)')).toBeInTheDocument();
    expect(screen.getByText(/Ramesh Singh/)).toBeInTheDocument();
  });

  it('submits custom type when Others / Miscellaneous is selected', () => {
    const handleSubmit = vi.fn();

    render(
      <MaintenanceBasicInformationForm
        recordType="REPAIR"
        vehicles={dummyVehicles}
        drivers={dummyDrivers}
        initialData={{
          vehicleId: 'veh-1',
          driverId: 'dr-2',
          date: '2026-10-01',
          amount: '1200',
          type: 'Others / Miscellaneous',
        }}
        onSubmit={handleSubmit}
      />,
    );

    // Custom type field should appear
    const customInput = screen.getByPlaceholderText(/e\.g\., Side Mirror/i);
    expect(customInput).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: 'Horn Wiring Replacement' } });

    // Submit form
    const form = customInput.closest('form');
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.type).toBe('Horn Wiring Replacement');
    expect(submittedData.driverId).toBe('dr-2');
    expect(submittedData.amount).toBe('1200');
  });
});
