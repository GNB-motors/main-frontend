import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NdRefuelCard from './NdRefuelCard';

describe('NdRefuelCard', () => {
  // The page resolves a vehicle id only against the 14-day calendar; a fill for a
  // truck with nothing scheduled opened the drawer with the raw id as its plate.
  it('opens the vehicle by its plate', () => {
    const onOpenVehicle = vi.fn();
    render(
      <NdRefuelCard
        data={{
          totalCount: 1,
          fills: [
            {
              vehicleId: '66f0c0ffee0000000000abcd',
              registrationNumber: 'WB01AB1234',
              litres: 120,
              station: 'IOCL Dankuni',
            },
          ],
        }}
        onOpenVehicle={onOpenVehicle}
      />,
    );
    fireEvent.click(screen.getByText('WB01AB1234'));
    expect(onOpenVehicle).toHaveBeenCalledWith('WB01AB1234');
  });
});
