import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DARK, hexa, kindHue } from './graphTheme';
import { rowState, scaleOf, evidenceAt, stamp, hopDistances, sortNodes } from './kgTable';

/* The keyboard equivalent of the canvas (plan Task 11): a sortable,
   keyboard-navigable table over the SAME filtered `visible` graph the canvas
   renders. Column layout, state ordering, row markers and shortcuts follow
   the design (table block ~line 88, sort logic ~line 1362) with real payload
   fields only (§0): STATE/SCALE/EVIDENCE come from kgTable.js, which returns
   null where the payload has nothing — this component renders '—', never a
   substitute. */

const nf = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

const COLS = [
  { key: 'name', label: 'NODE' },
  { key: 'kind', label: 'KIND' },
  { key: 'state', label: 'STATE' },
  { key: 'scale', label: 'SCALE', align: 'right' },
  { key: 'err', label: 'ERR', align: 'right' },
  { key: 'ev', label: 'EVIDENCE @' },
  { key: 'hop', label: 'HOP', align: 'right' },
];

/* stTone (design line ~1386): measured ok, declared sunk/dashed hollow,
   unreachable fault. */
const STATE_TONE = {
  measured: { background: DARK.okBg, color: DARK.okT, border: `1px solid ${DARK.okBd}` },
  declared: { background: DARK.sunk, color: DARK.t3, border: `1px dashed ${DARK.hollow2}` },
  unreachable: { background: DARK.faultBg, color: DARK.faultT, border: `1px solid ${DARK.faultBd}` },
};

/* Row left marker: diagonal hatch for declared, solid fault for
   unreachable, transparent for measured (design line ~1410). */
const markerFor = (s) => {
  if (s === 'declared') return `repeating-linear-gradient(135deg, ${DARK.hollow2} 0 2px, transparent 2px 5px)`;
  if (s === 'unreachable') return DARK.fault;
  return 'transparent';
};

/* The 9px state dot: measured = kind hue with glow; declared = empty on
   purpose (never the hue); unreachable = voidFault with a fault ring. */
const dotFor = (node, s, hue) => {
  if (s === 'measured') {
    return { background: hue, border: 'none', boxShadow: `0 0 7px ${hexa(hue, 0.6)}` };
  }
  if (s === 'unreachable') {
    return { background: DARK.voidFault, border: `1.5px solid ${DARK.fault}`, boxShadow: 'none' };
  }
  return { background: DARK.void, border: `1.5px dashed ${hexa(hue, 0.6)}`, boxShadow: 'none' };
};

