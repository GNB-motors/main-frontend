import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VehicleSearchBar from './VehicleSearchBar.jsx';

const mockVehicles = [
  { _id: '1', registrationNumber: 'AS15AC6474', model: '4925.T', manufacturer: 'ASHOK LEYLAND' },
  { _id: '2', registrationNumber: 'WB11S1962', model: '2820', manufacturer: 'ASHOK LEYLAND' },
  { _id: '3', registrationNumber: 'NL01AH9999', model: 'Prima 5530.S', manufacturer: 'TATA' },
];

describe('VehicleSearchBar', () => {
  it('renders search input with placeholder', () => {
    render(
      <VehicleSearchBar vehicles={mockVehicles} selectedReg="AS15AC6474" onSelect={vi.fn()} />,
    );

    expect(screen.getByPlaceholderText(/search vehicle/i)).toBeInTheDocument();
  });

  it('filters vehicles and calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(
      <VehicleSearchBar vehicles={mockVehicles} selectedReg="AS15AC6474" onSelect={handleSelect} />,
    );

    const input = screen.getByPlaceholderText(/search vehicle/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'WB11' } });

    expect(screen.getByText('WB11S1962')).toBeInTheDocument();
    expect(screen.queryByText('NL01AH9999')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('WB11S1962'));

    expect(handleSelect).toHaveBeenCalledWith(
      'WB11S1962',
      expect.objectContaining({
        registrationNumber: 'WB11S1962',
      }),
    );
  });

  it('clears input when clear button is clicked', () => {
    render(
      <VehicleSearchBar vehicles={mockVehicles} selectedReg="AS15AC6474" onSelect={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(/search vehicle/i);
    fireEvent.change(input, { target: { value: 'WB11' } });

    const clearBtn = screen.getByTitle(/clear search/i);
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
  });
});
