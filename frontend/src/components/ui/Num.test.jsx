import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Num from './Num';

describe('Num', () => {
  it('renders a measured zero as zero', () => {
    render(<Num value={0} unit="L" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders an unknown value as a dash, never as zero', () => {
    render(<Num value={null} unit="L" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the reason beside the dash', () => {
    render(<Num value={undefined} reason="not measured yet" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('not measured yet')).toBeInTheDocument();
  });

  it('keeps a NaN value unknown', () => {
    render(<Num value={Number.NaN} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats rupees and units for a known value', () => {
    render(<Num value={1500} format="inr" unit="total" />);
    expect(screen.getByText('₹1,500')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
  });
});
