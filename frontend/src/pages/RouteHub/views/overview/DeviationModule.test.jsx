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

  it('says how many open detours were not measured', () => {
    const { container } = render(
      <DeviationModule
        {...base}
        openDev={[
          { _id: 'a', registrationNumber: 'AS15AC6474', extraKmEstimate: 3.4, estimatedExtraCostInr: 500 },
          { _id: 'b', registrationNumber: 'WB11S1962', extraKmEstimate: null, estimatedExtraCostInr: null },
          { _id: 'c', registrationNumber: 'WB11S1963', extraKmEstimate: null, estimatedExtraCostInr: null },
        ]}
      />,
    );

    expect(screen.getByText('+3.4')).toBeInTheDocument();
    expect(container.textContent).toContain('2 of 3 detours not measured');
  });

  it('never shows a rupee or a kilometre for detours nobody measured', () => {
    const { container } = render(
      <DeviationModule
        {...base}
        openDev={[
          { _id: 'a', registrationNumber: 'AS15AC6474', extraKmEstimate: null, estimatedExtraCostInr: null },
          { _id: 'b', registrationNumber: 'WB11S1962', extraKmEstimate: null, estimatedExtraCostInr: null },
        ]}
      />,
    );

    expect(container.textContent).not.toContain('₹0');
    expect(container.textContent).not.toContain('+0.0');
    expect(screen.getByText('detour cost not estimated')).toBeInTheDocument();
    expect(screen.getByText('extra km not estimated')).toBeInTheDocument();
  });

  it('keeps a measured zero a zero', () => {
    const { container } = render(
      <DeviationModule
        {...base}
        openDev={[
          { _id: 'a', registrationNumber: 'AS15AC6474', extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 },
        ]}
      />,
    );

    expect(container.textContent).toContain('+0.0');
    expect(container.textContent).toContain('₹0');
  });
});
