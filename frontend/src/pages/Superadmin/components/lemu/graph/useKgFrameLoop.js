import { useCallback, useEffect } from 'react';
import { project, applyFlight, zoomAt } from './kgProject';
import { step, collide } from './kgLayout';
import { draw } from './kgDraw';
import { placeLabels, LABEL_FONT } from './kgLabels';
import { canvasTokens } from './graphTheme';
import { prepareSimGraph } from './kgPrep';
import { pullTowardCentre } from './incidentRank';
import logger from '../../../../../utils/logger';

/* KgCanvas render pipeline: graph preparation into the sim refs, the
   per-frame sim/project/draw/label pass, the RAF loop with its pump and
   generation guard, and canvas sizing. Everything it reads lives in the
   refs KgCanvas owns. */
export const useKgFrameLoop = ({
  graph,
  layer,
  mode,
  wrapRef,
  canvasRef,
  ctxRef,
  camRef,
  flightRef,
  dimsRef,
  simRef,
  alphaRef,
  sigRef,
  fittedRef,
  prevKeyRef,
  projOfRef,
  hostByIdRef,
  chipsRef,
  hoverRef,
  lastRef,
  loggedRef,
  reducedRef,
  propsRef,
  requestFit,
  maybeFit,
}) => {
  /* ---------- graph preparation ----------
     The shaping rules (seeding, radii, columns, draw/sim split, particle
     budget) live in kgPrep.prepareSimGraph; this effect only wires the
     results into the refs the frame loop reads and decides when to fit. */
  useEffect(() => {
    const prep = prepareSimGraph({ graph, layer, mode, prevKey: prevKeyRef.current });
    prevKeyRef.current = prep.key;
    const { layerChanged, simNodes } = prep;
    hostByIdRef.current = prep.hostById;

    if (prep.sig !== sigRef.current) {
      sigRef.current = prep.sig;
      alphaRef.current = 1;
    }
    simRef.current = {
      nodes: prep.simNodes,
      links: prep.simLinks,
      drawLinks: prep.drawLinks,
      drawNodes: prep.drawNodes,
    };

    /* Auto-fit: instantly on first graph load, with a flight on layer switch
       (the design's componentDidMount fitView(true) / syncFilters branch). */
    if (layerChanged) {
      if (simNodes.length && dimsRef.current.width) {
        fittedRef.current = true;
        requestFit(false);
      }
    } else {
      maybeFit(true);
    }
  }, [
    graph,
    layer,
    mode,
    requestFit,
    maybeFit,
    alphaRef,
    dimsRef,
    fittedRef,
    hostByIdRef,
    prevKeyRef,
    sigRef,
    simRef,
  ]);

  /* ---------- one frame: sim, project, draw, labels ---------- */
  const frame = useCallback(() => {
    const now = performance.now();
    lastRef.current = now;
    const ctx = ctxRef.current;
    const pr = propsRef.current;
    const { width: W, height: H, dpr: d } = dimsRef.current;
    if (!ctx || !W || !H) return;
    const cam = camRef.current;
    const is3d = pr.is3d;
    const sim = simRef.current;

    if (flightRef.current) {
      const r = applyFlight(flightRef.current, now);
      cam.k = r.k;
      cam.tx = r.tx;
      cam.ty = r.ty;
      if (r.done) flightRef.current = null;
    }

    if (alphaRef.current >= 0.004 && sim.nodes.length) {
      alphaRef.current = step(sim.nodes, sim.links, {
        layer: pr.layer,
        is3d,
        alpha: alphaRef.current,
      });
      collide(sim.nodes, { layer: pr.layer });
    }

    const projOf = projOfRef.current;
    for (let i = 0; i < sim.drawNodes.length; i++) {
      const e = sim.drawNodes[i];
      const p = project(e._n, cam, is3d);
      /* Incident gravity (I4): a ranked incident is pulled toward the viewport
         centre AFTER projection, so the draw pass, the pick map (projOf) and
         the label pass (same pull inside placeLabels) all agree on one
         position. The sim itself is untouched — the pull is presentational. */
      const u = pr.urgency && pr.urgency.get(e.id);
      if (u && u.pull) {
        const q = pullTowardCentre(p.x, p.y, u.pull, W, H);
        p.x = q.x;
        p.y = q.y;
      }
      e.x = p.x;
      e.y = p.y;
      e.s = p.s;
      e.d = p.d;
      projOf.set(e.id, p);
    }

    const chips =
      draw(ctx, {
        width: W,
        height: H,
        dpr: d,
        now,
        theme: pr.theme,
        layer: pr.layer,
        k: cam.k,
        mode3d: is3d,
        motion: pr.motion,
        reduced: reducedRef.current,
        focus: pr.focusMatches,
        query: pr.query,
        matches: pr.matches,
        selectedId: pr.selectedNodeId,
        hoverId: hoverRef.current,
        neighbours: pr.neighbours,
        urgency: pr.urgency,
        overlay: pr.overlay,
        nodes: sim.drawNodes,
        links: sim.drawLinks,
      }) || [];
    chipsRef.current = chips;

    const labels = placeLabels(sim.nodes, {
      layer: pr.layer,
      visibleCount: sim.nodes.length,
      cam,
      is3d,
      width: W,
      height: H,
      selId: pr.selectedNodeId,
      hoverId: hoverRef.current,
      neighbours: pr.neighbours,
      urgency: pr.urgency,
      query: pr.query,
      measureText: (t) => ctx.measureText(t),
    });
    const C = canvasTokens(pr.theme);
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      ctx.globalAlpha = l.alpha;
      ctx.fillStyle = C.labelBg;
      ctx.fillRect(l.box[0], l.box[1], l.box[2], l.box[3]);
      ctx.fillStyle = l.alpha >= 1 ? C.labelOn : C.labelOff;
      ctx.fillText(l.label, l.text[0], l.text[1]);
    }
    ctx.globalAlpha = 1;
  }, [
    alphaRef,
    camRef,
    chipsRef,
    ctxRef,
    dimsRef,
    flightRef,
    hoverRef,
    lastRef,
    projOfRef,
    propsRef,
    reducedRef,
    simRef,
  ]);

  /* ---------- canvas, RAF loop, pump, wheel ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    ctxRef.current = canvas.getContext('2d');

    const gen = (window.__kgGen = (window.__kgGen || 0) + 1);
    let raf = requestAnimationFrame(function loop() {
      if (gen !== window.__kgGen) return; // a newer loop owns the canvas
      try {
        frame();
      } catch (err) {
        if (!loggedRef.current) {
          loggedRef.current = true;
          logger.error('KgCanvas', err);
        }
      }
      raf = requestAnimationFrame(loop);
    });
    const pump = setInterval(() => {
      if (gen !== window.__kgGen) {
        clearInterval(pump);
        return;
      }
      if (performance.now() - lastRef.current > 260) frame();
    }, 200);

    /* Wheel must be anchored at the cursor AND preventDefault to stop the
       page scrolling — React attaches wheel passively, so bind natively. */
    const onWheel = (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(camRef.current, e.clientX - r.left, e.clientY - r.top, e.deltaY);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(pump);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [frame, camRef, canvasRef, ctxRef, lastRef, loggedRef]);

  /* ---------- sizing ---------- */
  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return undefined;
    const resize = () => {
      const r = el.getBoundingClientRect();
      const W = Math.max(320, r.width);
      const H = Math.max(420, r.height);
      const d = Math.min(2, window.devicePixelRatio || 1);
      dimsRef.current = { width: W, height: H, dpr: d };
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
    };
    resize();
    maybeFit(true);
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
    const ro = new ResizeObserver(() => {
      resize();
      maybeFit(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maybeFit, canvasRef, dimsRef, wrapRef]);
};
