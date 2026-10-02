import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import RefuelLogsPage from './RefuelLogsPage';
import apiClient from '../../utils/axiosConfig';

vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../Profile/VehicleService.jsx', () => ({
  VehicleService: {
    getAllVehicles: vi.fn().mockResolvedValue({
      data: [{ _id: 'veh1', registrationNumber: 'WB25V8040' }],
    }),
  },
}));

describe('RefuelLogsPage', () => {
  const mockFeedResponse = {
    data: {
      status: 'success',
      data: [
        {
          id: 'log_1',
          source: 'SLIP',
          verificationStatus: 'VERIFIED',
          vehicleNumber: 'WB25V8040',
          vehicleModel: 'Tata Prima',
          at: '2026-10-01T10:00:00.000Z',
          litres: 120,
          slip: {
            id: 'log_1',
            totalAmount: 11400,
            rate: 95,
            location: 'IOCL Dankuni',
            fuelType: 'DIESEL',
          },
          sensor: {
            id: 'sensor_1',
            litres: 118,
            billVarianceL: 2,
          },
        },
        {
          id: 'fill_2',
          source: 'SENSOR',
          verificationStatus: 'UNVERIFIED',
          vehicleNumber: 'NL01A1111',
          vehicleModel: 'BharatBenz 3528',
          at: '2026-10-02T08:30:00.000Z',
          litres: 80,
          slip: null,
          sensor: {
            id: 'sensor_2',
            litres: 80,
            fuelPumpName: 'Expressway Bunk',
            confirmationStatus: 'ESTIMATED',
          },
        },
      ],
      meta: {
        total: 2,
        verified: 1,
        unverified: 1,
        slipOnly: 0,
        flagged: 0,
        totalSpendInr: 11400,
        totalLitres: 200,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue(mockFeedResponse);
  });

  it('renders modern PageShell, Quick Presets bar, and KPI cards', async () => {
    render(
      <MemoryRouter>
        <RefuelLogsPage />
      </MemoryRouter>,
    );

    // Header title
    expect(screen.getByText('Refuel Logs')).toBeInTheDocument();

    // Quick range presets
    expect(screen.getByText('Quick Range:')).toBeInTheDocument();
    expect(screen.getByText('All Dates')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();

    // Wait for API data to render KPI tiles
    await waitFor(() => {
      expect(screen.getByText('WB25V8040')).toBeInTheDocument();
    });

    // KPI cards & chips
    expect(screen.getAllByText('Verified').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unverified').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Litres')).toBeInTheDocument();
    expect(screen.getByText('Verified Spend')).toBeInTheDocument();
  });

  it('renders unverified refill rows with Pending Bill for Rate and Amount', async () => {
    render(
      <MemoryRouter>
        <RefuelLogsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('NL01A1111')).toBeInTheDocument();
    });

    // Verified row has formatted price and volume
    expect(screen.getByText('120 L')).toBeInTheDocument();
    expect(screen.getAllByText(/₹11,400/).length).toBeGreaterThanOrEqual(1);

    // Unverified row indicates Pending Bill
    const pendingBillElements = screen.getAllByText('Pending Bill');
    expect(pendingBillElements.length).toBeGreaterThanOrEqual(2);

    // Unverified row has an Upload Bill action button
    expect(screen.getByRole('button', { name: /Upload Bill/i })).toBeInTheDocument();
  });

  it('clicking a Quick Preset updates the date filter and refetches', async () => {
    render(
      <MemoryRouter>
        <RefuelLogsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('WB25V8040')).toBeInTheDocument();
    });

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    // Expect active preset class applied
    expect(todayButton).toHaveClass('active');

    // Expect API was called with date params
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        'api/fuel-logs/unified',
        expect.objectContaining({
          params: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
          }),
        }),
      );
    });
  });

  it('clicking a KPI card switches active filter tab', async () => {
    render(
      <MemoryRouter>
        <RefuelLogsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('WB25V8040')).toBeInTheDocument();
    });

    const unverifiedCard = screen.getByTitle('Filter by Unverified (Needs Slip)');
    fireEvent.click(unverifiedCard);

    // Expect API was called with status unverified
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        'api/fuel-logs/unified',
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'unverified',
          }),
        }),
      );
    });
  });
});
