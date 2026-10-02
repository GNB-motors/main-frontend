import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { encodePolyline6 } from '../../lib/polyline6';
import { toLayers } from '../../lib/roadTrail';
import { leafletStyle, addRoadLayers } from '../../lib/roadTrailLeaflet';
import RoadTrailLayer from './RoadTrailLayer';
import { polylineOptions } from '../../lib/roadTrailGoogle';
import RoadTrailLegend from './RoadTrailLegend';

vi.mock('@react-google-maps/api', () => ({
  PolylineF: ({ path, options }) => (
    <div data-testid="poly" data-n={path.length} data-dashed={options.icons ? 'yes' : 'no'} />
  ),
}));

const T0 = Date.UTC(2026, 9, 1, 0, 30);
const trail = {
  mode: 'MATCHED',
  calibrated: false,
  segments: [
    {
      kind: 'UNCALIBRATED',
      t0: T0,
      t1: T0 + 60e3,
      geom: encodePolyline6([
        { lat: 22, lng: 88 },
        { lat: 22.01, lng: 88 },
      ]),
    },
    {
      kind: 'FLEET_CONFIRMED',
      t0: T0 + 60e3,
      t1: T0 + 120e3,
      geom: encodePolyline6([
        { lat: 22.01, lng: 88 },
        { lat: 22.02, lng: 88 },
      ]),
    },
    { kind: 'UNKNOWN_GAP', t0: T0 + 120e3, t1: T0 + 600e3 },
  ],
};

describe('RoadTrailLayer / legend / Leaflet (plan P4.9)', () => {
  it('draws one polyline per drawable segment; dashed via icons, solid without', () => {
    render(<RoadTrailLayer trail={trail} />);
    const polys = screen.getAllByTestId('poly');
    expect(polys).toHaveLength(2);
    expect(polys.map((p) => p.dataset.dashed)).toEqual(['yes', 'no']);
  });

  it('fleet roads use their own colour', () => {
    const [, fleet] = toLayers(trail);
    expect(polylineOptions(fleet, { fleetColor: '#7c3aed' }).strokeColor).toBe('#7c3aed');
  });

  it('legend shows the kinds present, the certification note and the OSM attribution', () => {
    render(
      <RoadTrailLegend
        layers={toLayers(trail)}
        calibrated={false}
        summary={{ km: 2.2, label: 'on roads' }}
      />,
    );
    expect(screen.getByTestId('road-distance')).toHaveTextContent('2.2 km on roads');
    expect(screen.getByText('Road (accuracy not yet certified)')).toBeInTheDocument();
    expect(screen.getByText(/not yet certified for this fleet/)).toBeInTheDocument();
    expect(screen.getByText('OpenStreetMap contributors')).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
  });

  it('Leaflet styles and drawing', () => {
    const layers = toLayers(trail);
    expect(leafletStyle(layers[0]).dashArray).toBe('8 8');
    const added = [];
    const L = { polyline: (pts, style) => ({ addTo: () => added.push({ pts, style }) }) };
    addRoadLayers(L, {}, layers);
    expect(added).toHaveLength(2);
    expect(added[1].pts[0]).toEqual([22.01, 88]);
  });
});
