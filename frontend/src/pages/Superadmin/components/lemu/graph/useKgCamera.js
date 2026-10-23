import { useCallback, useEffect } from 'react';
import { fitView } from './kgProject';

/* KgCanvas camera handlers: fit, fly-to-node and snapshot, published to the
   tab through fitRef/focusRef/snapshotRef plus the instanceRef probe. Reads
   and writes only the refs KgCanvas owns. */
export const useKgCamera = ({
  canvasRef,
  camRef,
  flightRef,
  dimsRef,
  simRef,
  fittedRef,
  projOfRef,
  reducedRef,
  propsRef,
  fitRef,
  focusRef,
  snapshotRef,
  instanceRef,
}) => {
  const requestFit = useCallback(
    (instant) => {
      const { width: W, height: H } = dimsRef.current;
      const sim = simRef.current;
      const pr = propsRef.current;
      if (!sim.nodes.length || !W) return false;
      const cam = camRef.current;
      const r = fitView(sim.nodes, cam, {
        width: W,
        height: H,
        drawerOpen: pr.drawerOpen,
        is3d: pr.is3d,
        motion: pr.motion,
        reduced: reducedRef.current,
        instant,
        now: performance.now(),
      });
      if (!r) return false;
      if (r.flight) flightRef.current = r.flight;
      else {
        cam.k = r.target.k;
        cam.tx = r.target.tx;
        cam.ty = r.target.ty;
        flightRef.current = null;
      }
      return true;
    },
    [camRef, dimsRef, flightRef, propsRef, reducedRef, simRef],
  );

  /* First fit is gated on knowing the viewport size, which arrives
     asynchronously (ResizeObserver) — possibly AFTER the graph-prep effect
     ran. Both paths call here; whoever finds nodes + dims first wins. */
  const maybeFit = useCallback(
    (instant) => {
      if (fittedRef.current || !simRef.current.nodes.length || !dimsRef.current.width) return;
      fittedRef.current = true;
      requestFit(instant);
    },
    [requestFit, dimsRef, fittedRef, simRef],
  );

  /* The Fit button lives one level up; publish the handler the same way the
     old wrapper did. `f` calls the same path from the keyboard handler. */
  useEffect(() => {
    if (fitRef) fitRef.current = () => requestFit(false);
  }, [fitRef, requestFit]);

  /* Camera flight to a node, for the tab's keyboard/table navigation. Same
     discipline as the old wrapper: instant when motion is off or reduced. */
  const flyToNode = useCallback(
    (node) => {
      const { width: W, height: H } = dimsRef.current;
      const cam = camRef.current;
      if (!node || !W || !H) return;
      const k = Math.min(2.6, Math.max(1.2, cam.k));
      const target = { k, tx: W / 2 - (node.x || 0) * k, ty: H / 2 - (node.y || 0) * k };
      if (!propsRef.current.motion || reducedRef.current) {
        cam.k = target.k;
        cam.tx = target.tx;
        cam.ty = target.ty;
        flightRef.current = null;
        return;
      }
      flightRef.current = {
        from: { k: cam.k, tx: cam.tx, ty: cam.ty },
        to: target,
        t0: performance.now(),
        dur: 900,
      };
    },
    [camRef, dimsRef, flightRef, propsRef, reducedRef],
  );
  useEffect(() => {
    if (focusRef) focusRef.current = flyToNode;
  }, [focusRef, flyToNode]);

  /* Snapshot: the canvas is untainted (no cross-origin content), so toDataURL
     works and an incident-report capture is one <a download> away. */
  const takeSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lemu-graph-${propsRef.current.layer}-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [canvasRef, propsRef]);
  useEffect(() => {
    if (snapshotRef) snapshotRef.current = takeSnapshot;
  }, [snapshotRef, takeSnapshot]);

  /* Probe handle, same contract shape as the old wrapper's instanceRef:
     parents (and the headless probe) reach graph data and coordinates
     without the canvas growing a prop per query. */
  useEffect(() => {
    if (!instanceRef) return undefined;
    instanceRef.current = {
      graph: () => propsRef.current.graph,
      cam: () => camRef.current,
      screenOf: (id) => {
        const p = projOfRef.current.get(id);
        return p ? { x: p.x, y: p.y, s: p.s } : null;
      },
    };
    return () => {
      if (instanceRef.current && instanceRef.current.graph) instanceRef.current = null;
    };
  }, [instanceRef, camRef, projOfRef, propsRef]);

  return { requestFit, maybeFit };
};
