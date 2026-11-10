import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PolygonF } from '@react-google-maps/api';
import GroupShape from './GroupShape.jsx';

vi.mock('@react-google-maps/api', () => ({
  PolygonF: vi.fn(() => null),
}));

const ring = [
  { lat: 22.4, lng: 88.2 },
  { lat: 22.4, lng: 88.3 },
  { lat: 22.5, lng: 88.3 },
];

beforeEach(() => {
  PolygonF.mockClear();
});

describe('GroupShape', () => {
  it('draws the shared area of an anchor as a dashed yellow fill', () => {
    render(<GroupShape place={{ id: 'site:1', groupAnchor: true, groupParts: [[ring]] }} />);
    expect(PolygonF).toHaveBeenCalledTimes(1);
    const options = PolygonF.mock.calls[0][0].options;
    expect(options.fillColor).toBe('#eab308');
    expect(options.fillOpacity).toBe(0.08);
    expect(options.strokeOpacity).toBe(0);
    expect(options.icons[0].repeat).toBe('12px');
  });

  it('draws nothing for a place that only joins the group', () => {
    render(<GroupShape place={{ id: 'site:2', groupAnchor: false, groupParts: [[ring]] }} />);
    expect(PolygonF).not.toHaveBeenCalled();
  });

  it('draws nothing when the anchor has no group shape', () => {
    render(<GroupShape place={{ id: 'site:1', groupAnchor: true, groupParts: null }} />);
    expect(PolygonF).not.toHaveBeenCalled();
  });
});
