import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFollowCamera from './useFollowCamera';

function makeMap() {
  const camera = { center: { lat: 22, lng: 88 }, zoom: 11, heading: 0, tilt: 0 };
  const listeners = new Map();
  const map = {
    getRenderingType: () => 'VECTOR',
    getCenter: () => ({ lat: () => camera.center.lat, lng: () => camera.center.lng }),
    getZoom: () => camera.zoom,
    getHeading: () => camera.heading,
    getTilt: () => camera.tilt,
    addListener: vi.fn((name, handler) => {
      listeners.set(name, handler);
      return { remove: () => listeners.delete(name) };
    }),
    moveCamera: vi.fn((next) => {
      Object.assign(camera, next);
      listeners.get('heading_changed')?.();
    }),
  };
  return { map, camera, listeners };
}

describe('3D follow camera', () => {
  it('follows the truck through turns, respects zoom changes and restores the previous view', () => {
    const { map, camera, listeners } = makeMap();
    const target = { lat: 23, lng: 89, heading: 90 };
    const { result, rerender, unmount } = renderHook(
      (props) => useFollowCamera({ map, ...props }),
      {
        initialProps: { enabled: false, target },
      },
    );
    expect(map.moveCamera).not.toHaveBeenCalled();
    rerender({ enabled: true, target });
    expect(camera).toEqual({ center: { lat: 23, lng: 89 }, zoom: 16, heading: 90, tilt: 60 });
    expect(result.current).toBe(90);
    camera.zoom = 17.5;
    rerender({ enabled: true, target: { lat: 24, lng: 90, heading: 110 } });
    expect(camera).toEqual({ center: { lat: 24, lng: 90 }, zoom: 17.5, heading: 110, tilt: 60 });
    expect(result.current).toBe(110);
    rerender({ enabled: false, target });
    expect(camera).toEqual({ center: { lat: 22, lng: 88 }, zoom: 11, heading: 0, tilt: 0 });
    expect(result.current).toBe(0);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('keeps the last bearing when parked and ignores missing coordinates', () => {
    const { map, camera } = makeMap();
    const { rerender } = renderHook((props) => useFollowCamera({ map, enabled: true, ...props }), {
      initialProps: { target: { lat: 23, lng: 89, heading: 270 } },
    });
    rerender({ target: { lat: 24, lng: 90, heading: null } });
    expect(camera.heading).toBe(270);
    const count = map.moveCamera.mock.calls.length;
    rerender({ target: null });
    expect(map.moveCamera).toHaveBeenCalledTimes(count);
  });

  it('flattens the map without restoring an old vehicle viewport when selection clears', () => {
    const { map, camera } = makeMap();
    const target = { lat: 23, lng: 89, heading: 90 };
    const { rerender } = renderHook((props) => useFollowCamera({ map, target, ...props }), {
      initialProps: { enabled: true, restoreView: true },
    });
    rerender({ enabled: false, restoreView: false });
    expect(camera.center).toEqual({ lat: 23, lng: 89 });
    expect(camera).toMatchObject({ tilt: 0, heading: 0 });
  });

  it('does not pretend to enable 3D when the device falls back to raster maps', () => {
    const { map } = makeMap();
    map.getRenderingType = () => 'RASTER';
    const onUnavailable = vi.fn();
    renderHook(() =>
      useFollowCamera({ map, enabled: true, target: { lat: 23, lng: 89 }, onUnavailable }),
    );
    expect(onUnavailable).toHaveBeenCalledOnce();
    expect(map.moveCamera).not.toHaveBeenCalled();
  });
});
