import { canvasTokens } from './graphTheme';

/**
 * Host bounding boxes (infra only). Drawn BEFORE nodes so members sit on
 * top of their box. Returns the drawn label chips as
 * [{ hostId, rect: [x, y, w, 16] }] so the shell can hit-test them without
 * the design's _box mutation on the host node.
 */
export const drawHosts = (ctx, model, C = canvasTokens(model.theme)) => {
  const W = model.width,
    k = model.k || 1;
  const byId = {};
  model.nodes.forEach((n) => {
    byId[n.id] = n;
  });
  const groups = {};
  model.nodes.forEach((n) => {
    if (n.host) (groups[n.host] = groups[n.host] || []).push(n);
  });
  const boxes = [];
  Object.keys(groups).forEach((hid) => {
    const arr = groups[hid],
      h = byId[hid];
    if (!h) return;
    let x0 = 1e9,
      y0 = 1e9,
      x1 = -1e9,
      y1 = -1e9;
    arr.forEach((n) => {
      const p = n,
        r = n.r * k * (p.s == null ? 1 : p.s) + 15;
      x0 = Math.min(x0, p.x - r);
      x1 = Math.max(x1, p.x + r);
      y0 = Math.min(y0, p.y - r);
      y1 = Math.max(y1, p.y + r);
    });
    boxes.push({ h, hid, x0, y0: y0 - 6, x1, y1 });
  });
  boxes.sort((a, b) => a.x0 - b.x0);
  const rr = 12;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  boxes.forEach((b) => {
    const sel = model.selectedId === b.hid;
    ctx.fillStyle = sel ? C.hostFillSel : C.hostFill;
    ctx.strokeStyle = sel ? C.hostStrokeSel : C.hostStroke;
    const x0 = b.x0,
      y0 = b.y0,
      x1 = b.x1,
      y1 = b.y1;
    ctx.beginPath();
    ctx.moveTo(x0 + rr, y0);
    ctx.lineTo(x1 - rr, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + rr);
    ctx.lineTo(x1, y1 - rr);
    ctx.quadraticCurveTo(x1, y1, x1 - rr, y1);
    ctx.lineTo(x0 + rr, y1);
    ctx.quadraticCurveTo(x0, y1, x0, y1 - rr);
    ctx.lineTo(x0, y0 + rr);
    ctx.quadraticCurveTo(x0, y0, x0 + rr, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.font = "500 10px 'IBM Plex Mono', monospace";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const placed = [];
  const overlaps = (r, ax0, ay0, ax1, ay1, m) =>
    r[0] < ax1 + m && r[0] + r[2] > ax0 - m && r[1] < ay1 + m && r[1] + r[3] > ay0 - m;
  const chips = [];
  boxes.forEach((b) => {
    const sel = model.selectedId === b.hid;
    const w = ctx.measureText(b.h.name).width + 14;
    let x = b.x0;
    if (x + w > W - 8) x = Math.max(4, W - 8 - w);
    let y = b.y0 - 20,
      tries = 0,
      rect = [x, y, w, 16];
    while (tries++ < 12) {
      const clash =
        placed.some((p) => overlaps(rect, p[0], p[1], p[0] + p[2], p[1] + p[3], 4)) ||
        boxes.some((o) => o !== b && overlaps(rect, o.x0, o.y0, o.x1, o.y1, 0));
      if (!clash) break;
      y -= 18;
      rect = [x, y, w, 16];
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
