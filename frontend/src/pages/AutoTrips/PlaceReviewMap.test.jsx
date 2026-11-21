import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import PlaceReviewMap from './PlaceReviewMap';

const { events, remove, off } = vi.hoisted(() => ({ events: {}, remove: vi.fn(), off: vi.fn() }));
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView() {
        return this;
      },
      invalidateSize: vi.fn(),
      remove,
    }),
    tileLayer: () => ({
      on(name, handler) {
        events[name] = handler;
        return this;
      },
      once(name, handler) {
        events[name] = handler;
        return this;
      },
      addTo: vi.fn(),
      off,
    }),
    circleMarker: () => ({ addTo: vi.fn() }),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

it('shows the skeleton until map tiles load and cleans up when leaving', () => {
  const { unmount } = render(<PlaceReviewMap point={{ lat: 22.5, lng: 88.2 }} />);
  expect(screen.getByLabelText('Loading stop location map')).toBeInTheDocument();
  act(() => {
    events.tileload();
    events.load();
  });
  expect(screen.queryByLabelText('Loading stop location map')).not.toBeInTheDocument();
  unmount();
  expect(remove).toHaveBeenCalledOnce();
  expect(off).toHaveBeenCalledOnce();
});

it('offers a location link when tiles fail or time out', () => {
  render(<PlaceReviewMap point={{ lat: 22.5, lng: 88.2 }} />);
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByLabelText('Loading stop location map')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open location in Google Maps' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps?q=22.5,88.2',
  );
});
