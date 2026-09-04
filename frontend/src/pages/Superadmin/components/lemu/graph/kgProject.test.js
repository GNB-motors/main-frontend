import { describe, it, expect } from 'vitest';
import {
  createCamera, project, fitView, fitPads, zoomAt, applyFlight,
  clampPitch, easeOutCubic, PITCH_LIMIT, FIT_K, ZOOM_K, FLIGHT_MS,
} from './kgProject';

const cam2d = (k = 1, tx = 0, ty = 0) => ({ k, tx, ty, yaw: 0, pitch: 0 });

describe('project (2D)', () => {
  it('is exactly affine: { x: n.x*k + tx, y: n.y*k + ty, s: 1, d: 0 }', () => {
    const cam = cam2d(2.5, 100, -40);
    expect(project({ x: 3, y: 7 }, cam)).toEqual({ x: 3 * 2.5 + 100, y: 7 * 2.5 - 40, s: 1, d: 0 });
    expect(project({ x: -123.4, y: 0 }, cam).x).toBeCloseTo(-123.4 * 2.5 + 100);
  });
});

describe('project (3D)', () => {
  it('matches 2D exactly for z = 0 with yaw = pitch = 0', () => {
    const cam = cam2d(1.7, 55, 66);
    const n = { x: 42, y: -13, z: 0 };
    expect(project(n, cam, true)).toEqual(project(n, cam, false));
  });

  it('shrinks s monotonically as z increases', () => {
    const cam = cam2d(1, 0, 0);
    const depths = [0, 50, 200, 800].map((z) => project({ x: 0, y: 0, z }, cam, true).s);
    for (let i = 1; i < depths.length; i++) expect(depths[i]).toBeLessThan(depths[i - 1]);
    expect(depths[0]).toBeCloseTo(1);
    expect(depths[2]).toBeCloseTo(1000 / 1200);
  });

  it('reports d as the rotated z (z2)', () => {
    const cam = { k: 1, tx: 0, ty: 0, yaw: 0, pitch: 0 };
    expect(project({ x: 0, y: 0, z: 300 }, cam, true).d).toBeCloseTo(300);
  });

  it('initial camera is yaw 0.5, pitch -0.35', () => {
    const cam = createCamera();
    expect(cam).toEqual({ k: 1, tx: 0, ty: 0, yaw: 0.5, pitch: -0.35 });
  });
});

describe('clampPitch', () => {
  it('clamps to ±1.3', () => {
    expect(clampPitch(0)).toBe(0);
    expect(clampPitch(2)).toBe(PITCH_LIMIT);
    expect(clampPitch(-5)).toBe(-PITCH_LIMIT);
  });
});

