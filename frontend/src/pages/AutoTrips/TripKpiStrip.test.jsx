import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TripKpiStrip from './TripKpiStrip';

it('never claims no deliveries or nothing waiting when counts are unavailable', () => {
  render(<TripKpiStrip onSelect={() => {}} />);
  expect(screen.getByRole('tab', { name: 'Delivered —' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Needs your answer —' })).toBeInTheDocument();
  expect(screen.queryByText('nothing waiting')).not.toBeInTheDocument();
});
