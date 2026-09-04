/* The draw pass — ported from the design's draw()/drawHosts()
   (design/lemu-kg/Knowledge Graph.dc.html, ~lines 1012-1216).

   Pure over a 2D canvas context: no React, no globals, no
   performance.now()/Date.now() — time arrives as `model.now`. Every colour
   comes from graphTheme's CANVAS tokens and kindHue(); the concrete
   numbers (radii, widths, dashes, alphas) are the design's and must not
   be rounded or "improved".

   The three node treatments are the heart of the design:
     measured    — solid kind-hue disc; glow (dark) or 1px rim (light); specular arc
     declared    — C.void fill, NEVER the kind hue; dashed hue ring; inner rim
     unreachable — C.voidFault fill; solid fault ring; dashed halo; diagonal slash */

import { hexa, kindHue, canvasTokens } from './graphTheme';

const TAU = 6.2832;

/**
 * @param {CanvasRenderingContext2D} ctx  2D context (any recording stub with the same surface)
 * @param {object} model
 *   width, height            CSS-pixel viewport size
 *   dpr                      device pixel ratio (defaults to 1)
 *   now                      animation clock, ms — REQUIRED, no internal clock
 *   theme                    'dark' | 'light' (default 'dark')
 *   layer                    'infra' | 'code' (default 'infra') — infra draws host boxes
 *   k                        camera zoom (default 1)
 *   mode3d                   painter's-algorithm depth sort + depth alpha
 *   motion, reduced, showParticles   particle gating (all default true except reduced)
 *   focus                    search-focus mode: selection dimming suspended
 *   query                    raw search string; when non-empty, `matches` gates alpha
 *   matches                  Set<string> of node ids matching the search
 *   selectedId, hoverId      string | null
 *   neighbours               Set<string> | object<string, truthy>
 *   nodes                    projected nodes: { id, kind, state, name, r, x, y, s?, d?,
 *                            errorCount?|errBase?, host? } — x/y are SCREEN coords,
 *                            s is the projection scale (default 1), d the depth
 *   links                    [{ s, t, w?, traffic? }]
 * @param {object} [C]         canvas tokens; defaults to canvasTokens(model.theme)
 */
