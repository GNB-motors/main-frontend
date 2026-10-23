import { useCallback, useEffect, useMemo, useRef } from 'react';
import { nextNavTarget } from '../graphSelection';

const DRAWER_KINDS = [
  'module',
  'model',
  'job',
  'host',
  'store',
  'collection',
  'table',
  'pipe',
  'source',
  'surface',
];

/* LemuGraphTab's selection and filter handlers: kind/state toggles, node
   and table selection, keyboard navigation, clearing, the auto-hop and the
   drawer's isolate hook. */
export const useGraphHandlers = ({
  onSelectNode,
  selectedNodeId,
  isolateRef,
  visible,
  focusRef,
  searchRef,
  setSearchParams,
  setHiddenKinds,
  setOffStates,
  setPathTarget,
  setQuery,
  setFocusMatches,
  setHopDepth,
}) => {
  /* dagSafe existed for the retired DAG-mode layout engine, which threw on
     cycles. The raw-canvas renderer pins the infra layer to columns in its own sim
     (kgLayout) and never builds a DAG, so the cycle probe is gone with it. */

  const toggleKind = useCallback(
    (kind) => {
      setHiddenKinds((prev) => {
        const next = new Set(prev);
        if (next.has(kind)) next.delete(kind);
        else next.add(kind);
        return next;
      });
    },
    [setHiddenKinds],
  );

  const showAllKinds = useCallback(() => setHiddenKinds(new Set()), [setHiddenKinds]);

  /* Task 9 STATE chips: plain visibility toggles, unlike the INFRA status
     rail's dim-the-others semantics above. */
  const toggleStateOff = useCallback(
    (state) => {
      setOffStates((prev) => {
        const next = new Set(prev);
        if (next.has(state)) next.delete(state);
        else next.add(state);
        return next;
      });
    },
    [setOffStates],
  );

  /* KgCanvas fits explicitly — first graph load and layer switch, both
     internal to the shell — so the old renderer's fit latch (auto-fit on
     engine stop) has no consumer left and is gone. */

  /* The drawer resolves module/model/job ids plus every INFRA kind. Mounts
     and routes have no drawer view, so the canvas focuses the camera instead
     of opening an empty panel (its handleClick does the camera work after
     this fires). */
  const handleNodeClick = useCallback(
    (node, event) => {
      /* Shift-click sets the path-finding target instead of moving the
         selection — the two endpoints stay independently visible. Any node
         kind can be a target (mounts and routes included): the question is
         about connection, not drawer eligibility. */
      if (event?.shiftKey) {
        setPathTarget(node.id);
        return;
      }
      if (DRAWER_KINDS.includes(node.kind)) onSelectNode?.(node.id);
    },
    [onSelectNode, setPathTarget],
  );

  const nodeById = useMemo(() => new Map(visible.nodes.map((n) => [n.id, n])), [visible.nodes]);

  /* Table rows address nodes by id (spec: the Name button calls
     onSelectNode(node.id)); resolve back to the node object and run the SAME
     handler a sphere click uses, so drawer gating is identical in both views. */
  const handleTableSelect = useCallback(
    (id) => {
      const node = nodeById.get(id);
      if (node) handleNodeClick(node);
    },
    [nodeById, handleNodeClick],
  );

  /* Arrow-key selection (plan Task 10): moves through the selected node's
     neighbours (graphSelection.nextNavTarget), Right/Down next, Left/Up previous,
     wrapping. The cursor ref keeps "next" stable across repeated presses —
     without it, recomputing the neighbour step after every jump would ping-pong
     between two nodes. Any selection change from another control (click,
     table, hop filter) resets the cursor on the next press. With nothing
     selected, the first visible node is selected. */
  const navCursor = useRef({ anchor: null, ids: [], index: -1 });
  const selectViaKeyboard = useCallback(
    (node) => {
      if (!node) return;
      handleNodeClick(node);
      focusRef.current?.(node); // camera follows, same flight as a node click
    },
    [handleNodeClick, focusRef],
  );
  const moveSelection = useCallback(
    (dir) => {
      if (!visible.nodes.length) return;
      if (!selectedNodeId) {
        navCursor.current = { anchor: null, ids: [], index: -1 };
        selectViaKeyboard(visible.nodes[0]);
        return;
      }
      const next = nextNavTarget(navCursor.current, selectedNodeId, visible.links, dir);
      if (!next) return;
      navCursor.current = next.cursor;
      selectViaKeyboard(nodeById.get(next.id));
    },
    [visible, selectedNodeId, nodeById, selectViaKeyboard],
  );

  /* Canvas keyboard shortcuts, split between owner and shell. KgCanvas
     handles '/', Escape, 1–4/0 hops and 'f' fit (they are canvas-local: it
     calls back through onFocusSearch/onClearSelection/onHopDepth). The tab
     keeps Enter and arrow-key navigation, which move the SELECTION through
     the visible graph and need tab state. Events bubble up from the
     focusable canvas container; anything typed into an input/select/
     textarea is left alone by both handlers. */
  const handleCanvasKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case 'Enter': {
          const node = nodeById.get(selectedNodeId);
          if (node) {
            e.preventDefault();
            handleNodeClick(node);
          }
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          moveSelection(e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
          break;
        }
        default:
          break;
      }
    },
    [nodeById, selectedNodeId, handleNodeClick, moveSelection],
  );

  /* Esc / click-empty-space, reported by the canvas shell: path finding
     clears first (it is the ephemeral analysis); the selection itself is
     URL state — deleting the `node` param clears it and closes the drawer
     (LemuLogsPage syncs selection FROM the URL, same mechanism closeDrawer
     uses). */
  const handleClearSelection = useCallback(() => {
    setPathTarget(null);
    if (!selectedNodeId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('node');
        return next;
      },
      { replace: true },
    );
  }, [selectedNodeId, setSearchParams, setPathTarget]);

  /* Rail CLEAR (design onClearSel): query, focus, hop collapse, path
     target and the selection itself all reset in one gesture. */
  const handleClear = useCallback(() => {
    setQuery('');
    setFocusMatches(false);
    setHopDepth('all');
    setPathTarget(null);
    if (!selectedNodeId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('node');
        return next;
      },
      { replace: true },
    );
  }, [selectedNodeId, setSearchParams, setFocusMatches, setHopDepth, setPathTarget, setQuery]);

  /* The hairball cure (design select()): KgCanvas reports that a node was
   * selected while hop was 'all'; the tab owns hop state and collapses it. */
  const handleAutoHop = useCallback((h) => setHopDepth(h), [setHopDepth]);

  /* ISOLATE 1 HOP (drawer action): the page reaches the tab's hop state
     through this ref — isolating IS the hop collapse, depth 1 around the
     already-selected node (the pre-redesign drawer's behaviour). */
  useEffect(() => {
    if (!isolateRef) return undefined;
    isolateRef.current = (id) => {
      if (id) setHopDepth(1);
    };
    return () => {
      isolateRef.current = null;
    };
  }, [isolateRef, setHopDepth]);

  const handleFocusSearch = useCallback(() => searchRef.current?.focus(), [searchRef]);

  return {
    toggleKind,
    showAllKinds,
    toggleStateOff,
    handleNodeClick,
    nodeById,
    handleTableSelect,
    handleCanvasKeyDown,
    handleClearSelection,
    handleClear,
    handleAutoHop,
    handleFocusSearch,
  };
};
