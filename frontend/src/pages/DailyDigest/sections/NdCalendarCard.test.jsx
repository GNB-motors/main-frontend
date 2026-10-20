import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import NdCalendarCard from './NdCalendarCard';

const swatchOf = (label) => screen.getByText(label).previousElementSibling;

describe('NdCalendarCard legend', () => {
  // The legend must use the colours the bars are drawn in (the .nd-ev--* gradients
  // in novaDesignSystem.css); "Service" used to be blue while its bars are amber.
  it('matches each legend swatch to its bar colour', () => {
    render(<NdCalendarCard vehicles={[]} onOpenVehicle={() => {}} />);
    expect(swatchOf('Planned trip')).toHaveStyle({ background: '#2563eb' });
    expect(swatchOf('Service due/overdue')).toHaveStyle({ background: '#d97706' });
    expect(swatchOf('Document expiry')).toHaveStyle({ background: '#dc2626' });
  });
});