export const draw = (ctx, model, C = canvasTokens(model.theme)) => {
  const W = model.width, H = model.height, d = model.dpr || 1;
  const theme = model.theme === 'light' ? 'light' : 'dark';
  const kc = (kind) => kindHue(kind, theme) || '#94a3b8';

  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.42, H * 0.42, 40, W * 0.42, H * 0.42, Math.max(W, H) * 0.8);
  bg.addColorStop(0, C.g0); bg.addColorStop(0.55, C.g1); bg.addColorStop(1, C.g2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const sel = model.selectedId || null, hov = model.hoverId || null;
  const nb = model.neighbours || null;
  const isNb = (id) => (nb ? (nb.has ? nb.has(id) : !!nb[id]) : false);

  if (model.layer !== 'code') drawHosts(ctx, model, C);

  const byId = {};
  model.nodes.forEach((n) => { byId[n.id] = n; });
  const k = model.k || 1;

  ctx.lineCap = 'round';
  for (const l of model.links) {
    const a = byId[l.s], b = byId[l.t];
    if (!a || !b) continue;
    const hi = sel && (l.s === sel || l.t === sel);
    const dim = sel && !hi;
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    const al = hi ? (C.glow ? 0.6 : 0.72) : dim ? (C.glow ? 0.05 : 0.07) : (C.glow ? 0.14 : 0.26);
    g.addColorStop(0, hexa(kc(a.kind), al)); g.addColorStop(1, hexa(kc(b.kind), al));
    ctx.strokeStyle = g; ctx.lineWidth = hi ? 1.5 : 0.7;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  // Particles show direction: they travel the link and are coloured by the
  // TARGET node's hue. Only when motion is on, the user has not asked for
  // reduced motion, and the page allows particles.
  if (model.motion && !model.reduced && model.showParticles !== false) {
    const t = model.now * 0.00013;
    for (const l of model.links) {
      if (!l.traffic) continue;
      const a = byId[l.s], b = byId[l.t];
      if (!a || !b) continue;
      const hi = sel && (l.s === sel || l.t === sel), dim = sel && !hi;
      if (dim) continue;
      const w = l.w || 0;
      const cnt = w > 0.6 ? 3 : 2;
      for (let i = 0; i < cnt; i++) {
        const u = (t * (0.6 + w) * 3 + i / cnt) % 1;
        const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u;
        ctx.fillStyle = hexa(kc(b.kind), hi ? 0.95 : (C.glow ? 0.5 : 0.8));
        ctx.beginPath(); ctx.arc(x, y, hi ? 1.9 : 1.35, 0, TAU); ctx.fill();
      }
    }
  }

  const order = model.nodes.slice();
  if (model.mode3d) order.sort((x, y) => (byId[y.id].d || 0) - (byId[x.id].d || 0));
  const q = (model.query || '').trim();
  for (const n of order) {
    const p = byId[n.id], hue = kc(n.kind);
    const sState = n.state || 'measured';
    let r = Math.max(2.2, n.r * k * (p.s == null ? 1 : p.s));
    if (sState !== 'measured') r = Math.max(r, 4.6);
    let alpha = 1;
    if (q) alpha = model.matches && model.matches.has(n.id) ? 1 : 0.11;
    if (sel && !model.focus) { if (n.id === sel) alpha = 1; else if (isNb(n.id)) alpha = Math.max(alpha, 0.9); else alpha = Math.min(alpha, 0.22); }
    if (model.mode3d) alpha *= 0.55 + 0.45 * Math.min(1, p.s == null ? 1 : p.s);
    ctx.globalAlpha = alpha;

    if (sState === 'measured') {
      if (C.glow) { ctx.shadowColor = hexa(hue, 0.75); ctx.shadowBlur = Math.min(22, r * 1.7); }
      ctx.fillStyle = hue; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // Light theme: no glow — a 1px rim at r + 0.5 carries the edge instead.
      if (!C.glow) { ctx.strokeStyle = hexa(hue, 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, r + 0.5, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = C.spec;
      ctx.beginPath(); ctx.arc(p.x - r * 0.28, p.y - r * 0.3, r * 0.34, 0, TAU); ctx.fill();
    } else if (sState === 'declared') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = C.void;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = hexa(hue, C.glow ? 0.42 : 0.62); ctx.lineWidth = Math.max(1, r * (C.glow ? 0.17 : 0.20));
      ctx.setLineDash([Math.max(2, r * 0.5), Math.max(2, r * 0.44)]);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = C.innerRim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, r - 1.6), 0, TAU); ctx.stroke();
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = C.voidFault;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = hexa(C.faultCss, 0.95); ctx.lineWidth = Math.max(1.1, r * 0.2);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = hexa(C.faultCss, 0.3); ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.4, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = hexa(C.faultCss, 0.8); ctx.lineWidth = Math.max(1, r * 0.16);
      ctx.beginPath(); ctx.moveTo(p.x - r * 0.5, p.y + r * 0.5); ctx.lineTo(p.x + r * 0.5, p.y - r * 0.5); ctx.stroke();
    }

    if (n.errBase || n.errorCount) {
      const a2 = -0.78, px = p.x + Math.cos(a2) * (r + 1.5), py = p.y + Math.sin(a2) * (r + 1.5);
      ctx.fillStyle = C.pipRim; ctx.beginPath(); ctx.arc(px, py, 3.1, 0, TAU); ctx.fill();
      ctx.fillStyle = C.faultCss; ctx.beginPath(); ctx.arc(px, py, 2.1, 0, TAU); ctx.fill();
    }
    if (n.id === sel) {
      ctx.strokeStyle = C.selRing; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 5, 0, TAU); ctx.stroke();
      ctx.strokeStyle = C.halo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 9.5, 0, TAU); ctx.stroke();
    } else if (isNb(n.id)) {
      ctx.strokeStyle = C.nbRing; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.4, 0, TAU); ctx.stroke();
    }
    if (n.id === hov && n.id !== sel) {
      ctx.strokeStyle = C.hoverRing; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, TAU); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
};

