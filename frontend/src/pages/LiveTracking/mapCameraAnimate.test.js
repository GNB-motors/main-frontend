import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { animateCamera } from './mapCameraAnimate.js';

function fakeMap({ lat = 20, lng = 80, zoom = 5 } = {}) {
  const state = { lat, lng, zoom };
  return {
    state,
    getCenter: () => ({ lat: () => state.lat, lng: () => state.lng }),
    getZoom: () => state.zoom,
    moveCamera: vi.fn(({ center, zoom: z }) => {
      state.lat = center.lat;
      state.lng = center.lng;
      state.zoom = z;
    }),
  };
}

describe('animateCamera', () => {
  let frames;
  let clock;
  beforeEach(() => {
    frames = [];
    clock = 0;
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      frames.push(cb);
      return frames.length;
    });
    // t0 is read from performance.now(); keep it at the clock's start so the
    // timestamps we feed the frames are measured from the same origin.
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Drive the queued frames, feeding an advancing clock so the ease runs to 1.
  const run = (times = [0, 250, 500]) => {
    times.forEach((t) => {
      const cb = frames.shift();
      if (cb) cb(t);
    });
  };

  it('eases from the current camera to the target and lands exactly on it', () => {
    const map = fakeMap({ lat: 20, lng: 80, zoom: 5 });
    animateCamera(map, { center: { lat: 22, lng: 88 }, zoom: 15 }, { duration: 500 });
    run();
    expect(map.state).toEqual({ lat: 22, lng: 88, zoom: 15 });
    expect(map.moveCamera).toHaveBeenCalled();
  });

  it('jumps straight to the target when the map has no projection yet', () => {
    const map = fakeMap();
    map.getCenter = () => undefined;
    animateCamera(map, { center: { lat: 1, lng: 2 }, zoom: 12 });
    expect(map.moveCamera).toHaveBeenCalledWith({ center: { lat: 1, lng: 2 }, zoom: 12 });
    expect(frames).toHaveLength(0);
  });

  it('a newer call supersedes an in-flight animation', () => {
    const map = fakeMap({ lat: 0, lng: 0, zoom: 5 });
    animateCamera(map, { center: { lat: 10, lng: 10 }, zoom: 10 }, { duration: 500 });
    // Start a second animation before the first finishes.
    animateCamera(map, { center: { lat: -5, lng: -5 }, zoom: 8 }, { duration: 500 });
    // Drain every queued frame with a clock past both durations.
    while (frames.length) run([1000]);
    expect(map.state).toEqual({ lat: -5, lng: -5, zoom: 8 });
  });
});
