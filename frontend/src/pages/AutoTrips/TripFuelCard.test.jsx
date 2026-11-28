import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import TripFuelCard from './TripFuelCard';

it('uses the same owned fuel as the trip summary, excluding contextual approach', () => {
  render(
    <TripFuelCard
      summary={{ burntL: 90, burntByLeg: { approach: 10, laden: 60, return: 20 } }}
      measurement={{ burnedL: 80, fuelPartial: false }}
    />,
  );
  expect(screen.getByText('80.0 L')).toBeInTheDocument();
  expect(screen.queryByText('90.0 L')).not.toBeInTheDocument();
  expect(screen.queryByText(/Approach/)).not.toBeInTheDocument();
});
