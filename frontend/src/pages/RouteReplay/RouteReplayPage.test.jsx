import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RouteReplayPage from './RouteReplayPage.jsx';
import { LiveTrackingService } from '../LiveTracking/LiveTrackingService.jsx';

// Captured PolylineF props, keyed per render, so tests can assert exactly
// what geometry each overlay drew.
const mocks = vi.hoisted(() => ({ polylines: [], corridors: [] }));

vi.mock('@react-google-maps/api', async () => {
  const React = await import('react');
  return {
    useLoadScript: () => ({ isLoaded: true, loadError: null }),
    GoogleMap: ({ children }) => <div data-testid="map">{children}</div>,
    MarkerF: () => null,
    PolylineF: (props) => {
      mocks.polylines.push(props);
      return <div data-testid="polyline" data-color={props.options.strokeColor} />;
    },
  };
});

vi.mock('../../hooks/useApi', () => ({
  default: (fn) => ({
    data: fn.toString().includes('route-intelligence')
      ? { data: { data: { records: mocks.corridors } } }
      : { data: { data: [{ registrationNumber: 'TRUCK1' }] } },
  }),
}));

vi.mock('../LiveTracking/LiveTrackingService.jsx', () => ({
  LiveTrackingService: { getTrail: vi.fn() },
}));

vi.mock('./truck3d/truck3dMaths.js', () => ({ isWebGLAvailable: () => false }));

const CORRIDOR = {
  originKey: 'Rampurhat',
  destinationKey: 'Illambazar',
  points: [
    { lat: 12, lng: 77 },
    { lat: 12, lng: 77.1 },
    { lat: 12, lng: 77.2 },
  ],
  // 120-minute hour-median everywhere: the 60-minute gap below gets a
  // deliberately negative unexplainedMs.
  medianDurationMinByHour: Array.from({ length: 24 }, () => 120),
};

const row = (lat, lng, iso) => ({ latitude: lat, longitude: lng, eventDateTime: iso });

/** Trail with one corridor-repaired moving gap (60 min, median says 120). */
const gappedTrail = {
  truncated: true,
  totalCount: 100,
  coveredTo: '2026-09-06T11:30:00.000Z',
  points: [
    row(12, 77, '2026-09-06T10:00:00Z'),
    row(12, 77.2, '2026-09-06T11:00:00Z'),
    row(12.009, 77.2, '2026-09-06T11:01:00Z'),
  ],
  // Mixed provenance: a null-island teleport row sits between two snapped
  // fixes. The dashed overlay must draw ONLY the snapped entries.
  snap: {
    snappedCount: 2,
    path: [
      { lat: 12, lng: 77, provenance: 'snapped' },
      { lat: 0, lng: 0, provenance: 'measured' },
      { lat: 12, lng: 77.2, provenance: 'snapped' },
    ],
  },
};

/**
 * Trail that classifies its one big gap as inter-trip: three habitual visits
 * at each endpoint (habitualHalts needs ≥3 stationary runs per cluster).
 */
const intertripTrail = () => {
  const points = [];
  for (const startHour of [0, 2, 4]) {
    for (const m of [0, 10, 20]) {
      points.push(
        row(
          12,
          77,
          `2026-09-06T${String(startHour).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`,
        ),
      );
    }
  }
  for (const startHour of [12, 14, 16]) {
    for (const m of [0, 10, 20]) {
      points.push(
        row(
          13,
          78.5,
          `2026-09-06T${String(startHour).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`,
        ),
      );
    }
  }
  return { truncated: false, points, snap: null };
};

const loadTrail = async (trail) => {
  LiveTrackingService.getTrail.mockResolvedValue(trail);
  render(<RouteReplayPage />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TRUCK1' } });
  fireEvent.click(screen.getByRole('button', { name: /load replay/i }));
  await waitFor(() => expect(LiveTrackingService.getTrail).toHaveBeenCalled());
};

const purplePolylines = () => mocks.polylines.filter((p) => p.options.strokeColor === '#7c3aed');
const playedPolylines = () => mocks.polylines.filter((p) => p.options.strokeColor === '#B8460F');

describe('RouteReplayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.polylines = [];
    mocks.corridors = [];
    // The page's singleton-segment marker and truck icon read the maps
    // SymbolPath enum directly.
    window.google = { maps: { SymbolPath: { CIRCLE: 0, FORWARD_CLOSED_ARROW: 1 } } };
  });

  it('F9: truncation banner counts stored measured points, not spliced frames', async () => {
    mocks.corridors = [CORRIDOR];
    await loadTrail(gappedTrail);
    // 3 stored rows; the spliced frame list has 5 (two corridor points... one
    // interior vertex + 3 measured). The banner must say 3, not 5.
    await waitFor(() =>
      expect(
        screen.getByText(/Showing the oldest 3 of 100 points in this window/),
      ).toBeInTheDocument(),
    );
  });

  it('F10: a negative unexplainedMs renders as "corridor drive time exceeds the gap"', async () => {
    mocks.corridors = [CORRIDOR];
    await loadTrail(gappedTrail);
    await waitFor(() =>
      expect(screen.getByText(/corridor drive time exceeds the gap by 1h 0m/)).toBeInTheDocument(),
    );
  });

  it('F4: the snap overlay draws only snapped entries, never the null-island fix', async () => {
    mocks.corridors = [CORRIDOR];
    await loadTrail(gappedTrail);
    await waitFor(() => expect(purplePolylines().length).toBeGreaterThan(0));
    for (const poly of purplePolylines()) {
      expect(poly.path).toHaveLength(2);
      expect(poly.path.some((p) => p.lat === 0 && p.lng === 0)).toBe(false);
    }
  });

  it('F2: the played overlay is cut at inter-trip breaks — two trips never join', async () => {
    await loadTrail(intertripTrail());
    const scrub = await screen.findByLabelText('Scrub through the replay');
    fireEvent.change(scrub, { target: { value: '0.95' } });
    await waitFor(() => expect(playedPolylines().length).toBeGreaterThanOrEqual(2));
    for (const poly of playedPolylines()) {
      const lats = poly.path.map((p) => p.lat);
      // No played segment may span the break between the depot (12) and the
      // destination (13) — that would draw a line between two real trips.
      expect(lats.includes(12) && lats.includes(13)).toBe(false);
    }
  });
});
