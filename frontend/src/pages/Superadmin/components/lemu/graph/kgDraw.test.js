import { draw, drawHosts } from './kgDraw';
import { kindHue, hexa, CANVAS, OUTLINE_COLOR } from './graphTheme';

/* Recording 2D-context stub. Every method call lands in `calls` with a
   snapshot of the style state at that moment, so tests can assert both the
   call sequence and the exact paint state (fillStyle at a fill, shadowBlur
   at an arc, ...). Property writes (fillStyle, shadowBlur, ...) are
   recorded too. */
function makeCtx() {
  const calls = [];
  const ctx = {
    calls,
    fillStyle: undefined, strokeStyle: undefined, lineWidth: 1, globalAlpha: 1,
    shadowColor: undefined, lineCap: 'butt', font: '', textAlign: 'left', textBaseline: 'alphabetic',
    _dash: [],
  };
  const snap = () => ({
    fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, lineWidth: ctx.lineWidth,
    globalAlpha: ctx.globalAlpha, shadowBlur: ctx.shadowBlur, dash: ctx._dash.slice(),
  });
  const rec = (m, args) => { const c = { m, args, ...snap() }; calls.push(c); return c; };
  let _shadowBlur = 0;
  Object.defineProperty(ctx, 'shadowBlur', {
    get: () => _shadowBlur,
    set: (v) => { _shadowBlur = v; calls.push({ m: 'set', prop: 'shadowBlur', args: [v] }); },
  });
  const grad = (m, args) => {
    const g = { stops: [] };
    rec(m, args);
    return { addColorStop: (o, col) => { g.stops.push([o, col]); rec('addColorStop', [o, col]); } };
  };
  Object.assign(ctx, {
    setTransform: (...a) => rec('setTransform', a),
    clearRect: (...a) => rec('clearRect', a),
    fillRect: (...a) => rec('fillRect', a),
    strokeRect: (...a) => rec('strokeRect', a),
    beginPath: () => rec('beginPath', []),
    closePath: () => rec('closePath', []),
    arc: (...a) => rec('arc', a),
    moveTo: (...a) => rec('moveTo', a),
    lineTo: (...a) => rec('lineTo', a),
    stroke: () => rec('stroke', []),
    fill: () => rec('fill', []),
    quadraticCurveTo: (...a) => rec('quadraticCurveTo', a),
    setLineDash: (...a) => { ctx._dash = a[0]; rec('setLineDash', a); },
    measureText: (t) => ({ width: t.length * 6 }),
    fillText: (...a) => rec('fillText', a),
    createRadialGradient: (...a) => grad('createRadialGradient', a),
    createLinearGradient: (...a) => grad('createLinearGradient', a),
  });
  return ctx;
}

const baseModel = (over = {}) => ({
  width: 800, height: 600, dpr: 1, now: 1000,
  theme: 'dark', layer: 'code', k: 1,
  motion: true, reduced: false, showParticles: true,
  focus: false, query: '', matches: null,
  selectedId: null, hoverId: null, neighbours: null,
  nodes: [], links: [],
  ...over,
});

const measuredNode = (over = {}) => ({ id: 'a', kind: 'module', state: 'measured', name: 'a', r: 10, x: 100, y: 100, ...over });

describe('draw — background', () => {
  it('paints a radial gradient at (0.42W, 0.42H) with the theme stops', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel());
    const g = ctx.calls.find((c) => c.m === 'createRadialGradient');
    expect(g.args).toEqual([800 * 0.42, 600 * 0.42, 40, 800 * 0.42, 600 * 0.42, 800 * 0.8]);
    const stops = ctx.calls.filter((c) => c.m === 'addColorStop').map((c) => c.args);
    expect(stops).toEqual([[0, CANVAS.dark.g0], [0.55, CANVAS.dark.g1], [1, CANVAS.dark.g2]]);
  });
});

