import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useVehicleColumns } from './useVehicleColumns.jsx';
import { normalizeVehicle, buildAccountMap } from './vehicleList.js';
import { indexLinkHealth } from '../../lib/fleetLink';

function ColumnCell({ columnKey, vehicle, accountMap = {}, linkIndex = null }) {
  const column = useVehicleColumns({ accountMap, linkIndex }).find((item) => item.key === columnKey);
  return column.render(normalizeVehicle(vehicle));
}

function MileageCell({ vehicle }) {
  return <ColumnCell columnKey="avgMileage" vehicle={vehicle} />;
}

describe('vehicle average mileage cell', () => {
  it('shows the actual km/L and links to Mileage Hub', () => {
    render(
      <MemoryRouter>
        <MileageCell
          vehicle={{ registrationNumber: 'WB01', kmPerLitre: { kmPerL: 4.26, published: true } }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: '4.26 km/L' })).toHaveAttribute(
      'href',
      '/mileage?tab=performance&search=WB01',
    );
  });
  it('explains withheld mileage instead of showing an unexplained dash', () => {
    render(
      <MemoryRouter>
        <MileageCell
          vehicle={{
            kmPerLitre: {
              kmPerL: null,
              published: false,
              withheldReason: 'Only one completed cycle.',
            },
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('—')).toHaveAttribute('title', 'Only one completed cycle.');
  });
  it('shows a dash with the reason when there is no mileage rollup yet', () => {
    render(
      <MemoryRouter>
        <MileageCell vehicle={{ kmPerLitre: null }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('—')).toHaveAttribute('title', 'No full-tank rounds yet.');
  });
});

describe('vehicle account cell', () => {
  const accountMap = buildAccountMap([
    {
      _id: 'acc-9',
      friendlyName: 'Hub A',
      source: 'lemu',
      externalAccountId: 'EXT-1',
      status: 'ACTIVE',
    },
  ]);

  it('shows the provider with a green dot and keeps the account id in the title', () => {
    const linkIndex = indexLinkHealth({
      accounts: [{ accountId: 'acc-9', state: 'HEALTHY', vehicles: [] }],
    });
    render(
      <MemoryRouter>
        <ColumnCell
          columnKey="fleetEdgeAccountId"
          vehicle={{ fleetEdgeAccountId: 'acc-9' }}
          accountMap={accountMap}
          linkIndex={linkIndex}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('FleetEdge')).toHaveAttribute('title', 'FleetEdge account EXT-1 · Hub A');
    expect(screen.getByTitle('Connected')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps a reconnect action when the account link is broken', () => {
    const linkIndex = indexLinkHealth({
      accounts: [{ accountId: 'acc-9', state: 'NEEDS_RELINK', reason: 'EXPIRED', vehicles: [] }],
    });
    render(
      <MemoryRouter>
        <ColumnCell
          columnKey="fleetEdgeAccountId"
          vehicle={{ fleetEdgeAccountId: 'acc-9' }}
          accountMap={accountMap}
          linkIndex={linkIndex}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Reconnect/ })).toBeInTheDocument();
    expect(screen.queryByTitle('Connected')).not.toBeInTheDocument();
  });
});

describe('vehicle detail cells', () => {
  it('shows a plain dash when the model or category is missing', () => {
    render(
      <MemoryRouter>
        <ColumnCell columnKey="model" vehicle={{}} />
        <ColumnCell columnKey="vehicleCategory" vehicle={{ vehicleCategory: 'UNKNOWN' }} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });
});
