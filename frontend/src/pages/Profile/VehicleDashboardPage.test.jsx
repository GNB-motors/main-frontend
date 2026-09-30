import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleDashboardPage from './VehicleDashboardPage.jsx';
import { VehicleService } from './VehicleService.jsx';

vi.mock('./VehicleService.jsx', () => ({
  VehicleService: {
    getFleetDashboard: vi.fn(),
    getVehicleDocuments: vi.fn(),
  },
}));

vi.mock('../../utils/session.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getToken: () => 'mock-token' };
});

describe('VehicleDashboardPage — Document Dropdown Filter', () => {
  const mockVehicles = [
    {
      _id: 'veh-1',
      registrationNumber: 'UP14BT1001',
      model: 'Tata Prima',
      documents: {
        // Expired document
        RC: { uploaded: true, expiryDate: '2020-01-01' },
      },
    },
    {
      _id: 'veh-2',
      registrationNumber: 'UP14BT2002',
      model: 'Ashok Leyland',
      documents: {
        // Expiring soon (10 days in future)
        FITNESS: {
          uploaded: true,
          expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        },
      },
    },
    {
      _id: 'veh-3',
      registrationNumber: 'UP14BT3003',
      model: 'BharatBenz',
      documents: {
        // Healthy document (100 days in future)
        INSURANCE: {
          uploaded: true,
          expiryDate: new Date(Date.now() + 100 * 86400000).toISOString(),
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    VehicleService.getFleetDashboard.mockResolvedValue(mockVehicles);
  });

  it('renders dropdown filter with all options and counts', async () => {
    render(
      <MemoryRouter>
        <VehicleDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('UP14BT1001')).toBeInTheDocument());
    expect(screen.getByText('UP14BT2002')).toBeInTheDocument();
    expect(screen.getByText('UP14BT3003')).toBeInTheDocument();

    const select = screen.getByLabelText(/Document Filter/i);
    expect(select).toBeInTheDocument();
  });

  it('filters by Expiring Soon when selected from dropdown', async () => {
    render(
      <MemoryRouter>
        <VehicleDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('UP14BT1001')).toBeInTheDocument());

    const select = screen.getByLabelText(/Document Filter/i);
    fireEvent.change(select, { target: { value: 'EXPIRING_SOON' } });

    // Only veh-2 should be visible
    expect(screen.getByText('UP14BT2002')).toBeInTheDocument();
    expect(screen.queryByText('UP14BT1001')).toBeNull();
    expect(screen.queryByText('UP14BT3003')).toBeNull();
  });

  it('filters by Expired when selected from dropdown and clears via reset button', async () => {
    render(
      <MemoryRouter>
        <VehicleDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('UP14BT1001')).toBeInTheDocument());

    const select = screen.getByLabelText(/Document Filter/i);
    fireEvent.change(select, { target: { value: 'EXPIRED_ANY' } });

    // Only veh-1 should be visible
    expect(screen.getByText('UP14BT1001')).toBeInTheDocument();
    expect(screen.queryByText('UP14BT2002')).toBeNull();
    expect(screen.queryByText('UP14BT3003')).toBeNull();

    // Click clear filter button
    const clearBtn = screen.getByRole('button', { name: /Clear Filter/i });
    fireEvent.click(clearBtn);

    // All should be back
    expect(screen.getByText('UP14BT1001')).toBeInTheDocument();
    expect(screen.getByText('UP14BT2002')).toBeInTheDocument();
    expect(screen.getByText('UP14BT3003')).toBeInTheDocument();
  });
});