describe('draw — links', () => {
  it('colours each link as a gradient between the endpoint kind hues', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({
      nodes: [measuredNode({ id: 'a', kind: 'module' }), measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 })],
      links: [{ s: 'a', t: 'b' }],
    }));
    const g = ctx.calls.find((c) => c.m === 'createLinearGradient');
    expect(g.args).toEqual([100, 100, 300, 100]);
    const stops = ctx.calls.filter((c) => c.m === 'addColorStop' && c.args[1].startsWith('rgba')).map((c) => c.args);
    expect(stops[0]).toEqual([0, hexa(kindHue('module', 'dark'), 0.14)]);
    expect(stops[1]).toEqual([1, hexa(kindHue('store', 'dark'), 0.14)]);
    const linkStroke = ctx.calls.find((c) => c.m === 'stroke' && c.args.length === 0 && c.lineWidth === 0.7);
    expect(linkStroke).toBeTruthy();
  });

  it('uses the plan alpha table: highlighted 0.6/0.72, dimmed 0.05/0.07, normal 0.14/0.26', () => {
    const mk = (theme, selectedId) => {
      const ctx = makeCtx();
      draw(ctx, baseModel({
        theme,
        selectedId,
        nodes: [
          measuredNode({ id: 'a', kind: 'module' }),
          measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 }),
          measuredNode({ id: 'c', kind: 'table', x: 100, y: 300 }),
          measuredNode({ id: 'd', kind: 'job', x: 300, y: 300 }),
        ],
        links: [{ s: 'a', t: 'b' }, { s: 'c', t: 'd' }, { s: 'a', t: 'c' }],
      }));
      return ctx.calls.filter((c) => c.m === 'addColorStop').map((c) => c.args[1]);
    };
    expect(mk('dark', 'a')).toContain(hexa(kindHue('module', 'dark'), 0.6));
    expect(mk('light', 'a')).toContain(hexa(kindHue('module', 'light'), 0.72));
    expect(mk('dark', 'a')).toContain(hexa(kindHue('job', 'dark'), 0.05));
    expect(mk('light', 'a')).toContain(hexa(kindHue('job', 'light'), 0.07));
    expect(mk('dark', null)).toContain(hexa(kindHue('module', 'dark'), 0.14));
    expect(mk('light', null)).toContain(hexa(kindHue('module', 'light'), 0.26));
  });
});

describe('draw — particles', () => {
  const trafficModel = (over = {}) => baseModel({
    now: 50000,
    nodes: [measuredNode({ id: 'a', kind: 'module' }), measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 })],
    links: [{ s: 'a', t: 'b', w: 0.8, traffic: true }],
    ...over,
  });

  it('draws particles only on links with traffic, coloured by the target hue', () => {
    const ctx = makeCtx();
    draw(ctx, trafficModel());
    const t = 50000 * 0.00013;
    const fills = ctx.calls.filter((c) => c.m === 'fill' && c.fillStyle === hexa(kindHue('store', 'dark'), 0.5));
    expect(fills.length).toBe(3); // w 0.8 > 0.6 -> 3 particles
    const particleArcs = ctx.calls.filter((c) => c.m === 'arc' && c.args[2] === 1.35);
    expect(particleArcs.length).toBe(3);
    // u = (t*(0.6+w)*3 + i/cnt) % 1
    const u0 = (t * (0.6 + 0.8) * 3) % 1;
    expect(particleArcs[0].args[0]).toBeCloseTo(100 + 200 * u0, 5);
    expect(particleArcs[1].args[0]).toBeCloseTo(100 + 200 * ((u0 + 1 / 3) % 1), 5);
  });

  it('skips links without traffic', () => {
    const ctx = makeCtx();
    draw(ctx, trafficModel({ links: [{ s: 'a', t: 'b', w: 0.8 }] }));
    expect(ctx.calls.filter((c) => c.m === 'arc' && c.args[2] === 1.35).length).toBe(0);
  });

  it('is gated by motion, reduced and showParticles', () => {
    for (const over of [{ motion: false }, { reduced: true }, { showParticles: false }]) {
      const ctx = makeCtx();
      draw(ctx, trafficModel(over));
      expect(ctx.calls.filter((c) => c.m === 'arc' && c.args[2] === 1.35).length).toBe(0);
    }
  });

  it('highlighted links get radius 1.9 at alpha 0.95 and dimmed links get none', () => {
    const ctx = makeCtx();
    draw(ctx, trafficModel({
      selectedId: 'a',
      nodes: [
        measuredNode({ id: 'a', kind: 'module' }),
        measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 }),
        measuredNode({ id: 'c', kind: 'table', x: 100, y: 300 }),
        measuredNode({ id: 'd', kind: 'job', x: 300, y: 300 }),
      ],
      links: [{ s: 'a', t: 'b', w: 0.8, traffic: true }, { s: 'c', t: 'd', w: 0.8, traffic: true }],
    }));
    expect(ctx.calls.filter((c) => c.m === 'arc' && c.args[2] === 1.9).length).toBe(3);
    expect(ctx.calls.filter((c) => c.m === 'fill' && c.fillStyle === hexa(kindHue('store', 'dark'), 0.95)).length).toBe(3);
    expect(ctx.calls.filter((c) => c.m === 'fill' && c.fillStyle === hexa(kindHue('job', 'dark'), 0.5)).length).toBe(0);
  });
});

