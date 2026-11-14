import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NdBriefCard from './NdBriefCard';

describe('partial loss cards', () => {
  it('shows the calculated portion and excluded-data explanation instead of a clean day', () => {
    render(
      <NdBriefCard
        onOpenVehicle={vi.fn()}
        section={{
          key: 'excessIdling',
          label: 'Diesel used while stopped',
          status: 'partial',
          partial: true,
          rupees: 89900,
          coverageNote: 'Some losses are not included: 1 item could not be calculated.',
          unavailableReasons: [{ message: 'Consumption is unavailable.' }],
          vehicles: [],
        }}
      />,
    );
    expect(screen.getByText('₹89,900')).toBeTruthy();
    expect(screen.getByText(/Some losses are not included/)).toBeTruthy();
    expect(screen.queryByText(/Clean today/)).toBeNull();
  });

  it('keeps a wholly unpriced section unavailable instead of showing a clean day or zero', () => {
    render(
      <NdBriefCard
        onOpenVehicle={vi.fn()}
        section={{
          key: 'excessIdling',
          label: 'Diesel used while stopped',
          status: 'unavailable',
          rupees: null,
          why: 'Consumption is unavailable.',
          vehicles: [],
        }}
      />,
    );
    expect(screen.getByText('Cost unavailable')).toBeTruthy();
    expect(screen.getByText('Consumption is unavailable.')).toBeTruthy();
    expect(screen.queryByText(/Clean today/)).toBeNull();
  });
});
