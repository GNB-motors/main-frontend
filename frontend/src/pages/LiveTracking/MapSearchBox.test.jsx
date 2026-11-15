import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapSearchBox from './MapSearchBox';

describe('MapSearchBox', () => {
  it('shows the current search text', () => {
    render(<MapSearchBox value="WB11" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('WB11');
  });

  it('reports what the owner typed', () => {
    const onChange = vi.fn();
    render(<MapSearchBox value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'JK' } });
    expect(onChange).toHaveBeenCalledWith('JK');
  });

  it('offers a way to clear the search', () => {
    const onChange = vi.fn();
    render(<MapSearchBox value="JK" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('has no clear button when there is nothing to clear', () => {
    render(<MapSearchBox value="" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('is labelled for screen readers', () => {
    render(<MapSearchBox value="" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: 'Search truck or place' })).toBeInTheDocument();
  });
});
