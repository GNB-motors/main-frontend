import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeviationModule from './DeviationModule.jsx';

const base = {
  go: vi.fn(),
  first: false,
  summary: null,
};

describe('DeviationModule', () => {
  it('says a detour cost is unknown instead of showing ₹0', () => {
    render(<DeviationModule {...base} openDev={[{ _id: 'a', registrationNumber: 'AS15AC6474' }]} />);

    expect(screen.getByText('detour cost not estimated')).toBeInTheDocument();
    expect(screen.getByText('extra km not estimated')).toBeInTheDocument();
    expect(screen.queryByText('₹0')).not.toBeInTheDocument();
  });

  it('shows the estimated cost when the API sent one', () => {
    render(
      <DeviationModule
        {...base}
        summary={{ open: 2, openCostInr: 1200 }}
        openDev={[{ _id: 'a', registrationNumber: 'AS15AC6474' }]}
      />,
    );

    expect(screen.getByText('₹1,200')).toBeInTheDocument();
    expect(screen.getByText('est. detour cost')).toBeInTheDocument();
  });

  it('shows a dash in a row whose cost was never estimated', () => {
    render(
      <DeviationModule
        {...base}
        openDev={[{ _id: 'a', registrationNumber: 'AS15AC6474', offRouteKm: 4.2 }]}
      />,
    );

    expect(screen.getByText('4.2 km off road')).toBeInTheDocument();
    expect(screen.queryByText('₹0')).not.toBeInTheDocument();
  });

  it('sums extra km only when it is known', () => {
    render(
      <DeviationModule
        {...base}
        openDev={[
          { _id: 'a', registrationNumber: 'AS15AC6474', extraKmEstimate: 3.4 },
          { _id: 'b', registrationNumber: 'WB11S1962', extraKmEstimate: 1.2 },
        ]}
      />,
    );

    expect(screen.getByText('+4.6')).toBeInTheDocument();
    expect(screen.getByText('extra km')).toBeInTheDocument();
  });
});