describe('draw — the three node treatments', () => {
  it('a declared node NEVER fills with its kind hue', () => {
    const hue = kindHue('module', 'dark');
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ state: 'declared', r: 3 })] }));
    const hueFills = ctx.calls.filter((c) => c.m === 'fill' && (c.fillStyle === hue || String(c.fillStyle).startsWith(hexa(hue, hexa(hue, 0).slice(-4)))));
    expect(hueFills.length).toBe(0);
    // it fills with C.void instead — the node is empty on purpose
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void)).toBe(true);
    // dashed ring + inner rim; r is floored at 4.6, so the dash uses 4.6
    expect(ctx.calls.some((c) => c.m === 'setLineDash' && c.args[0][0] === Math.max(2, 4.6 * 0.5))).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === CANVAS.dark.innerRim)).toBe(true);
    // radius floored at 4.6
    const voidFillIdx = ctx.calls.findIndex((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void);
    expect(ctx.calls[voidFillIdx - 1].m).toBe('arc');
    expect(ctx.calls[voidFillIdx - 1].args[2]).toBe(4.6);
  });

  it('an unreachable node emits exactly one moveTo/lineTo pair — the diagonal slash', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ state: 'unreachable', r: 10 })] }));
    const slashes = ctx.calls.filter(
      (c) => (c.m === 'moveTo' && c.args[0] === 95 && c.args[1] === 105) ||
             (c.m === 'lineTo' && c.args[0] === 105 && c.args[1] === 95)
    );
    expect(slashes.filter((c) => c.m === 'moveTo').length).toBe(1);
    expect(slashes.filter((c) => c.m === 'lineTo').length).toBe(1);
    expect(slashes[0].m).toBe('moveTo');
    // solid fault ring + dashed halo
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === hexa(CANVAS.dark.faultCss, 0.95) && c.lineWidth === 2)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'setLineDash' && c.args[0].join() === '2,3')).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.voidFault)).toBe(true);
  });

  it('a measured node in light theme emits NO shadowBlur and uses the 1px r+0.5 rim', () => {
    const hue = kindHue('module', 'light');
    const ctx = makeCtx();
    draw(ctx, baseModel({ theme: 'light', nodes: [measuredNode()] }));
    const shadowSets = ctx.calls.filter((c) => c.m === 'set' && c.prop === 'shadowBlur');
    expect(shadowSets.every((c) => c.args[0] === 0)).toBe(true);
    const rim = ctx.calls.find((c) => c.m === 'stroke' && c.strokeStyle === hexa(hue, 0.9));
    expect(rim).toBeTruthy();
    const rimArc = ctx.calls.find((c) => c.m === 'arc' && c.args[2] === 10.5);
    expect(rimArc).toBeTruthy();
  });

  it('a measured node in dark theme glows at min(22, r*1.7) in hexa(hue, .75)', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ r: 10 })], selectedId: null }));
    const arc = ctx.calls.find((c) => c.m === 'arc' && c.args[2] === 10);
    expect(arc.shadowBlur).toBe(17);
    expect(ctx.calls.some((c) => c.m === 'set' && c.prop === 'shadowBlur' && c.args[0] === 17)).toBe(true);
    // specular highlight arc
    const spec = ctx.calls.find((c) => c.m === 'arc' && Math.abs(c.args[2] - 3.4) < 1e-9);
    expect(spec.args[0]).toBeCloseTo(100 - 10 * 0.28, 5);
    expect(spec.args[1]).toBeCloseTo(100 - 10 * 0.3, 5);
  });

  it('an error-bearing selected node draws BOTH the pip and the selection ring', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ errorCount: 4 })], selectedId: 'a' }));
    const pipRim = ctx.calls.find((c) => c.m === 'arc' && c.args[2] === 3.1);
    expect(pipRim).toBeTruthy();
    expect(pipRim.fillStyle).toBe(CANVAS.dark.pipRim);
    const pipFill = ctx.calls.find((c) => c.m === 'arc' && c.args[2] === 2.1);
    expect(pipFill.fillStyle).toBe(CANVAS.dark.faultCss);
    // pip position: angle -0.78 rad at r + 1.5
    expect(pipRim.args[0]).toBeCloseTo(100 + Math.cos(-0.78) * 11.5, 5);
    expect(pipRim.args[1]).toBeCloseTo(100 + Math.sin(-0.78) * 11.5, 5);
    // selection ring r+5 @ 1.6px + halo r+9.5 @ 1px
    const selRing = ctx.calls.find((c) => c.m === 'stroke' && c.strokeStyle === CANVAS.dark.selRing && c.lineWidth === 1.6);
    expect(selRing).toBeTruthy();
    expect(ctx.calls.some((c) => c.m === 'arc' && c.args[2] === 15 && c.strokeStyle === CANVAS.dark.selRing)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'arc' && c.args[2] === 19.5 && c.strokeStyle === CANVAS.dark.halo)).toBe(true);
  });

  it('neighbour and hover rings use the plan radii', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({
      nodes: [measuredNode(), measuredNode({ id: 'b', kind: 'store', x: 200, y: 100 })],
      links: [{ s: 'a', t: 'b' }],
      selectedId: 'a',
      hoverId: 'b',
      neighbours: new Set(['b']),
    }));
    expect(ctx.calls.some((c) => c.m === 'arc' && c.args[2] === 13.4 && c.strokeStyle === CANVAS.dark.nbRing)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'arc' && c.args[2] === 14 && c.strokeStyle === CANVAS.dark.hoverRing)).toBe(true);
  });

  it('a ghost (removed) node renders hollow + dimmed + the removed outline — NOT the fault treatment', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ state: 'removed', ghost: true, r: 10 })] }));
    // hollow fill, never the fault fill
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.voidFault)).toBe(false);
    // no fault ring, no dashed fault halo, no slash
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === hexa(CANVAS.dark.faultCss, 0.95))).toBe(false);
    expect(ctx.calls.some((c) => c.m === 'setLineDash' && c.args[0].join() === '2,3')).toBe(false);
    expect(ctx.calls.some((c) => c.m === 'moveTo' && c.args[0] === 95 && c.args[1] === 105)).toBe(false);
    // dimmed: the node paint carries globalAlpha 0.45
    const voidFill = ctx.calls.find((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void);
    expect(voidFill.globalAlpha).toBeCloseTo(0.45, 5);
    // the diff outline owns the outline channel: removed ring at r+3 @ 1.5px
    expect(ctx.calls.some(
      (c) => c.m === 'arc' && c.args[2] === 13 && c.strokeStyle === OUTLINE_COLOR.removed
    )).toBe(true);
    const outlineStroke = ctx.calls.find((c) => c.m === 'stroke' && c.strokeStyle === OUTLINE_COLOR.removed);
    expect(outlineStroke.lineWidth).toBe(1.5);
    // hollow ring recipe still applies (dashed ring + inner rim)
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === CANVAS.dark.innerRim)).toBe(true);
    // no glow anywhere near a ghost
    const shadowSets = ctx.calls.filter((c) => c.m === 'set' && c.prop === 'shadowBlur' && c.args[0] !== 0);
    expect(shadowSets.length).toBe(0);
  });

  it('the ghost flag alone (no state) gets the same treatment', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({ nodes: [measuredNode({ ghost: true, r: 10 })] }));
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.voidFault)).toBe(false);
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === OUTLINE_COLOR.removed)).toBe(true);
  });

  it('an overlay-added node draws its outline ring in OUTLINE_COLOR.added at r+3 @ 1.5px', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({
      nodes: [measuredNode({ id: 'a', r: 10 }), measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 })],
      links: [{ s: 'a', t: 'b' }],
      overlay: new Map([['a', 'added']]),
    }));
    // the ring colour comes straight from OUTLINE_COLOR, not a local literal
    const ring = ctx.calls.find((c) => c.m === 'stroke' && c.strokeStyle === OUTLINE_COLOR.added);
    expect(ring).toBeTruthy();
    expect(ring.lineWidth).toBe(1.5);
    expect(ctx.calls.some(
      (c) => c.m === 'arc' && c.args[2] === 13 && c.strokeStyle === OUTLINE_COLOR.added
    )).toBe(true);
    // an unmarked node gets no diff outline of any colour
    expect(ctx.calls.some(
      (c) => c.m === 'arc' && c.args[0] === 300 && c.strokeStyle === OUTLINE_COLOR.changed
    )).toBe(false);
  });

  it('an overlay-changed node draws its outline ring in OUTLINE_COLOR.changed, regardless of node state', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({
      nodes: [measuredNode({ id: 'a', state: 'declared', r: 10 })],
      overlay: new Map([['a', 'changed']]),
    }));
    const ring = ctx.calls.find((c) => c.m === 'stroke' && c.strokeStyle === OUTLINE_COLOR.changed);
    expect(ring).toBeTruthy();
    expect(ring.lineWidth).toBe(1.5);
    expect(ctx.calls.some(
      (c) => c.m === 'arc' && c.args[2] === 13 && c.strokeStyle === OUTLINE_COLOR.changed
    )).toBe(true);
  });

  it('a ghost among measured nodes keeps its dimming when a selection dims the others', () => {
    const ctx = makeCtx();
    draw(ctx, baseModel({
      nodes: [
        measuredNode({ id: 'a', state: 'removed', ghost: true, r: 10, x: 100, y: 100 }),
        measuredNode({ id: 'b', kind: 'store', x: 300, y: 100 }),
        measuredNode({ id: 'c', kind: 'job', x: 100, y: 300 }),
      ],
      links: [{ s: 'b', t: 'c' }],
      selectedId: 'b',
      neighbours: new Set(['c']),
    }));
    const voidFill = ctx.calls.find((c) => c.m === 'fill' && c.fillStyle === CANVAS.dark.void);
    // selection dimming floors alpha at 0.22 first, then the ghost dim applies
    expect(voidFill.globalAlpha).toBeCloseTo(0.22 * 0.45, 5);
  });

  it('3D sorts painter-style by d descending and scales alpha by depth', () => {
    const ctx = makeCtx();
    const sFar = 1000 / 1400;
    draw(ctx, baseModel({
      mode3d: true,
      nodes: [
        measuredNode({ id: 'near', r: 10, s: 1, d: -50 }),
        measuredNode({ id: 'far', r: 10, s: sFar, d: 400, x: 200, y: 100 }),
      ],
    }));
    const nodeFills = ctx.calls.filter((c) => c.m === 'fill' && c.args.length === 0 &&
      ctx.calls[ctx.calls.indexOf(c) - 1]?.m === 'arc' && ctx.calls[ctx.calls.indexOf(c) - 1]?.args[2] >= 7);
    expect(nodeFills.length).toBe(2);
    // far (d=400) painted first, alpha scaled 0.55 + 0.45*min(1, s)
    expect(nodeFills[0].globalAlpha).toBeCloseTo(0.55 + 0.45 * sFar, 5);
    expect(nodeFills[1].globalAlpha).toBe(1);
  });
});

