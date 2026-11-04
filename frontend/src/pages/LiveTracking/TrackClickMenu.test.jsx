import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackClickMenu from './TrackClickMenu';

const click = { lat: 22.5937, lng: 78.9629, placeId: null, x: 120, y: 240 };

describe('TrackClickMenu', () => {
  it('offers what a click on the map can start', () => {
    render(<TrackClickMenu click={click} canEdit onChoose={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('menu', { name: 'What to do here' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Make this a place' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Alert zone here' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Open in Google Maps' })).toBeInTheDocument();
  });

  it('does not offer making a place to the people who may not make one', () => {
    render(<TrackClickMenu click={click} canEdit={false} onChoose={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('menuitem', { name: 'Make this a place' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Alert zone here' })).toBeInTheDocument();
  });

  it('says which choice was made', () => {
    const onChoose = vi.fn();
    render(<TrackClickMenu click={click} canEdit onChoose={onChoose} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Make this a place' }));
    expect(onChoose).toHaveBeenCalledWith('makePlace');
  });

  it('is nothing until the map is clicked', () => {
    render(<TrackClickMenu click={null} canEdit onChoose={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
