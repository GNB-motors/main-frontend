import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import IalertOnlyPanel from './IalertOnlyPanel.jsx';

vi.mock('../IalertFleet/ialertFleetApi.js', () => ({
  addIalertVehicleToFleet: vi.fn(),
}));

describe('IalertOnlyPanel', () => {
  const mockOnlyIalert = [
    {
      registrationNumber: 'KA01AB1234',
      vin: 'MA123456789012345',
      isBs6: true,
      vehicleType: 'Truck',
      ialertAccountId: 'acc-1',
      firstSeenAt: '2024-01-01T00:00:00Z',
      lastSeenAt: '2024-06-01T00:00:00Z',
    },
    {
      registrationNumber: 'MH02CD5678',
      vin: 'MA987654321098765',
      isBs6: false,
      vehicleType: 'Bus',
      ialertAccountId: 'acc-1',
      firstSeenAt: '2024-02-01T00:00:00Z',
      lastSeenAt: '2024-06-15T00:00:00Z',
    },
  ];

  const mockStaleIalert = [
    {
      registrationNumber: 'DL03EF9012',
      vin: 'MA111222333444555',
      isBs6: true,
      vehicleType: 'Truck',
      ialertAccountId: 'acc-2',
      firstSeenAt: '2023-06-01T00:00:00Z',
      lastSeenAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('renders nothing when no iALERT vehicles exist', () => {
    const { container } = render(
      <IalertOnlyPanel q="" searching={false} onlyIalert={[]} staleIalert={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders rows and empty state when onlyIalert has data', () => {
    render(<IalertOnlyPanel q="" searching={false} onlyIalert={mockOnlyIalert} staleIalert={[]} />);

    expect(screen.getByText('Only in iALERT')).toBeInTheDocument();
    expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
    expect(screen.getByText('MH02CD5678')).toBeInTheDocument();
  });

  it('renders stale vehicles when present', () => {
    render(
      <IalertOnlyPanel q="" searching={false} onlyIalert={[]} staleIalert={mockStaleIalert} />,
    );

    expect(screen.getByText('Stale iALERT Vehicles')).toBeInTheDocument();
    expect(screen.getByText('DL03EF9012')).toBeInTheDocument();
  });

  it('shows search empty state when searching and no results', () => {
    render(<IalertOnlyPanel q="nonexistent" searching={true} onlyIalert={[]} staleIalert={[]} />);

    expect(screen.queryByText('Only in iALERT')).not.toBeInTheDocument();
  });

  it('shows BS-VI badge for BS-VI vehicles', () => {
    render(<IalertOnlyPanel q="" searching={false} onlyIalert={mockOnlyIalert} staleIalert={[]} />);

    // Exactly the one isBs6:true vehicle gets a check (the column renderer receives the ROW,
    // so a value-style renderer would tick every row).
    expect(screen.getAllByText('✓')).toHaveLength(
      mockOnlyIalert.filter((v) => v.isBs6 === true).length,
    );
    expect(mockOnlyIalert.filter((v) => v.isBs6 === true)).toHaveLength(1);
  });

  it('shows an Add to fleet button per row when the user can add vehicles', () => {
    render(
      <IalertOnlyPanel
        q=""
        searching={false}
        onlyIalert={mockOnlyIalert}
        staleIalert={[]}
        canAddVehicles
      />,
    );

    expect(screen.getAllByText('Add to fleet')).toHaveLength(mockOnlyIalert.length);
  });

  it('shows no action column when the user cannot add vehicles', () => {
    render(<IalertOnlyPanel q="" searching={false} onlyIalert={mockOnlyIalert} staleIalert={[]} />);

    expect(screen.queryByText('Add to fleet')).not.toBeInTheDocument();
  });

  it('blocks placeholder plates (NA / TEMP) from being added', () => {
    const rows = [
      { registrationNumber: 'NA', vin: 'MA000000000000001', ialertAccountId: 'acc-1' },
      { registrationNumber: 'TEMP-12', vin: 'MA000000000000002', ialertAccountId: 'acc-1' },
      { registrationNumber: 'KA05EF1111', vin: 'MA000000000000003', ialertAccountId: 'acc-1' },
    ];
    render(
      <IalertOnlyPanel q="" searching={false} onlyIalert={rows} staleIalert={[]} canAddVehicles />,
    );

    // Only the real plate is addable; the placeholders explain why they are not.
    expect(screen.getAllByText('Add to fleet')).toHaveLength(1);
    expect(screen.getAllByText('Needs a registration in iALERT')).toHaveLength(2);
  });
});
