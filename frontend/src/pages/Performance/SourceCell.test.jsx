import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SourceCell from './SourceCell';
import { cellNumber, isUnknownCell, plainReason } from './performanceCells';

const cell = (overrides) => ({
  value: null,
  unit: null,
  source: 'measured',
  uncertainty: null,
  reason: null,
  ...overrides,
});

describe('SourceCell', () => {
  it('shows a measured value with its unit and no tag', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 3.42, unit: 'km/L' })} decimals={2} />,
    );
    expect(container.querySelector('.psrc-value').textContent).toBe('3.42 km/L');
    expect(container.querySelector('.psrc-tag')).toBeNull();
    expect(container.querySelector('.psrc')).toHaveAttribute('data-source', 'measured');
  });

  it('puts a percent sign on the number', () => {
    const { container } = render(<SourceCell cell={cell({ value: 10.1, unit: '%' })} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('10.1%');
  });

  it('keeps a vendor reading tagged as iALERT, never merged into measured', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 12.5, unit: 'km/L', source: 'vendor' })} />,
    );
    expect(screen.getByText('iALERT')).toBeInTheDocument();
    expect(container.querySelector('.psrc')).toHaveAttribute('data-source', 'vendor');
  });

  it('shows the uncertainty of an estimated reading', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 61, unit: '%', source: 'estimated', uncertainty: 4 })} />,
    );
    expect(container.textContent).toContain('±4');
    expect(screen.getByText('Estimated')).toBeInTheDocument();
  });

  it('says so when an estimate arrives without its uncertainty', () => {
    render(<SourceCell cell={cell({ value: 61, unit: '%', source: 'estimated' })} />);
    expect(screen.getByText('Uncertainty not reported.')).toBeInTheDocument();
  });

  it('never turns a missing reading into a zero, and says why in words', () => {
    const { container } = render(
      <SourceCell
        cell={cell({ value: null, source: 'not_comparable', reason: 'no comparable segment' })}
      />,
    );
    expect(container.querySelector('.psrc-value').textContent).toBe('—');
    expect(container.textContent).not.toContain('0');
    expect(container.textContent).not.toMatch(/not comparable/i);
    expect(screen.getByText('No comparable segment.')).toBeInTheDocument();
  });

  it('turns the cadence gate into a sentence', () => {
    render(
      <SourceCell
        cell={cell({ value: null, source: 'not_comparable', reason: 'cadence P90 63 min > 90 s' })}
      />,
    );
    expect(
      screen.getByText('Readings arrive up to 63 min apart; this needs one at least every 90 s.'),
    ).toBeInTheDocument();
  });

  it('keeps the reason for screen readers only when the table explains it above', () => {
    const { container } = render(
      <SourceCell
        cell={cell({ value: null, source: 'insufficient_data', reason: 'no idle time' })}
        reason="hidden"
      />,
    );
    expect(container.querySelector('.psrc-reason')).toBeNull();
    expect(container.querySelector('.sr-only').textContent).toBe('No idle time.');
  });

  it('explains a missing measured reading instead of showing a number', () => {
    const { container } = render(<SourceCell cell={cell({ value: null })} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('—');
    expect(screen.getByText('No reading for this period.')).toBeInTheDocument();
  });

  it('treats an unknown source as missing', () => {
    const { container } = render(<SourceCell cell={cell({ value: 5, source: 'made-up' })} />);
    expect(container.querySelector('.psrc')).toHaveAttribute('data-source', 'insufficient_data');
    expect(container.textContent).not.toContain('5');
  });

  it('keeps the zeros of a whole number', () => {
    const { container } = render(
      <SourceCell cell={cell({ value: 70, unit: 'score' })} decimals={0} />,
    );
    expect(container.querySelector('.psrc-value').textContent).toBe('70');
  });

  it('keeps a real zero as a zero', () => {
    const { container } = render(<SourceCell cell={cell({ value: 0 })} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('0');
  });

  it('writes rupees before the number and leaves a score without a unit', () => {
    const { container, rerender } = render(
      <SourceCell cell={cell({ value: 420, unit: 'INR' })} decimals={0} />,
    );
    expect(container.querySelector('.psrc-value').textContent).toBe('₹420');
    rerender(<SourceCell cell={cell({ value: 72, unit: 'score' })} decimals={0} />);
    expect(container.querySelector('.psrc-value').textContent).toBe('72');
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

  it('turns feed-gate codes into words', () => {
    expect(
      plainReason(
        cell({ source: 'insufficient_data', reason: 'no learned cadence for this feed yet' }),
      ),
    ).toBe('Not enough readings yet to judge this feed.');
  });
});
