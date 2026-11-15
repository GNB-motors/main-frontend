import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VehicleSearchSelect from './VehicleSearchSelect.jsx';

const mockVehicles = [
  { _id: '1', registrationNumber: 'AS15AC6474', model: '4925.T', manufacturer: 'ASHOK LEYLAND' },
  { _id: '2', registrationNumber: 'WB11S1962', model: '2820', manufacturer: 'ASHOK LEYLAND' },
  { _id: '3', registrationNumber: 'NL01AH9999', model: 'Prima 5530.S', manufacturer: 'TATA' },
];

describe('VehicleSearchSelect', () => {
  it('renders currently selected vehicle plate and model', () => {
    render(<VehicleSearchSelect vehicles={mockVehicles} value="AS15AC6474" onChange={vi.fn()} />);

    expect(screen.getByText('AS15AC6474')).toBeInTheDocument();
    expect(screen.getByText('· 4925.T')).toBeInTheDocument();
  });

  it('opens search dropdown when clicked and filters vehicles by search query', () => {
    const handleChange = vi.fn();
    render(
      <VehicleSearchSelect vehicles={mockVehicles} value="AS15AC6474" onChange={handleChange} />,
    );

    // Open dropdown
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    // Search input should appear
    const searchInput = screen.getByPlaceholderText(/search vehicle/i);
    expect(searchInput).toBeInTheDocument();

    // All vehicles shown initially
    expect(screen.getByText('3 vehicles')).toBeInTheDocument();

    // Type search query to find WB11
    fireEvent.change(searchInput, { target: { value: 'WB11' } });

    expect(screen.getByText(/1 vehicle matching "WB11"/i)).toBeInTheDocument();
    expect(screen.getByText('WB11S1962')).toBeInTheDocument();
    expect(screen.queryByText('NL01AH9999')).not.toBeInTheDocument();

    // Click to select the filtered vehicle
    fireEvent.click(screen.getByText('WB11S1962'));

    expect(handleChange).toHaveBeenCalledWith(
      'WB11S1962',
      expect.objectContaining({
        registrationNumber: 'WB11S1962',
      }),
    );
  });

  it('shows empty state when no vehicles match the query', () => {
    render(<VehicleSearchSelect vehicles={mockVehicles} value="AS15AC6474" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button'));
    const searchInput = screen.getByPlaceholderText(/search vehicle/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT999' } });

    expect(screen.getByText(/No vehicles matching/i)).toBeInTheDocument();
    expect(screen.getAllByText(/NONEXISTENT999/).length).toBeGreaterThan(0);
  });
});
