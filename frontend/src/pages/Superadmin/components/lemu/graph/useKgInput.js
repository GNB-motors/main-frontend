import { useCallback, useEffect, useRef } from 'react';
import { clampPitch } from './kgProject';
import { kindHue } from './graphTheme';
import { pickNode, pickHostChip } from './kgPick';
import { shouldCaptureSpace, isSpaceKey, SPACE_PAN_CURSORS } from './spacePan';
import { hoverMeta } from './kgPrep';

const HIDE_TIP = { show: false, x: 0, y: 0, color: '#fff', name: '', meta: '' };

/* KgCanvas input: Space+drag panning, pointer picking/dragging/hover and
   the canvas-local keyboard shortcuts. Returns the handlers KgCanvas binds;
   like the originals they are recreated every render and read current
   props through propsRef. */
export const useKgInput = ({
  canvasRef,
  camRef,
  simRef,
  alphaRef,
  projOfRef,
  hostByIdRef,
  chipsRef,
  hoverRef,
  tipAtRef,
  dragRef,
  propsRef,
  requestFit,
}) => {
  /* ---------- Space+drag panning (design-tool convention) ----------
     While Space is held, ANY pointer drag pans the camera — node-drag is
     suspended (space-pan wins) — and the canvas shows grab/grabbing. The
     window listeners ignore Space when the event target is interactive
     (inputs, buttons, links, contentEditable) so typing and button
     activation keep working; preventDefault on capture stops the page from
     scrolling on Space. Released (or window blur) restores normal mode. */
  const spaceRef = useRef(false);

  const updateCursor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = spaceRef.current
      ? dragRef.current
        ? SPACE_PAN_CURSORS.dragging
        : SPACE_PAN_CURSORS.ready
      : '';
  }, [canvasRef, dragRef]);

  useEffect(() => {
    const down = (e) => {
      if (!isSpaceKey(e.key) || !shouldCaptureSpace(e.target)) return;
      e.preventDefault(); // Space must not scroll the page
      if (e.repeat) return;
      spaceRef.current = true;
      updateCursor();
    };
    const up = (e) => {
      if (!isSpaceKey(e.key)) return;
      if (spaceRef.current) e.preventDefault();
      spaceRef.current = false;
      updateCursor();
    };
    const blur = () => {
      spaceRef.current = false;
      updateCursor();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [updateCursor]);

  /* ---------- pointer ---------- */
  const toLocal = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const pickAt = (mx, my) => {
    const hostId = pickHostChip(chipsRef.current, mx, my);
    if (hostId) return { node: hostByIdRef.current.get(hostId) || null, hostId };
    const n = pickNode(
      simRef.current.nodes,
      (x) => projOfRef.current.get(x.id),
      mx,
      my,
      camRef.current.k,
    );
    return { node: n, hostId: null };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const [mx, my] = toLocal(e);
    const cam = camRef.current;
    if (spaceRef.current) {
      /* Space-pan wins over node-drag: an empty pan drag, never a click. */
      dragRef.current = {
        space: true,
        n: null,
        hostId: null,
        mx,
        my,
        moved: true,
        shift: e.shiftKey,
        ox: cam.tx,
        oy: cam.ty,
        yaw: cam.yaw,
        pitch: cam.pitch,
      };
      canvasRef.current.setPointerCapture(e.pointerId);
      updateCursor();
      return;
    }
    const { node } = pickAt(mx, my);
    dragRef.current = {
      n: node && node.kind !== 'host' ? node : null,
      hostId: node && node.kind === 'host' ? node.id : null,
      mx,
      my,
      moved: false,
      shift: e.shiftKey,
      ox: cam.tx,
      oy: cam.ty,
      yaw: cam.yaw,
      pitch: cam.pitch,
    };
    if (dragRef.current.n) {
      dragRef.current.n.fixed = true;
      alphaRef.current = Math.max(alphaRef.current, 0.45);
    }
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const pr = propsRef.current;
    const [mx, my] = toLocal(e);
    const d = dragRef.current;
    if (d) {
      const dx = mx - d.mx,
        dy = my - d.my;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.space) {
        /* Space-pan: translate the camera in BOTH 2D and 3D (a pan of the
           projected view — never an orbit). */
        const cam = camRef.current;
        cam.tx = d.ox + dx;
        cam.ty = d.oy + dy;
        return;
      }
      if (d.n) {
        const cam = camRef.current;
        if (!pr.is3d) {
          d.n.x = (mx - cam.tx) / cam.k;
          d.n.y = (my - cam.ty) / cam.k;
        } else {
          d.n.x += (dx * 0.9) / cam.k;
          d.n.y += (dy * 0.9) / cam.k;
          d.mx = mx;
          d.my = my;
        }
        d.n.vx = 0;
        d.n.vy = 0;
        d.n.vz = 0;
        alphaRef.current = Math.max(alphaRef.current, 0.35);
        /* A tooltip glued to a node under the pointer is noise mid-drag. */
        if (hoverRef.current) {
          hoverRef.current = null;
          pr.onHover && pr.onHover(HIDE_TIP);
        }
      } else if (pr.is3d) {
        const cam = camRef.current;
        cam.yaw = d.yaw + dx * 0.006;
        cam.pitch = clampPitch(d.pitch + dy * 0.005);
      } else {
        const cam = camRef.current;
        cam.tx = d.ox + dx;
        cam.ty = d.oy + dy;
      }
      return;
    }
    const { node } = pickAt(mx, my);
    const id = node ? node.id : null;
    const t = tipAtRef.current;
    if (id !== hoverRef.current || (node && (Math.abs(mx - t.x) > 2 || Math.abs(my - t.y) > 2))) {
      hoverRef.current = id;
      tipAtRef.current = { id, x: mx, y: my };
      if (!node) {
        pr.onHover && pr.onHover(HIDE_TIP);
      } else {
        pr.onHover &&
          pr.onHover({
            show: true,
            x: mx + 52,
            y: my + 44,
            color: kindHue(node.kind, pr.theme) || '#94a3b8',
            name: node.name || node.id,
            meta: hoverMeta(node),
          });
      }
    }
  };

  const handlePointerUp = (e) => {
    const pr = propsRef.current;
    const d = dragRef.current;
    dragRef.current = null;
    updateCursor();
    if (!d) return;
    if (d.n) d.n.fixed = false;
    if (d.moved) return;
    const evt = { shiftKey: d.shift, pointerType: e.pointerType };
    if (d.n) {
      pr.onSelect && pr.onSelect(d.n, evt);
      /* The hairball cure (design select(), ~line 893): selecting a node
         while hop is 'all' collapses the view to 2 hops around it. The tab
         owns hop state; we only notify. */
      if (pr.hopDepth === 'all') pr.onAutoHop && pr.onAutoHop(2);
    } else if (d.hostId) {
      const host = hostByIdRef.current.get(d.hostId);
      if (host) {
        pr.onSelect && pr.onSelect(host, evt);
        if (pr.hopDepth === 'all') pr.onAutoHop && pr.onAutoHop(2);
      }
    } else {
      pr.onClearSelection && pr.onClearSelection();
    }
  };

  const handlePointerLeave = () => {
    const pr = propsRef.current;
    if (dragRef.current) return; // pointer capture keeps events flowing mid-drag
    hoverRef.current = null;
    tipAtRef.current = { id: null, x: -1, y: -1 };
    pr.onHover && pr.onHover(HIDE_TIP);
  };

  /* ---------- keyboard (the container owns focus) ---------- */
  const handleKeyDown = (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const pr = propsRef.current;
    switch (e.key) {
      case '/':
        e.preventDefault();
        pr.onFocusSearch && pr.onFocusSearch();
        return;
      case 'Escape':
        e.preventDefault();
        hoverRef.current = null;
        tipAtRef.current = { id: null, x: -1, y: -1 };
        pr.onHover && pr.onHover(HIDE_TIP);
        pr.onClearSelection && pr.onClearSelection();
        return;
      case '1':
      case '2':
      case '3':
      case '4':
        if (pr.selectedNodeId) {
          e.preventDefault();
          pr.onHopDepth && pr.onHopDepth(Number(e.key));
        }
        return;
      case '0':
        if (pr.selectedNodeId) {
          e.preventDefault();
          pr.onHopDepth && pr.onHopDepth('all');
        }
        return;
      case 'f':
      case 'F':
        e.preventDefault();
        requestFit(false);
        return;
      default:
        return;
    }
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleKeyDown,
  };
};
