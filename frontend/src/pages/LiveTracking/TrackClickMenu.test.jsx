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
    expect(screen.queryByRole('menuitem', { name: 'Alert zone here' })).not.toBeInTheDocument();
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

it('fits near the viewport edge and supports keyboard selection', () => {
  const bounds = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width: 220, height: 110 });
  render(
    <TrackClickMenu
      click={{ ...click, x: innerWidth - 2, y: innerHeight - 2 }}
      canEdit
      onChoose={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  const menu = screen.getByRole('menu');
  expect(parseFloat(menu.style.left) + 220).toBeLessThanOrEqual(innerWidth - 8);
  expect(parseFloat(menu.style.top) + 110).toBeLessThanOrEqual(innerHeight - 8);
  const items = screen.getAllByRole('menuitem');
  expect(items[0]).toHaveFocus();
  fireEvent.keyDown(items[0], { key: 'ArrowDown' });
  expect(items[1]).toHaveFocus();
  fireEvent.keyDown(items[1], { key: 'End' });
  expect(items.at(-1)).toHaveFocus();
  fireEvent.keyDown(items.at(-1), { key: 'Home' });
  expect(items[0]).toHaveFocus();
  fireEvent.keyDown(items[0], { key: 'ArrowUp' });
  expect(items.at(-1)).toHaveFocus();
  bounds.mockRestore();
});

it('dismisses on outside pointer and Escape, but keeps inside interaction', () => {
  const close = vi.fn();
  render(<TrackClickMenu click={click} canEdit onChoose={vi.fn()} onClose={close} />);
  fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Make this a place' }));
  expect(close).not.toHaveBeenCalled();
  fireEvent.pointerDown(document.body);
  expect(close).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Make this a place' }), { key: 'Escape' });
  expect(close).toHaveBeenCalledTimes(2);
});

it('hides zone creation when the organization does not have geofences', () => {
  render(
    <TrackClickMenu
      click={click}
      canEdit
      canCreateZone={false}
      onChoose={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(screen.queryByRole('menuitem', { name: 'Alert zone here' })).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Make this a place' })).toBeInTheDocument();
});