describe('drawHosts — host boxes', () => {
  const infraModel = (over = {}) => baseModel({
    layer: 'infra',
    nodes: [
      measuredNode({ id: 'h1', kind: 'host', name: 'app', r: 8, x: 50, y: 50 }),
      measuredNode({ id: 'm1', kind: 'store', name: 's', r: 8, x: 60, y: 60, host: 'h1' }),
      measuredNode({ id: 'm2', kind: 'table', name: 't', r: 8, x: 140, y: 60, host: 'h1' }),
    ],
    links: [],
    ...over,
  });

  it('draws host boxes BEFORE nodes, dashed [5,4], padded r+15 with y0-6', () => {
    const ctx = makeCtx();
    draw(ctx, infraModel());
    const firstQuad = ctx.calls.findIndex((c) => c.m === 'quadraticCurveTo');
    const firstNodeFill = ctx.calls.findIndex(
      (c) => c.m === 'fill' && ctx.calls[ctx.calls.indexOf(c) - 1]?.m === 'arc' && ctx.calls[ctx.calls.indexOf(c) - 1]?.args[2] === 8
    );
    expect(firstQuad).toBeGreaterThan(-1);
    expect(firstNodeFill).toBeGreaterThan(-1);
    expect(firstQuad).toBeLessThan(firstNodeFill);
    // member bbox: x0=60-23=37, x1=140+23=163, y0=(60-23)-6=31, y1=60+23=83
    const dash = ctx.calls.find((c) => c.m === 'setLineDash' && c.args[0].join() === '5,4');
    expect(dash).toBeTruthy();
    const move = ctx.calls.find((c) => c.m === 'moveTo' && c.args[0] === 37 + 12);
    expect(move).toBeTruthy();
    expect(ctx.calls.some((c) => c.m === 'lineTo' && c.args[0] === 163 - 12 && c.args[1] === 31)).toBe(true);
  });

  it('draws a 16px label chip at y0-20 and returns it for hit-testing', () => {
    const ctx = makeCtx();
    const chips = drawHosts(ctx, infraModel());
    expect(chips.length).toBe(1);
    expect(chips[0].hostId).toBe('h1');
    expect(chips[0].rect[3]).toBe(16);
    expect(chips[0].rect[1]).toBe(31 - 20);
    const chip = ctx.calls.find((c) => c.m === 'fillRect' && c.args[1] === 11 && c.args[3] === 16);
    expect(chip).toBeTruthy();
    expect(ctx.calls.some((c) => c.m === 'fillText' && c.args[0] === 'app')).toBe(true);
  });

  it('uses the selected host tokens when the host is selected', () => {
    const ctx = makeCtx();
    draw(ctx, infraModel({ selectedId: 'h1' }));
    expect(ctx.calls.some((c) => c.m === 'stroke' && c.strokeStyle === CANVAS.dark.hostStrokeSel)).toBe(true);
  });
});

