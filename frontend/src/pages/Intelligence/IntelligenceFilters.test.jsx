import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/services/vehicleListService', () => ({ getVehicleList: vi.fn() }));
vi.mock('@/services/DriverVehicleAssignmentService', () => ({
  default: { getAllActiveAssignments: vi.fn() },
}));

import { getVehicleList } from '@/services/vehicleListService';
import DriverVehicleAssignmentService from '@/services/DriverVehicleAssignmentService';
import IntelligenceFilters from './IntelligenceFilters';

describe('IntelligenceFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicleList.mockResolvedValue([{ registrationNumber: 'WB11L8862' }]);
    DriverVehicleAssignmentService.getAllActiveAssignments.mockResolvedValue([
      { driverId: { _id: 'drv-1', firstName: 'Ramesh', lastName: 'Yadav' } },
    ]);
  });

  it('offers every truck and driver of the fleet', async () => {
    render(
      <MemoryRouter>
        <IntelligenceFilters vehicle="" driver="" onChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('combobox', { name: 'Filter by truck' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by driver' })).toBeInTheDocument();
  });

  it('shows a chip for a filter that is on, and takes it off again', async () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <IntelligenceFilters vehicle="WB11L8862" driver="" onChange={onChange} />
      </MemoryRouter>,
    );

    const chip = screen.getByRole('button', { name: 'Remove truck filter WB11L8862' });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledWith({ vehicle: '', driver: '' });
  });

  it('shows no chip when no filter is on', () => {
    render(
      <MemoryRouter>
        <IntelligenceFilters vehicle="" driver="" onChange={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: /Remove truck filter/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove driver filter/ })).not.toBeInTheDocument();
  });
});
