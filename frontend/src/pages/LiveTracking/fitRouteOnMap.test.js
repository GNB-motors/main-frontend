import { beforeEach, expect, it, vi } from 'vitest';
import { fitRouteOnMap } from './fitRouteOnMap.js';
import { animateCamera } from './mapCameraAnimate.js';
vi.mock('./mapCameraAnimate.js', () => ({ animateCamera: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it.each([
  [1200, 800],
  [320, 500],
])('keeps the entire route inside the %s by %s map canvas', (width, height) => {
  const map = {
    __cameraAnim: {},
    getDiv: () => ({ getBoundingClientRect: () => ({ width, height }) }),
  };
  const points = [
    { lat: 22.5, lng: 87.2 },
    { lat: 24.2, lng: 86.8 },
    { lat: 23, lng: 89 },
  ];
  expect(fitRouteOnMap(map, points)).toBe(true);
  expect(map.__cameraAnim).toBeNull();
  const [, { center, zoom }] = animateCamera.mock.calls[0];
  const y = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
  for (const point of points) {
    const xPixel = width / 2 + ((point.lng - center.lng) / 360) * 256 * 2 ** zoom;
    const yPixel = height / 2 + (y(point.lat) - y(center.lat)) * 256 * 2 ** zoom;
    expect(xPixel).toBeGreaterThanOrEqual(Math.min(64, width * 0.12));
    expect(xPixel).toBeLessThanOrEqual(width - Math.min(64, width * 0.12));
    expect(yPixel).toBeGreaterThanOrEqual(Math.min(84, height * 0.15));
    expect(yPixel).toBeLessThanOrEqual(height - Math.min(64, height * 0.12));
  }
});

it('does not move the camera without valid coordinates or a visible canvas', () => {
  const map = { getDiv: () => ({ getBoundingClientRect: () => ({ width: 0, height: 0 }) }) };
  expect(fitRouteOnMap(map, [{ lat: 22, lng: 88 }])).toBe(false);
  expect(fitRouteOnMap(null, [])).toBe(false);
  expect(animateCamera).not.toHaveBeenCalled();
});
