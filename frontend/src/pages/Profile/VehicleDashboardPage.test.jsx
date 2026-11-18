import { changeField } from '@/test/changeField';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleDashboardPage from './VehicleDashboardPage.jsx';
import { VehicleService } from './VehicleService.js';

vi.mock('./VehicleService.js', () => ({
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
  it('opens expiring documents for the Digest week, including the end day and excluding later documents', async () => {
    VehicleService.getFleetDashboard.mockResolvedValue([
      {
        _id: 'inside',
        registrationNumber: 'IN-RANGE',
        documents: { FITNESS: { uploaded: true, expiryDate: '2026-11-11T18:29:59.999Z' } },
      },
      {
        _id: 'outside',
        registrationNumber: 'OUT-OF-RANGE',
        documents: { FITNESS: { uploaded: true, expiryDate: '2026-11-11T18:30:00.000Z' } },
      },
      { _id: 'missing', registrationNumber: 'NO-EXPIRY', documents: {} },
    ]);
    render(
      <MemoryRouter
        initialEntries={[
          '/vehicles/dashboard?docFilter=EXPIRING_SOON&from=2026-11-04&to=2026-11-11',
        ]}
      >
        <VehicleDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('IN-RANGE')).toBeInTheDocument();
    expect(screen.queryByText('OUT-OF-RANGE')).not.toBeInTheDocument();
    expect(screen.queryByText('NO-EXPIRY')).not.toBeInTheDocument();
  });
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
    changeField(select, { target: { value: 'EXPIRING_SOON' } });

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
    fireEvent.click(select);
    fireEvent.click(await screen.findByRole('option', { name: /Any Expired Document/ }));

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
  it('searches the loaded fleet, clears both search and compliance with Show all vehicles, and resets the selected panel', async () => {
    render(
      <MemoryRouter>
        <VehicleDashboardPage />
      </MemoryRouter>,
    );
    await screen.findByText('UP14BT1001');
    fireEvent.click(screen.getByText('UP14BT1001'));
    expect(
      screen.getByRole('complementary', { name: 'Vehicle overview panel' }),
    ).toBeInTheDocument();
    changeField(screen.getByLabelText(/Document Filter/i), { target: { value: 'EXPIRED_ANY' } });
    await waitFor(() => expect(screen.getByText('No vehicle selected')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '2002' } });
    expect(screen.queryByText('UP14BT1001')).not.toBeInTheDocument();
    expect(screen.queryByText('UP14BT2002')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Clear search' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Show all vehicles' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    for (const reg of ['UP14BT1001', 'UP14BT2002', 'UP14BT3003'])
      expect(screen.getByText(reg)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '2002' } });
    expect(screen.getByText('UP14BT2002')).toBeInTheDocument();
    expect(screen.queryByText('UP14BT1001')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('UP14BT1001')).toBeInTheDocument();
    expect(VehicleService.getFleetDashboard).toHaveBeenCalledTimes(1);
  });

  it('shows actual expiry dates and resets document detail even when the selected vehicle still matches the new filter', async () => {
    render(
      <MemoryRouter>
        <VehicleDashboardPage />
      </MemoryRouter>,
    );
    const vehicle = await screen.findByText('UP14BT1001');
    const row = vehicle.closest('tr');
    const expiry = within(row).getByRole('button', { name: /01 Jan 2020/ });
    expect(expiry).not.toHaveTextContent(/days|d left/);
    fireEvent.click(expiry);
    expect(
      screen.getByRole('complementary', { name: 'Document detail panel' }),
    ).toBeInTheDocument();
    changeField(screen.getByLabelText(/Document Filter/i), { target: { value: 'EXPIRED_ANY' } });
    expect(screen.getByText('UP14BT1001')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('complementary', { name: 'Document detail panel' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('No vehicle selected')).toBeInTheDocument();
  });
});
