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
  it('supports multiple makes and returning to all', () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByText('All manufacturers', { selector: 'summary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volvo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tata' }));
    expect(screen.getByRole('button', { name: 'Volvo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tata' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'All manufacturers' }));
    expect(screen.getByRole('button', { name: 'Volvo' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('retains the successful update time on failure and disables duplicate refresh', () => {
    const refresh = vi.fn();
    render(
      <Toolbar
        lastEventAt={new Date()}
        positionsError={new Error('failed')}
        isRefreshing
        handleRefresh={refresh}
      />,
    );
    expect(screen.getByText(/Feed message .* ago/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Update failed');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh positions' }));
    expect(refresh).not.toHaveBeenCalled();
  });
});
