import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PaceCell from './PaceCell';
import { formatPace } from './paceModel';

describe('PaceCell', () => {
  it('writes the pace the way a driver reads it, with its uncertainty', () => {
    expect(formatPace(1.08, 0.04)).toBe('1.08× road pace ± 0.04');
    expect(formatPace(1, null)).toBe('1.00× road pace');
  });

  it('shows an estimated pace with the model that produced it', () => {
    render(
      <PaceCell
        cell={{ value: 1.08, unit: 'factor', source: 'estimated', uncertainty: 0.04, reason: null }}
      />,
    );

    expect(screen.getByText('1.08× road pace ± 0.04')).toBeTruthy();
    expect(screen.getByText('estimated')).toBeTruthy();
  });

  it('never turns an unknown pace into 1.00', () => {
    render(
      <PaceCell
        cell={{
          value: null,
          unit: 'factor',
          source: 'insufficient_data',
          uncertainty: null,
          reason: 'No DNA v2 profile in this window.',
        }}
      />,
    );

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('No DNA v2 profile in this window.')).toBeTruthy();
    expect(screen.queryByText(/1\.00×/)).toBeNull();
  });
});
