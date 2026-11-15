import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntelligencePeriodPicker from './IntelligencePeriodPicker';

const period = { preset: '7d', from: '2026-10-27', to: '2026-11-02', label: 'Last 7 days' };

describe('IntelligencePeriodPicker', () => {
  it('marks the period that is on', () => {
    render(
      <IntelligencePeriodPicker period={period} onPreset={vi.fn()} onCustom={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('asks for another preset when one is picked', async () => {
    const onPreset = vi.fn();
    render(<IntelligencePeriodPicker period={period} onPreset={onPreset} onCustom={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Last 30 days' }));

    expect(onPreset).toHaveBeenCalledWith('30d');
  });

  it('opens the two dates only when Custom is asked for', async () => {
    render(<IntelligencePeriodPicker period={period} onPreset={vi.fn()} onCustom={vi.fn()} />);

    expect(screen.queryByLabelText('Period from date')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Custom/ }));

    expect(screen.getByLabelText('Period from date')).toBeInTheDocument();
    expect(screen.getByLabelText('Period to date')).toBeInTheDocument();
  });

  it('writes a complete range to the URL', async () => {
    const onCustom = vi.fn();
    render(<IntelligencePeriodPicker period={period} onPreset={vi.fn()} onCustom={onCustom} />);

    fireEvent.click(screen.getByRole('button', { name: /Custom/ }));
    fireEvent.change(screen.getByLabelText('Period from date'), { target: { value: '2026-10-20' } });

    expect(onCustom).toHaveBeenCalledWith({ from: '2026-10-20', to: '2026-11-02' });
  });

  it('does not write half a date to the URL', async () => {
    const onCustom = vi.fn();
    render(<IntelligencePeriodPicker period={period} onPreset={vi.fn()} onCustom={onCustom} />);

    fireEvent.click(screen.getByRole('button', { name: /Custom/ }));
    fireEvent.change(screen.getByLabelText('Period from date'), { target: { value: '' } });

    expect(onCustom).not.toHaveBeenCalled();
  });
});