/**
 * Host bounding boxes (infra only). Drawn BEFORE nodes so members sit on
 * top of their box. Returns the drawn label chips as
 * [{ hostId, rect: [x, y, w, 16] }] so the shell can hit-test them without
 * the design's _box mutation on the host node.
 */
export const drawHosts = (ctx, model, C = canvasTokens(model.theme)) => {
  const W = model.width, k = model.k || 1;
  const byId = {};
  model.nodes.forEach((n) => { byId[n.id] = n; });
  const groups = {};
  model.nodes.forEach((n) => { if (n.host) (groups[n.host] = groups[n.host] || []).push(n); });
  const boxes = [];
  Object.keys(groups).forEach((hid) => {
    const arr = groups[hid], h = byId[hid];
    if (!h) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    arr.forEach((n) => {
      const p = n, r = n.r * k * (p.s == null ? 1 : p.s) + 15;
      x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r);
      y0 = Math.min(y0, p.y - r); y1 = Math.max(y1, p.y + r);
    });
    boxes.push({ h, hid, x0, y0: y0 - 6, x1, y1 });
  });
  boxes.sort((a, b) => a.x0 - b.x0);
  const rr = 12;
  ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  boxes.forEach((b) => {
    const sel = model.selectedId === b.hid;
    ctx.fillStyle = sel ? C.hostFillSel : C.hostFill;
    ctx.strokeStyle = sel ? C.hostStrokeSel : C.hostStroke;
    const x0 = b.x0, y0 = b.y0, x1 = b.x1, y1 = b.y1;
    ctx.beginPath();
    ctx.moveTo(x0 + rr, y0); ctx.lineTo(x1 - rr, y0); ctx.quadraticCurveTo(x1, y0, x1, y0 + rr);
    ctx.lineTo(x1, y1 - rr); ctx.quadraticCurveTo(x1, y1, x1 - rr, y1);
    ctx.lineTo(x0 + rr, y1); ctx.quadraticCurveTo(x0, y1, x0, y1 - rr);
    ctx.lineTo(x0, y0 + rr); ctx.quadraticCurveTo(x0, y0, x0 + rr, y0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.font = "500 10px 'IBM Plex Mono', monospace";
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const placed = [];
  const overlaps = (r, ax0, ay0, ax1, ay1, m) =>
    r[0] < ax1 + m && r[0] + r[2] > ax0 - m && r[1] < ay1 + m && r[1] + r[3] > ay0 - m;
  const chips = [];
  boxes.forEach((b) => {
    const sel = model.selectedId === b.hid;
    const w = ctx.measureText(b.h.name).width + 14;
    let x = b.x0;
    if (x + w > W - 8) x = Math.max(4, W - 8 - w);
    let y = b.y0 - 20, tries = 0, rect = [x, y, w, 16];
    while (tries++ < 12) {
      const clash = placed.some((p) => overlaps(rect, p[0], p[1], p[0] + p[2], p[1] + p[3], 4)) ||
        boxes.some((o) => o !== b && overlaps(rect, o.x0, o.y0, o.x1, o.y1, 0));
      if (!clash) break;
      y -= 18; rect = [x, y, w, 16];
    }
    placed.push(rect);
    ctx.fillStyle = C.hostChip;
    ctx.fillRect(rect[0], rect[1], w, 16);
    ctx.strokeStyle = sel ? C.hostStrokeSel : C.hostStroke;
    ctx.strokeRect(rect[0] + 0.5, rect[1] + 0.5, w - 1, 15);
    ctx.fillStyle = sel ? C.hostLabelSel : C.hostLabel;
    ctx.fillText(b.h.name, rect[0] + 7, rect[1] + 8.5);
    chips.push({ hostId: b.hid, rect });
  });
  return chips;
};