const LemuGraphTable = ({
  graph,
  onSelectNode,
  selectedNodeId = null,
  totalCount,
  measuredAt = null,
  onFocusSearch,
  onClear,
  onHopDepth,
  theme = 'dark',
}) => {
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const hops = useMemo(
    () => hopDistances(graph.links, selectedNodeId),
    [graph.links, selectedNodeId],
  );

  /* State sorts attention to the top: ascending STATE order is
     unreachable -> declared -> measured (kgTable.STATE_ORDER). Clicking the
     active column flips direction; a new column starts ascending. */
  const rows = useMemo(
    () => sortNodes(graph.nodes, sort.key, sort.dir, { measuredAt, hops }),
    [graph.nodes, sort, measuredAt, hops],
  );

  /* The active row follows an outside selection (e.g. a deep link) and
     stays in range when filters shrink the list. */
  useEffect(() => {
    if (selectedNodeId) {
      const i = rows.findIndex((n) => n.id === selectedNodeId);
      if (i >= 0) setActiveIndex(i);
    }
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setActiveIndex((i) => Math.max(0, Math.min(rows.length - 1, i)));
  }, [rows.length]);

  /* Scroll-into-view with the design's rowH = 29 (moveRow, line ~1242). */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const rowH = 29;
    const top = activeIndex * rowH;
    const vh = el.clientHeight - 34;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + rowH > el.scrollTop + vh) el.scrollTop = top + rowH - vh;
  }, [activeIndex]);

  const moveActive = useCallback(
    (delta) => {
      if (!rows.length) return;
      setActiveIndex((i) => Math.max(0, Math.min(rows.length - 1, i + delta)));
    },
    [rows.length],
  );

  const selectRow = useCallback(
    (index) => {
      const node = rows[index];
      if (node) onSelectNode?.(node.id);
    },
    [rows, onSelectNode],
  );

  const handleKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveActive(1);
          return;
        case 'ArrowUp':
          e.preventDefault();
          moveActive(-1);
          return;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          return;
        case 'End':
          e.preventDefault();
          setActiveIndex(Math.max(0, rows.length - 1));
          return;
        case 'Enter':
          e.preventDefault();
          selectRow(activeIndex);
          return;
        case '/':
          if (onFocusSearch) { e.preventDefault(); onFocusSearch(); }
          return;
        case 'Escape':
          if (onClear) { e.preventDefault(); onClear(); }
          return;
        case '1':
        case '2':
        case '3':
        case '4':
          if (selectedNodeId && onHopDepth) {
            e.preventDefault();
            onHopDepth(Number(e.key));
          }
          return;
        case '0':
          if (selectedNodeId && onHopDepth) {
            e.preventDefault();
            onHopDepth('all');
          }
          return;
        default:
      }
    },
    [moveActive, selectRow, activeIndex, selectedNodeId, onFocusSearch, onClear, onHopDepth],
  );

  const total = totalCount ?? rows.length;
  const kbd = { color: DARK.t4 };

  return (
    <div className="lemu-graph3d__table" role="region" aria-label="Knowledge graph table view">
      <div className="lemu-graph3d__table-strip">
        <div className="lemu-graph3d__table-title">TABLE VIEW</div>
        <div className="lemu-graph3d__table-shortcuts">
          keyboard equivalent of the canvas ·{' '}
          <span style={kbd}>&#8597;&#65039;</span> move · <span style={kbd}>&#8629;</span> open ·{' '}
          <span style={kbd}>/</span> search · <span style={kbd}>1-4</span> hops ·{' '}
          <span style={kbd}>esc</span> clear
        </div>
        <div className="lemu-graph3d__table-count">
          {nf(rows.length)} of {nf(total)} nodes
        </div>
      </div>
      <div
        ref={scrollRef}
        className="lemu-graph3d__table-scroll"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table>
          <caption className="lemu-graph3d__table-caption">Knowledge graph nodes</caption>
          <thead>
            <tr>
              <th scope="col" aria-hidden="true" className="lemu-graph3d__table-marker-head" />
              {COLS.map((c) => {
                const activeCol = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={activeCol ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}
                    style={{ textAlign: c.align || 'left', color: activeCol ? DARK.acText : DARK.t5 }}
                    onClick={() => setSort((p) => (p.key === c.key
                      ? { key: c.key, dir: -p.dir }
                      : { key: c.key, dir: 1 }))}
                  >
                    {c.label}{activeCol ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((node, i) => {
              const s = rowState(node);
              const tone = STATE_TONE[s] || STATE_TONE.declared;
              const hue = kindHue(node.kind, theme) || '#94a3b8';
              const active = i === activeIndex;
              const isSel = node.id === selectedNodeId;
              const scale = scaleOf(node);
              const ev = stamp(evidenceAt(node, measuredAt));
              const hop = hops.get(node.id);
              return (
                <tr
                  key={node.id}
                  onClick={() => { setActiveIndex(i); onSelectNode?.(node.id); }}
                  style={{
                    cursor: 'pointer',
                    background: isSel ? DARK.acBg2 : active ? DARK.f4 : 'transparent',
                    boxShadow: active ? `inset 0 0 0 1px ${DARK.acBd}` : 'none',
                  }}
                >
                  <td aria-hidden="true" style={{ padding: 0, width: 3, background: markerFor(s) }} />
                  <td style={{ borderBottom: `1px solid ${DARK.l2}` }}>
                    <div className="lemu-graph3d__table-node">
                      <span className="lemu-graph3d__table-dot" style={dotFor(node, s, hue)} />
                      <span style={{ fontFamily: 'var(--lg-mono)', fontSize: 11.5, color: s === 'declared' ? DARK.t4 : DARK.t2 }}>
                        {node.label || node.id}
                      </span>
                    </div>
                  </td>
                  <td style={{ borderBottom: `1px solid ${DARK.l2}`, fontFamily: 'var(--lg-mono)', fontSize: 10.5, color: hue }}>
                    {node.kind}
                  </td>
                  <td style={{ borderBottom: `1px solid ${DARK.l2}` }}>
                    <span style={{
                      fontFamily: 'var(--lg-mono)',
                      fontSize: 10,
                      letterSpacing: '.06em',
                      padding: '2px 7px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      background: tone.background,
                      color: tone.color,
                      border: tone.border,
                    }}
                    >
                      {s === 'declared' ? 'NO MEASUREMENT' : s.toUpperCase()}
                    </span>
                  </td>
                  <td
                    className="lemu-graph3d__table-num"
                    style={{
                      borderBottom: `1px solid ${DARK.l2}`,
                      color: s === 'measured' ? DARK.t3 : DARK.t6,
                    }}
                  >
                    {scale == null ? '—' : nf(scale)}
                  </td>
                  <td
                    className="lemu-graph3d__table-num"
                    style={{
                      borderBottom: `1px solid ${DARK.l2}`,
                      color: node.errorCount ? DARK.faultT : DARK.t6,
                    }}
                  >
                    {node.errorCount ? nf(node.errorCount) : '·'}
                  </td>
                  <td
                    className="lemu-graph3d__table-num"
                    style={{
                      borderBottom: `1px solid ${DARK.l2}`,
                      fontSize: 10.5,
                      color: ev ? DARK.t4 : DARK.t5,
                    }}
                  >
                    {ev || (s === 'declared' && node.state ? 'no row on record' : '—')}
                  </td>
                  <td
                    className="lemu-graph3d__table-num"
                    style={{ borderBottom: `1px solid ${DARK.l2}`, color: DARK.t5 }}
                  >
                    {hop == null ? '·' : hop}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={COLS.length + 1} className="lemu-graph3d__table-empty">
                  No nodes match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LemuGraphTable;