describe('draw — non-finite resilience', () => {
  /* Chromium's real createLinearGradient THROWS on non-finite arguments
     ("The provided double value is non-finite") — a stub that silently
     accepts them would hide the regression this guards. */
  const strictCtx = () => {
    const ctx = makeCtx();
    ctx.createLinearGradient = (...a) => {
      if (!a.every(Number.isFinite)) throw new TypeError("Failed to execute 'createLinearGradient': The provided double value is non-finite");
      return { addColorStop: () => {} };
    };
    return ctx;
  };

  it('skips a link with a NaN endpoint instead of throwing — and still draws the healthy link', () => {
    const ctx = strictCtx();
    expect(() => draw(ctx, baseModel({
      nodes: [
        measuredNode({ id: 'a' }),
        measuredNode({ id: 'bad', kind: 'store', x: NaN, y: 100 }),
        measuredNode({ id: 'b', kind: 'job', x: 300, y: 100 }),
      ],
      links: [{ s: 'a', t: 'bad' }, { s: 'a', t: 'b' }],
    }))).not.toThrow();
    // the healthy link still painted its gradient + stroke
    expect(ctx.calls.some((c) => c.m === 'moveTo' && c.args[0] === 100 && c.args[1] === 100)).toBe(true);
    expect(ctx.calls.some((c) => c.m === 'lineTo' && c.args[0] === 300 && c.args[1] === 100)).toBe(true);
  });

  it('skips particles on a traffic link with a NaN endpoint', () => {
    const ctx = strictCtx();
    expect(() => draw(ctx, baseModel({
      now: 50000,
      nodes: [
        measuredNode({ id: 'a' }),
        measuredNode({ id: 'bad', kind: 'store', x: NaN, y: 100 }),
      ],
      links: [{ s: 'a', t: 'bad', w: 0.8, traffic: true }],
    }))).not.toThrow();
    expect(ctx.calls.filter((c) => c.m === 'arc' && c.args[2] === 1.35).length).toBe(0);
  });
});
