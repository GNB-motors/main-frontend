import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SourceCell from './SourceCell';
import { cellNumber, isUnknownCell } from './performanceCells';

const cell = (overrides) => ({
  value: null,
  unit: null,
  source: 'measured',
  uncertainty: null,
  reason: null,
  ...overrides,
});

describe('SourceCell', () => {
  it('shows a measured value with its unit and the measured badge', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 3.42, unit: 'km/L' })} decimals={2} />,
    );
    expect(container.querySelector('.psrc-value').textContent).toContain('3.42');
    expect(container.querySelector('.psrc-value').textContent).toContain('km/L');
    expect(screen.getByText('measured')).toBeInTheDocument();
    expect(container.querySelector('.psrc')).toHaveAttribute('data-source', 'measured');
  });

  it('keeps a vendor reading as vendor, never merged into measured', () => {
    render(<SourceCell cell={cell({ value: 12.5, unit: 'km/L', source: 'vendor' })} />);
    expect(screen.getByText('vendor')).toBeInTheDocument();
    expect(screen.queryByText('measured')).toBeNull();
  });

  it('shows the uncertainty of an estimated reading', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 61, unit: '%', source: 'estimated', uncertainty: 4 })} />,
    );
    expect(container.textContent).toContain('±4');
    expect(screen.getByText('estimated')).toBeInTheDocument();
  });

  it('says so when an estimate arrives without its uncertainty', () => {
    render(<SourceCell cell={cell({ value: 61, unit: '%', source: 'estimated' })} />);
    expect(screen.getByText('Uncertainty not reported.')).toBeInTheDocument();
  });

  it('never turns a missing reading into a zero', () => {
    const { container } = render(
      <SourceCell
        cell={cell({ value: null, source: 'not_comparable', reason: 'no comparable segment' })}
      />,
    );
    expect(container.querySelector('.psrc-value').textContent).toBe('—');
    expect(container.textContent).not.toContain('0');
    expect(screen.getByText('not comparable')).toBeInTheDocument();
    expect(screen.getByText('no comparable segment')).toBeInTheDocument();
  });

  it('explains a missing measured reading instead of showing a number', () => {
    const { container } = render(<SourceCell cell={cell({ value: null })} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('—');
    expect(screen.getByText('No reading for this period.')).toBeInTheDocument();
  });

  it('treats an unknown source as insufficient data', () => {
    const { container } = render(<SourceCell cell={cell({ value: 5, source: 'made-up' })} />);
    expect(screen.getByText('insufficient data')).toBeInTheDocument();
    expect(container.textContent).not.toContain('5');
  });

  it('keeps a real zero as a zero', () => {
    const { container } = render(<SourceCell cell={cell({ value: 0 })} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('0');
  });
});

describe('performance cell helpers', () => {
  it('keeps a missing reading null, never zero', () => {
    expect(cellNumber(null)).toBeNull();
    expect(cellNumber(cell({ value: null }))).toBeNull();
    expect(cellNumber(cell({ value: null, source: 'insufficient_data' }))).toBeNull();
  });

  it('keeps a real zero', () => {
    expect(cellNumber(cell({ value: 0 }))).toBe(0);
  });

  it('treats a missing value as unknown whatever the source says', () => {
    expect(isUnknownCell(cell({ value: null }))).toBe(true);
    expect(isUnknownCell(cell({ value: 0 }))).toBe(false);
  });
});
