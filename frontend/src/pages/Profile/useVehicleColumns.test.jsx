import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useVehicleColumns } from './useVehicleColumns.jsx';
import { normalizeVehicle } from './vehicleList.js';

function MileageCell({ vehicle }) {
  const column = useVehicleColumns({ accountMap: {} }).find((item) => item.key === 'avgMileage');
  return column.render(normalizeVehicle(vehicle));
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
      <MileageCell
        vehicle={{
          kmPerLitre: {
            kmPerL: null,
            published: false,
            withheldReason: 'Only one completed cycle.',
          },
        }}
      />,
    );
    expect(screen.getByText('Insufficient data')).toHaveAttribute(
      'title',
      'Only one completed cycle.',
    );
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });
  it('distinguishes missing rollup data', () => {
    render(<MileageCell vehicle={{ kmPerLitre: null }} />);
    expect(screen.getByText('Not available')).toHaveAttribute(
      'title',
      'No calculated mileage available yet.',
    );
  });
});
