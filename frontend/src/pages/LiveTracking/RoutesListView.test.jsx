import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutesListView from './RoutesListView.jsx';

const routes = { legs: [
  { _id: 'a', title: 'Plant → Warehouse', traversals: 12, stats: { km: { p50: 123 } } },
  { _id: 'b', title: 'Depot → Pump', traversals: 3 },
], isLoading: false, error: null, reload: vi.fn() };

describe('Routes sidebar', () => {
  it('searches routes and opens a selected route', () => {
    const pick = vi.fn();
    render(<RoutesListView routes={routes} query="warehouse" onPick={pick} />);
    expect(screen.queryByText('Depot → Pump')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Plant → Warehouse/ }));
    expect(pick).toHaveBeenCalledWith('a');
    expect(screen.getByText('12 runs · 123 km')).toBeInTheDocument();
  });
  it('shows a retry for failed reads rather than an empty list', () => {
    render(<RoutesListView routes={{ ...routes, error: new Error('offline') }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Could not load routes');
    fireEvent.click(screen.getByRole('button', { name: 'Retry routes' }));
    expect(routes.reload).toHaveBeenCalled();
  });
});
