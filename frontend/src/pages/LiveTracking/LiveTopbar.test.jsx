import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import LiveTopbar from './LiveTopbar.jsx';

afterEach(cleanup);
const cards = [{ k: 'all', label: 'All', count: 4, stripe: '#111' }];
function Toolbar(props) {
  const [selected, setSelected] = useState([]);
  return (
    <LiveTopbar
      statusCards={cards}
      filter="all"
      setFilter={() => {}}
      manufacturers={['Tata', 'Ashok Leyland', 'Volvo']}
      selectedManufacturers={selected}
      setSelectedManufacturers={setSelected}
      {...props}
    />
  );
}
describe('tracking toolbar', () => {
  it('switches views and shows only the relevant controls', () => {
    const changeView = vi.fn();
    const { rerender } = render(<Toolbar onViewChange={changeView} />);
    expect(screen.getByRole('button', { name: 'Live tracking' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Places & routes' }));
    expect(changeView).toHaveBeenCalledWith('places');
    rerender(<Toolbar view="places" onViewChange={changeView} />);
    expect(screen.getByRole('button', { name: 'Places & routes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('group', { name: 'Fleet status filters' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Manufacturer filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Place Hub/ })).toHaveAttribute(
      'href',
      '/place-hub',
    );
  });
  it('keeps replay protected until the user exits Track mode', () => {
    const changeView = vi.fn();
    render(<Toolbar onViewChange={changeView} viewSwitchDisabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Places & routes' }));
    expect(changeView).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Places & routes' })).toBeDisabled();
  });
  it('supports multiple makes and returning to all', () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByRole('button', { name: /Volvo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tata/ }));
    expect(screen.getByRole('button', { name: /Volvo/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Tata/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /All makes/ }));
    expect(screen.getByRole('button', { name: /Volvo/ })).toHaveAttribute('aria-pressed', 'false');
  });
  it('omits clock, feed age and refresh controls while retaining update errors', () => {
    render(<Toolbar positionsError={new Error('failed')} />);
    expect(screen.queryByText(/Feed message/)).not.toBeInTheDocument();
    expect(screen.queryByText(/IST/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh positions' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Update failed');
  });
});
