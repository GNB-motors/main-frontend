import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManufacturerFilter from './ManufacturerFilter';
import { getManufacturerCatalog } from '../../services/manufacturerService';
vi.mock('../../services/manufacturerService', () => ({ getManufacturerCatalog: vi.fn() }));

describe('ManufacturerFilter', () => {
  it('preserves an active scope on failure and loads only backend choices on retry', async () => {
    getManufacturerCatalog.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([
      { value: 'TATA', label: 'Tata' },
      { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
    ]);
    const change = vi.fn();
    render(<ManufacturerFilter value="TATA" onChange={change} />);
    await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getByRole('combobox', { name: 'Manufacturer' }).value).toBe('TATA');
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ashok Leyland' })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Manufacturer' }), {
      target: { value: 'ASHOK LEYLAND' },
    });
    expect(change).toHaveBeenCalledWith('ASHOK LEYLAND');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All manufacturers',
      'Tata',
      'Ashok Leyland',
    ]);
  });
});
