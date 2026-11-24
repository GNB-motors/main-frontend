import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import PlaceReviewMap from './PlaceReviewMap';

const { events, remove, off, fitBounds } = vi.hoisted(() => ({
  events: {},
  remove: vi.fn(),
  off: vi.fn(),
  fitBounds: vi.fn(),
}));
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView() {
        return this;
      },
      invalidateSize: vi.fn(),
      fitBounds,
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
    circle: () => ({
      addTo: () => ({
        getBounds: () => [
          [22.49, 88.19],
          [22.51, 88.21],
        ],
      }),
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

it('fits the mapped area when the stop has a recorded radius', () => {
  render(<PlaceReviewMap point={{ lat: 22.5, lng: 88.2, radiusM: 500 }} />);
  expect(fitBounds).toHaveBeenCalledWith(
    [
      [22.49, 88.19],
      [22.51, 88.21],
    ],
    { padding: [20, 20], maxZoom: 16 },
  );
});