describe('fitView', () => {
  // nodes spanning x ∈ [-200, 200], y ∈ [-100, 100]
  const box = [
    { x: -200, y: -100, z: 0 }, { x: 200, y: -100, z: 0 },
    { x: -200, y: 100, z: 0 }, { x: 200, y: 100, z: 0 },
  ];
  const W = 1600, H = 900;

  it('returns a k that places every node inside the padded viewport', () => {
    const cam = createCamera();
    const { target, flight } = fitView(box, cam, { width: W, height: H, motion: false });
    expect(flight).toBeNull(); // motion off → instant
    const after = { ...cam, ...target };
    const { padL, padR, padT, padB } = fitPads(false);
    for (const n of box) {
      const p = project(n, after);
      expect(p.x).toBeGreaterThanOrEqual(padL);
      expect(p.x).toBeLessThanOrEqual(W - padR);
      expect(p.y).toBeGreaterThanOrEqual(padT);
      expect(p.y).toBeLessThanOrEqual(H - padB);
    }
  });

  it('matches the design formula for k and translation', () => {
    const cam = createCamera(); // k = 1 at origin
    const { target } = fitView(box, cam, { width: W, height: H, motion: false });
    const availW = W - 330 - 90, availH = H - 60 - 70;
    const expectedK = Math.min(availW / 400, availH / 200) * 0.94;
    expect(target.k).toBeCloseTo(expectedK);
    expect(target.tx).toBeCloseTo(330 + availW / 2);
    expect(target.ty).toBeCloseTo(60 + availH / 2);
  });

  it('widens padR by 340 when the drawer is open, shrinking k', () => {
    const cam = createCamera();
    const closed = fitView(box, cam, { width: W, height: H, motion: false });
    const open = fitView(box, cam, { width: W, height: H, drawerOpen: true, motion: false });
    expect(fitPads(true).padR - fitPads(false).padR).toBe(340);
    const availWClosed = W - 330 - 90, availWOpen = W - 330 - 430;
    expect(open.target.k / closed.target.k).toBeCloseTo(availWOpen / availWClosed);
  });

  it('clamps k to [0.12, 3.2]', () => {
    const tiny = [{ x: 0, y: 0, z: 0 }];
    const huge = Array.from({ length: 50 }, (_, i) => ({ x: i * 10000, y: 0, z: 0 }));
    const cam = createCamera();
    expect(fitView(tiny, cam, { width: W, height: H, motion: false }).target.k).toBe(FIT_K.max);
    expect(fitView(huge, cam, { width: W, height: H, motion: false }).target.k).toBe(FIT_K.min);
  });

  it('returns null for an empty node set', () => {
    expect(fitView([], createCamera(), { width: W, height: H })).toBeNull();
  });

  it('returns a 480ms flight when motion is on and not reduced', () => {
    const cam = createCamera();
    const { flight } = fitView(box, cam, { width: W, height: H, motion: true, reduced: false, now: 1000 });
    expect(flight.dur).toBe(FLIGHT_MS);
    expect(flight.t0).toBe(1000);
    expect(flight.from).toEqual({ k: cam.k, tx: cam.tx, ty: cam.ty });
  });

  it('is instant when reduced is set even with motion on', () => {
    const { flight } = fitView(box, createCamera(), { width: W, height: H, motion: true, reduced: true, now: 0 });
    expect(flight).toBeNull();
  });
});

describe('applyFlight', () => {
  const flight = {
    from: { k: 1, tx: 0, ty: 0 },
    to: { k: 3, tx: 300, ty: -150 },
    t0: 5000,
    dur: FLIGHT_MS,
  };

  it('starts at the from-camera and lands exactly on the target', () => {
    expect(applyFlight(flight, 5000)).toEqual({ k: 1, tx: 0, ty: 0, done: false });
    const end = applyFlight(flight, 5000 + FLIGHT_MS);
    expect(end).toEqual({ k: 3, tx: 300, ty: -150, done: true });
  });

  it('eases out cubic: fast early, slow late', () => {
    const mid = applyFlight(flight, 5000 + FLIGHT_MS / 2);
    expect(mid.k).toBeGreaterThan(2); // past halfway at t = 0.5
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
});

describe('zoomAt', () => {
  it('uses f = exp(-deltaY * 0.0016) clamped to [0.1, 4.5]', () => {
    const cam = cam2d(1, 0, 0);
    zoomAt(cam, 0, 0, 0);
    expect(cam.k).toBe(1);
    zoomAt(cam, 0, 0, -100);
    expect(cam.k).toBeCloseTo(Math.exp(0.16));
    for (let i = 0; i < 100; i++) zoomAt(cam, 0, 0, -1000);
    expect(cam.k).toBe(ZOOM_K.max);
    for (let i = 0; i < 200; i++) zoomAt(cam, 0, 0, 1000);
    expect(cam.k).toBe(ZOOM_K.min);
  });

  it('anchors the zoom at the cursor: the cursor point stays fixed', () => {
    const cam = cam2d(1, 0, 0);
    zoomAt(cam, 400, 300, -240);
    // world point under the cursor before and after must project to the cursor
    const worldBefore = { x: (400 - 0) / 1, y: (300 - 0) / 1 };
    const p = project(worldBefore, cam);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(300);
  });
});
