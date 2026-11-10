import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CircleF, PolygonF } from '@react-google-maps/api';
import PlaceShape from './PlaceShape.jsx';
import { PURPOSE_COLOR } from '../model/placePurpose.js';

vi.mock('@react-google-maps/api', () => ({
  PolygonF: vi.fn(() => null),
  CircleF: vi.fn(() => null),
}));

const ring = (lat, lng) => [
  { lat, lng },
  { lat, lng: lng + 0.1 },
  { lat: lat + 0.1, lng: lng + 0.1 },
];

const place = {
  id: 'site:1',
  type: 'SITE',
  lat: 22.5,
  lng: 88.3,
  radiusM: 300,
  polygon: ring(22.4, 88.2),
};

beforeEach(() => {
  PolygonF.mockClear();
  CircleF.mockClear();
});

describe('PlaceShape', () => {
  it('draws one polygon per part of a multi-part area and no circle', () => {
    render(
      <PlaceShape
        place={{ ...place, polygonParts: [[ring(22.4, 88.2)], [ring(23.4, 89.2)]] }}
        selected={false}
        showCircle
        interactive
        onSelect={() => {}}
      />,
    );
    expect(PolygonF).toHaveBeenCalledTimes(2);
    expect(CircleF).not.toHaveBeenCalled();
    expect(PolygonF.mock.calls[0][0].paths).toEqual([ring(22.4, 88.2)]);
    expect(PolygonF.mock.calls[1][0].paths).toEqual([ring(23.4, 89.2)]);
  });

  it('falls back to the single polygon when there are no parts', () => {
    render(
      <PlaceShape place={place} selected={false} showCircle interactive onSelect={() => {}} />,
    );
    expect(PolygonF).toHaveBeenCalledTimes(1);
    expect(CircleF).not.toHaveBeenCalled();
  });

  it('draws a circle only when there is no area at all', () => {
    render(
      <PlaceShape
        place={{ ...place, polygon: null }}
        selected={false}
        showCircle
        interactive
        onSelect={() => {}}
      />,
    );
    expect(PolygonF).not.toHaveBeenCalled();
    expect(CircleF).toHaveBeenCalledTimes(1);
  });

  it('draws the area in the colour of what the place is for', () => {
    render(
      <PlaceShape
        place={{ ...place, polygonParts: [[ring(22.4, 88.2)]], purpose: 'theft' }}
        selected={false}
        showCircle
        interactive
        onSelect={() => {}}
      />,
    );
    expect(PolygonF).toHaveBeenCalledTimes(1);
    const options = PolygonF.mock.calls[0][0].options;
    expect(options.fillColor).toBe(PURPOSE_COLOR.theft);
    expect(options.fillOpacity).toBe(0.18);
    expect(options.strokeWeight).toBe(2);
  });

  it('draws the busiest part on top when the place has one', () => {
    render(
      <PlaceShape
        place={{
          ...place,
          polygonParts: [[ring(22.4, 88.2)]],
          coreParts: [[ring(22.45, 88.25)]],
          purpose: 'pump',
        }}
        selected={false}
        showCircle
        interactive
        onSelect={() => {}}
      />,
    );
    expect(PolygonF).toHaveBeenCalledTimes(2);
    const core = PolygonF.mock.calls[1][0];
    expect(core.options.fillOpacity).toBe(0.45);
    expect(core.options.strokeOpacity).toBe(0);
    expect(core.options.fillColor).toBe(PURPOSE_COLOR.pump);
  });

  it('draws no busiest part when the place has none', () => {
    render(
      <PlaceShape
        place={{ ...place, polygonParts: [[ring(22.4, 88.2)]] }}
        selected={false}
        showCircle
        interactive
        onSelect={() => {}}
      />,
    );
    expect(PolygonF).toHaveBeenCalledTimes(1);
    expect(PolygonF.mock.calls[0][0].options.fillOpacity).toBe(0.18);
  });
});
