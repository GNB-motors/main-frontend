import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { buildVehicleDashboardColumns } from './vehicleDashboardColumns';
import { DOC_COLS } from './vehicleDashboardLogic';

describe('buildVehicleDashboardColumns', () => {
  const dummyRow = {
    _id: 'veh-1',
    registrationNumber: 'WB25R9540',
    manufacturer: 'TATA',
    model: '4928.S',
    chassisNumber: 'MAT12345',
    ownerName: 'ADITYA SHARMA',
    documents: {
      RC: { uploaded: true, expiryDate: '2030-01-01' },
      INSURANCE: { uploaded: false },
    },
  };

  it('builds columns with correct keys including DOC_COLS matching WheelsEye layout', () => {
    const cols = buildVehicleDashboardColumns({
      onSelectVehicle: vi.fn(),
      onSelectDoc: vi.fn(),
    });

    const colKeys = cols.map((c) => c.key);
    expect(colKeys).toContain('vehicle');
    DOC_COLS.forEach(({ key }) => {
      expect(colKeys).toContain(key);
    });
    expect(cols.length).toBe(1 + DOC_COLS.length);
  });

  it('invokes onSelectVehicle when clicking the vehicle number cell', () => {
    const onSelectVehicle = vi.fn();
    const cols = buildVehicleDashboardColumns({
      onSelectVehicle,
      onSelectDoc: vi.fn(),
    });

    const vehicleCol = cols.find((c) => c.key === 'vehicle');
    render(<div>{vehicleCol.render(dummyRow)}</div>);

    const vehicleCell = screen.getByText('WB25R9540');
    fireEvent.click(vehicleCell);
    expect(onSelectVehicle).toHaveBeenCalledWith(dummyRow);
  });

  it('invokes onSelectDoc when clicking a document badge cell', () => {
    const onSelectDoc = vi.fn();
    const cols = buildVehicleDashboardColumns({
      onSelectVehicle: vi.fn(),
      onSelectDoc,
    });

    const rcCol = cols.find((c) => c.key === 'RC');
    render(<div>{rcCol.render(dummyRow)}</div>);

    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    expect(onSelectDoc).toHaveBeenCalledWith(dummyRow, 'RC', dummyRow.documents.RC);
  });
});
