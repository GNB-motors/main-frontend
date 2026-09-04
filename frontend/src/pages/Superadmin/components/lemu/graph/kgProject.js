/* Projection and camera, ported from the design's proj() and fitView()
   (Knowledge Graph.dc.html, lines ~811 and ~820). All pure — time is always
   a parameter, never read from the environment.

   2D is an exact affine transform. 3D is a hand-rolled yaw/pitch rotation
   plus a perspective divide (f = 1000 / (1000 + z2)) drawn on the same 2D
   canvas — see plan §0 C8. */

/** Pitch clamp from the design's pointer handler. */
export const PITCH_LIMIT = 1.3;

/** fitView viewport pads. padR widens by 340 when the node drawer is open. */
export const FIT_PADS = { left: 330, right: 90, rightDrawer: 430, top: 60, bottom: 70 };

/** k clamps. fitView: [0.12, 3.2]; wheel zoom: [0.1, 4.5]. */
export const FIT_K = { min: 0.12, max: 3.2 };
export const ZOOM_K = { min: 0.1, max: 4.5 };

/** fitView camera flight duration, ms. */
export const FLIGHT_MS = 480;

/** Camera flight easing: ease-out-cubic, 1 - (1 - t)^3. */
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** The design's initial camera: yaw 0.5, pitch -0.35. */
export const createCamera = () => ({ k: 1, tx: 0, ty: 0, yaw: 0.5, pitch: -0.35 });

/** Pads for a given drawer state. */
export const fitPads = (drawerOpen) => ({
  padL: FIT_PADS.left,
  padR: drawerOpen ? FIT_PADS.rightDrawer : FIT_PADS.right,
  padT: FIT_PADS.top,
  padB: FIT_PADS.bottom,
});

/** Clamp pitch to ±PITCH_LIMIT. */
export const clampPitch = (pitch) => Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));

/** Project a node through the camera. 2D: { x: n.x*k + tx, y: n.y*k + ty, s: 1, d: 0 }.
    3D: yaw/pitch rotation then f = 1000/(1000 + z2); returns s: f, d: z2.
    `n` needs x/y/z (z may be omitted in 2D). */
export const project = (n, cam, is3d = false) => {
  if (!is3d) return { x: n.x * cam.k + cam.tx, y: n.y * cam.k + cam.ty, s: 1, d: 0 };
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x1 = n.x * cy - n.z * sy, z1 = n.x * sy + n.z * cy;
  const y1 = n.y * cp - z1 * sp, z2 = n.y * sp + z1 * cp;
  const f = 1000 / (1000 + z2);
  return { x: x1 * f * cam.k + cam.tx, y: y1 * f * cam.k + cam.ty, s: f, d: z2 };
};

/** Wheel-zoom factor from the design: f = exp(-deltaY * 0.0016), k clamped to
    [0.1, 4.5], anchored at the cursor (mx, my). Mutates cam. */
export const zoomAt = (cam, mx, my, deltaY) => {
  const f = Math.exp(-deltaY * 0.0016), nk = Math.max(ZOOM_K.min, Math.min(ZOOM_K.max, cam.k * f));
  cam.tx = mx - (mx - cam.tx) * (nk / cam.k);
  cam.ty = my - (my - cam.ty) * (nk / cam.k);
  cam.k = nk;
};

/** Compute the fitView target for a set of nodes, ported from fitView().
    Bounding box is measured through the CURRENT camera (so an in-flight or
    panned view fits what is on screen), then k = min(availW/bw, availH/bh)
    * 0.94 * cam.k, clamped to [0.12, 3.2].

    nodes: [{ x, y, z? }]  cam: camera to measure through (not mutated)
    opts:  { width, height, drawerOpen?, is3d?, motion?, reduced?, instant?, now? }

    Returns { target: { k, tx, ty }, flight }. When instant, or motion is off,
    or reduced is set, flight is null and the caller applies target directly
    (the design's Object.assign(v, target) branch). Otherwise flight is
    { from, to, t0: opts.now, dur: FLIGHT_MS } and the caller interpolates
    with applyFlight. Returns null for an empty node set. */
export const fitView = (nodes, cam, opts) => {
  if (!nodes.length || !opts.width) return null;
  const is3d = !!opts.is3d;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const n of nodes) {
    const p = project(n, cam, is3d);
    if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
  }
  const { padL, padR, padT, padB } = fitPads(!!opts.drawerOpen);
  const availW = Math.max(160, opts.width - padL - padR), availH = Math.max(160, opts.height - padT - padB);
  const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
  const k = Math.min(availW / bw, availH / bh) * 0.94 * cam.k;
  const cx = (x0 + x1) / 2, cy2 = (y0 + y1) / 2;
  const target = {
    k: Math.max(FIT_K.min, Math.min(FIT_K.max, k)),
    tx: padL + availW / 2 - (cx - cam.tx) * (k / cam.k),
    ty: padT + availH / 2 - (cy2 - cam.ty) * (k / cam.k),
  };
  if (opts.instant || !opts.motion || opts.reduced) return { target, flight: null };
  return {
    target,
    flight: { from: { k: cam.k, tx: cam.tx, ty: cam.ty }, to: target, t0: opts.now, dur: FLIGHT_MS },
  };
};

/** Interpolate a camera flight at time `now` (ms, caller-supplied).
    Returns { k, tx, ty, done }. done is true once the flight has reached its
    target; callers should drop the flight then. */
export const applyFlight = (flight, now) => {
  const t = Math.min(1, (now - flight.t0) / flight.dur), e = easeOutCubic(t);
  const a = flight.from, b = flight.to;
  return {
    k: a.k + (b.k - a.k) * e,
    tx: a.tx + (b.tx - a.tx) * e,
    ty: a.ty + (b.ty - a.ty) * e,
    done: t >= 1,
  };
};
