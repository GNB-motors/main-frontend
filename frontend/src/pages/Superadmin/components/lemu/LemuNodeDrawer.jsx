import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { LemuService } from '../LemuService';
import { DARK, LIGHT, kindHue, hexa } from './graph/graphTheme';
import { upstreamNote, topoTraceLinks } from './graph/upstreamTrace';
import {
  nf,
  stampUTC,
  evidenceVariant,
  metricsRows,
  ownedFunctionRows,
  errorWindowLabel,
  mirrorPanel,
} from './graph/drawerModel';
import { fullRoutePath, relativeTime } from './utils';

/* The design's kgdrawer slide-in (220ms), injected so the drawer stays
   self-contained. Reduced motion honoured the same way the design does. */
const KGDRAWER_CSS = `
@keyframes kgdrawer{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.lemu-kgdrawer{animation:none !important}}
`;

const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

const INFRA_KINDS = ['host', 'store', 'collection', 'table', 'pipe', 'source', 'surface'];

/* State chip recipes, one per state — the same trio the canvas rings use. */
const STATE_TONE = (T) => ({
  measured: { bg: T.okBg, fg: T.okT, bd: `1px solid ${T.okBd}` },
  declared: { bg: T.sunk, fg: T.t3, bd: `1px dashed ${T.hollow2}` },
  unreachable: { bg: T.faultBg, fg: T.faultT, bd: `1px solid ${T.faultBd}` },
});

const LemuNodeDrawer = ({
  node, kind, pulseSeries, pulseStatus, edges, liveness, topology, errorAttribution, onSelectNode, onClose,
  /* Optional wiring, added with defaults so the existing page render site
     keeps working unchanged:
       onIsolate — collapses the graph to this node's 1-hop neighbourhood
         (the tab owns hop state; the page does not pass this yet, so the
         button hides until it does).
       theme     — Task 14 wires the app-level switch; the drawer follows
         the canvas default.
       contained — the standalone /superadmin/graph page renders the drawer
         inside its own position:relative wrapper; absolute positioning
         anchors it to that container (12px below the navbar through the
         wrapper geometry) instead of the fixed viewport offset. Defaults
         keep every existing render site on the fixed path. */
  onIsolate,
  theme = 'dark',
  contained = false,
}) => {
  const T = theme === 'light' ? LIGHT : DARK;
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [tracing, setTracing] = useState(false);
  const [rebuild, setRebuild] = useState('idle'); // idle|confirm|busy|done|error

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, [node, kind]);

  /* Focus trap + Escape (unchanged behaviour from the pre-redesign
     drawer). The r2 scrim below the drawer is pointer-transparent — the
     board stays interactive while the drawer is open. */
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return undefined;
    const focusable = () => Array.from(drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const elements = focusable();
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', handleKeyDown);
    return () => drawer.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const hue = kindHue(kind, theme) || '#94a3b8';
  const tone = STATE_TONE(T);

  /* INFRA rows carry state on the node itself; code-layer jobs pick their
     topology row up as _topo (the page resolves both). */
  const stateNode = node.state ? node : node._topo || null;
  const state = stateNode?.state || null;
  const st = state ? tone[state] || tone.declared : null;

  /* ── Header copy ── */
  const name = kind === 'route' ? `${node.method} ${fullRoutePath(node)}`
    : kind === 'model' ? node.modelName
      : kind === 'job' ? node.name
        /* An unresolved module (diff ghost, stale deep link) carries label
           + _id but no name — fall through so the header shows SOMETHING
           truthful rather than a blank. */
        : kind === 'module' ? (node.name || node.label || node._id)
          : node.label || node._id;
  const path = kind === 'module' ? (node._functions?.[0]?.file || '—')
    : kind === 'model' ? (node.collectionName || '—')
      : kind === 'route' ? fullRoutePath(node)
        : kind === 'job' ? (node.cronExpression || '—')
          : (node.declaredBy || '—');
  /* Host chip: INFRA names its hostId; code-layer nodes run on the API's
     own host, looked up from the topology self marker — never guessed. */
  const selfHost = (topology?.nodes || []).find((n) => n.kind === 'host' && n.self === true);
  const host = node.hostId ? node.hostId.replace(/^host:/, '')
    : INFRA_KINDS.includes(kind) ? 'unassigned'
      : (selfHost ? selfHost.label : '—');

  /* ── Metrics / evidence / mirror (pure builders — drawerModel.js) ── */
  const metrics = metricsRows(stateNode || node, kind, edges || [], {
    rel: relativeTime,
    manifestNode: node,
    latestPulse: Array.isArray(pulseSeries) ? pulseSeries[0] || {} : {},
    liveness,
    pulseStatus,
    jobHealth: pulseSeries?._health || {},
  });
  const ev = stateNode ? evidenceVariant(stateNode) : null;
  const mirror = INFRA_KINDS.includes(kind) ? mirrorPanel(node, topology, relativeTime) : null;

  /* ── Owned functions (module is the only kind with a real source) ── */
  const fnRows = kind === 'module' ? ownedFunctionRows(node._functions) : null;

  /* ── Attributed errors (existing prop shape; the join key is the same
     id the attribution service emits) ── */
  const graphKey = kind === 'route' ? (node._module ? `module:${node._module}` : null)
    : kind === 'model' ? `model:${node.modelName}`
      : kind === 'job' ? `job:${node.name}`
        : kind === 'module' ? `module:${node.name}`
          : INFRA_KINDS.includes(kind) ? node._id : null;
  const errorGroups = (errorAttribution?.groups || [])
    .filter((g) => g.nodeId === graphKey)
    .sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
  const windowLabel = errorWindowLabel(errorAttribution?.windowHours);
  const windowFrom = errorAttribution?.generatedAt
    ? stampUTC(new Date(new Date(errorAttribution.generatedAt).getTime() - (errorAttribution.windowHours || 720) * 3600 * 1000).toISOString()).replace(' UTC', '')
    : null;

  /* ── TRACE UPSTREAM — pure helpers over the layer's real edge set ── */
  const links = INFRA_KINDS.includes(kind) ? topoTraceLinks(topology?.edges) : (edges || []);
  const traceId = graphKey || node._id;
  const nameOf = (id) => (topology?.nodes || []).find((n) => n.id === id)?.label || id.replace(/^\w+:/, '');
  const TRACE_CAP = 8;
  const traceNote = tracing ? upstreamNote(traceId, links, TRACE_CAP, nameOf) : '';

  /* ── REBUILD MANIFEST (§0 C4) — a write, so it asks first ── */
  const canRebuild = typeof localStorage !== 'undefined' && localStorage.getItem('user_role') === 'SUPER_ADMIN';
  const onRebuildClick = async () => {
    if (rebuild === 'confirm') {
      setRebuild('busy');
      try {
        await LemuService.rebuildManifest();
        setRebuild('done');
      } catch {
        setRebuild('error');
      }
      return;
    }
    if (rebuild === 'idle' || rebuild === 'error') setRebuild('confirm');
  };

  /* ── Shared style fragments (design tokens verbatim via graphTheme) ── */
  const sectionTitle = {
    fontFamily: MONO, fontSize: 9.5, letterSpacing: '.14em', color: T.t5, margin: '0 0 7px',
  };
  const card = {
    border: `1px solid ${T.l5}`, borderRadius: 9, overflow: 'hidden', marginBottom: 16,
  };
  const chip = {
    fontFamily: MONO, fontSize: 10, letterSpacing: '.06em', padding: '3px 8px', borderRadius: 5,
  };
  const actionBtn = (active, activeBg, activeBd, activeFg) => ({
    flex: 1,
    border: `1px solid ${active ? activeBd : T.l10}`,
    background: active ? activeBg : 'transparent',
    color: active ? activeFg : T.t4,
    borderRadius: 7,
    padding: '7px 0',
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '.07em',
    cursor: 'pointer',
  });

  const glyphStyle = {
    width: 15, height: 15, borderRadius: '50%', flex: 'none', marginTop: 2,
    background: state === 'measured' ? hue : state === 'unreachable' ? T.voidFault : T.void,
    border: state === 'measured' ? 'none'
      : state === 'unreachable' ? `2px solid ${T.fault}` : `2px dashed ${hexa(hue, 0.6)}`,
    boxShadow: state === 'measured' ? `0 0 12px ${hexa(hue, 0.7)}`
      : state === 'unreachable' ? `0 0 0 3px ${T.faultBg}` : `inset 0 0 7px ${T.inset2}`,
  };

  const headBg = state === 'unreachable' ? `linear-gradient(180deg, ${T.faultBg2}, transparent)`
    : state === 'declared' ? `linear-gradient(180deg, ${T.hollow4}, transparent)`
      : `linear-gradient(180deg, ${hexa(hue, 0.09)}, transparent)`;

  const evTone = ev ? {
    ok: {
      border: `1px solid ${T.l7}`, bg: T.f1, divider: `1px solid ${T.l3}`,
      dot: T.ok, dotBd: 'none', titleFg: T.okT, tsFg: T.t4, queryFg: T.t3, valueFg: T.t2,
    },
    hollow: {
      border: `1px dashed ${T.hollow2}`, bg: T.sunk, divider: `1px dashed ${T.hollow3}`,
      dot: T.void, dotBd: `1.5px dashed ${T.hollow}`, titleFg: T.t3, tsFg: T.t5, queryFg: T.t4, valueFg: T.t5,
    },
    fault: {
      border: `1px solid ${T.faultBd}`, bg: T.faultBg2, divider: `1px solid ${T.faultBd2}`,
      dot: T.fault, dotBd: 'none', titleFg: T.faultT, tsFg: T.faultT, queryFg: T.faultT2, valueFg: T.faultT,
    },
  }[ev.tone] : null;

  const rebuildLabel = {
    idle: 'REBUILD MANIFEST',
    confirm: 'CONFIRM REBUILD',
    busy: 'REBUILDING…',
    done: 'REBUILD REQUESTED ✓',
    error: 'REBUILD FAILED — RETRY?',
  }[rebuild];

  return (
    <>
      <style>{KGDRAWER_CSS}</style>
      {/* The scrim is BLUR, not a paint blanket: backdrop-filter keeps the
          board visibly present behind the drawer and the tint is subtle and
          theme-appropriate (dark ≈ 32% black, light ≈ 28% white). It sits
          one z-step BELOW the drawer (45 vs 46) so the drawer stays fully
          crisp, and it never intercepts the pointer — clicking the blurred
          board still selects/switches nodes. `contained` mirrors the
          drawer's own positioning: absolute inside the graph page's relative
          wrapper, fixed over the viewport on the embedded LEMU page. The
          shared class (.lemu-drawer-scrim, LemuLogsPage.css) carries the
          blur treatment; the tint arrives as the --lemu-scrim var so both
          render sites stay theme-correct. */}
      <div
        className="lemu-drawer-scrim"
        aria-hidden="true"
        style={{
          '--lemu-scrim': theme === 'light' ? 'rgba(255,255,255,0.28)' : 'rgba(6,7,10,0.32)',
          position: contained ? 'absolute' : 'fixed',
        }}
      />
      <aside
        ref={drawerRef}
        className="lemu-drawer lemu-kgdrawer"
        role="dialog"
        aria-modal="false"
        aria-label={name}
        style={{
          /* The app header (SuperAdminNavbar) is a fixed 72px bar at
             z-index 1001 — top:12 would slide the drawer (and its close
             button) underneath it. --lemu-header-h is the measured value
             (LemuLogsPage.css / LemuGraphPage.css); the geometry is
             otherwise the plan's: 404px wide, right 12, bottom 44.
             On the standalone graph page the drawer is CONTAINED: its
             wrapper already starts 72px below the viewport top, so
             absolute + top:12 lands at the same below-navbar offset. */
          position: contained ? 'absolute' : 'fixed',
          top: contained ? 12 : 'calc(var(--lemu-header-h, 72px) + 12px)',
          right: 12,
          bottom: 44,
          width: 404,
          maxWidth: 'calc(100vw - 24px)',
          zIndex: 46,
          borderRadius: 12,
          background: T.panelSolid,
          border: `1px solid ${T.l10}`,
          boxShadow: `0 26px 80px ${T.sh1}`,
          backdropFilter: 'blur(26px) saturate(1.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: T.t1,
          animation: 'kgdrawer .22s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* ── Header: state glyph, name, path, close, three chips ── */}
        <div style={{ padding: '13px 14px 12px', borderBottom: `1px solid ${T.l6}`, background: headBg }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={glyphStyle} aria-hidden="true" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500, color: T.t1, overflowWrap: 'anywhere', lineHeight: 1.3 }}>
                {name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: T.t5, marginTop: 3, overflowWrap: 'anywhere' }}>{path}</div>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                flex: 'none', border: `1px solid ${T.l10}`, background: 'transparent', color: T.t4,
                borderRadius: 6, width: 24, height: 24, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', padding: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            <span style={{ ...chip, background: hexa(hue, 0.12), color: hue, border: `1px solid ${hexa(hue, 0.3)}` }}>{kind}</span>
            {st && (
              <span style={{ ...chip, background: st.bg, color: st.fg, border: st.bd }} data-state={state}>
                {state === 'declared' ? 'DECLARED · NEVER MEASURED' : state.toUpperCase()}
              </span>
            )}
            <span style={{ ...chip, background: T.f4, color: T.t4, border: `1px solid ${T.l5}` }}>{host}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 18px' }}>
          {node._unresolved ? (
            <p style={{ fontFamily: MONO, fontSize: 10.5, color: T.t5, lineHeight: 1.6 }}>
              Not present in the current manifest — shown from a version comparison or an outdated link.
            </p>
          ) : (
            <>
              {/* ── METRICS ── */}
              {metrics.length > 0 && (
                <>
                  <div style={sectionTitle}>METRICS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                    {metrics.map((m) => (
                      <div key={m.label} style={{ border: `1px solid ${T.l5}`, borderRadius: 8, padding: '8px 10px', background: m.ok === false ? T.sunk2 : T.f2 }}>
                        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.09em', color: T.t5, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontFamily: MONO, fontSize: 15, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', color: m.ok === false ? T.t6 : T.t2, overflowWrap: 'anywhere' }}>{m.value}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9.5, color: T.t6, marginTop: 2 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── EVIDENCE — the most important block (P2) ── */}
              {ev && evTone && (
                <>
                  <div style={sectionTitle}>EVIDENCE</div>
                  <div style={{ borderRadius: 9, overflow: 'hidden', marginBottom: 16, border: evTone.border, background: evTone.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderBottom: evTone.divider }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: evTone.dot, border: evTone.dotBd }} aria-hidden="true" />
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.09em', color: evTone.titleFg }}>{ev.title}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontFamily: MONO, fontSize: 10, fontVariantNumeric: 'tabular-nums', color: evTone.tsFg }}>{ev.ts}</span>
                    </div>
                    {ev.query && (
                      <div style={{ padding: '9px 10px', fontFamily: MONO, fontSize: 10.5, lineHeight: 1.6, color: evTone.queryFg, overflowWrap: 'anywhere' }}>{ev.query}</div>
                    )}
                    {ev.value && (
                      <div style={{ padding: '0 10px 9px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.09em', color: T.t5 }}>→</span>
                        <span style={{ fontFamily: MONO, fontSize: 12.5, fontVariantNumeric: 'tabular-nums', color: evTone.valueFg }}>{ev.value}</span>
                      </div>
                    )}
                    {(ev.source || ev.method) && (
                      <div style={{ padding: '6px 10px', borderTop: evTone.divider, display: 'flex', justifyContent: 'space-between', gap: 8, fontFamily: MONO, fontSize: 9.5, color: T.t5 }}>
                        <span style={{ overflowWrap: 'anywhere' }}>{ev.source}</span>
                        <span>{ev.method}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── OWNED FUNCTIONS ── */}
              {fnRows && (
                <>
                  <div style={sectionTitle}>OWNED FUNCTIONS</div>
                  <div style={card}>
                    {fnRows.slice(0, 50).map((f, i) => (
                      <div key={`${f.ref}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderBottom: `1px solid ${T.l2}` }}>
                        <span style={{ flex: 1, fontFamily: MONO, fontSize: 11, color: T.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, fontVariantNumeric: 'tabular-nums', color: T.t5, whiteSpace: 'nowrap' }}>{f.loc}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: T.link, whiteSpace: 'nowrap' }}>{f.ref}</span>
                      </div>
                    ))}
                    {fnRows.length === 0 && (
                      <div style={{ padding: 10, fontFamily: MONO, fontSize: 10.5, color: T.t6, textAlign: 'center' }}>no functions attributed</div>
                    )}
                  </div>
                  {fnRows.length > 50 && (
                    <div style={{ ...sectionTitle, marginTop: -12 }}>showing 50 of {fnRows.length}</div>
                  )}
                </>
              )}

              {/* ── ATTRIBUTED ERRORS — window stated even when empty (P4) ── */}
              {graphKey && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ ...sectionTitle, margin: 0 }}>ATTRIBUTED ERRORS</span>
                    <span style={{
                      fontFamily: MONO, fontSize: 9.5, fontVariantNumeric: 'tabular-nums', padding: '1px 6px', borderRadius: 4,
                      background: errorGroups.length ? T.faultBg : T.f4,
                      color: errorGroups.length ? T.faultT : T.t5,
                    }}
                    >
                      {errorGroups.length ? nf(errorGroups.reduce((s, g) => s + (g.occurrences || 0), 0)) : '0'}
                      {' '}in {windowLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {errorGroups.slice(0, 10).map((g) => (
                      <div key={g.fingerprint || g.message} style={{ border: `1px solid ${T.faultBd}`, background: T.faultBg2, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ flex: 1, fontFamily: MONO, fontSize: 11, color: T.faultT2, lineHeight: 1.45, wordBreak: 'break-word' }}>
                            {g.message || g.sampleMessage || g.errorName || 'unknown error'}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: T.faultT, whiteSpace: 'nowrap' }}>
                            {nf(g.occurrences)}×
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 5, fontFamily: MONO, fontSize: 10 }}>
                          <span style={{ color: T.link, overflowWrap: 'anywhere' }}>
                            {g.file ? `${g.file}${Number.isInteger(g.line) ? `:${g.line}` : ''}` : 'file unknown'}
                            {' · '}
                            <span data-quality={g.matchQuality}>
                              {g.matchQuality === 'exact' ? '✓ exact' : g.matchQuality === 'file' ? '~ file-only' : 'unattributed'}
                            </span>
                          </span>
                          <span style={{ color: T.t5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {g.lastOccurrence ? relativeTime(g.lastOccurrence) : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {errorGroups.length > 10 && (
                      <div style={{ fontFamily: MONO, fontSize: 10, color: T.t5 }}>showing 10 of {errorGroups.length} — see the Errors tab</div>
                    )}
                    {errorAttribution == null ? (
                      <div style={{ border: `1px solid ${T.l5}`, borderRadius: 8, padding: '9px 10px', fontFamily: MONO, fontSize: 10.5, color: T.t5 }}>
                        attribution unavailable — could not load
                      </div>
                    ) : errorGroups.length === 0 && (
                      <div style={{ border: `1px solid ${T.l5}`, borderRadius: 8, padding: '9px 10px', fontFamily: MONO, fontSize: 10.5, color: T.t5 }}>
                        {`no attributed errors in the last ${windowLabel}`}
                        {windowFrom ? ` · window ${windowFrom} → now` : ''}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── CLICKHOUSE MIRROR (§0 C3: absent fields omitted) ── */}
              {mirror && (
                <>
                  <div style={sectionTitle}>CLICKHOUSE MIRROR</div>
                  <div style={{ borderRadius: 9, overflow: 'hidden', border: `1px solid ${T.l7}`, background: T.f1 }}>
                    <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.l3}` }}>
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: '50%', flex: 'none',
                          background: mirror.ok ? T.ok : T.void,
                          border: mirror.ok ? 'none' : `1.5px dashed ${T.hollow2}`,
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ fontFamily: MONO, fontSize: 11, color: mirror.ok ? T.t3 : T.t5, overflowWrap: 'anywhere' }}>{mirror.name}</span>
                    </div>
                    {mirror.rows.map((r) => (
                      <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${T.l1}` }}>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, color: T.t5, whiteSpace: 'nowrap' }}>{r.k}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, fontVariantNumeric: 'tabular-nums', color: mirror.ok ? T.t3 : T.t5, overflowWrap: 'anywhere', textAlign: 'right' }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── TRACE UPSTREAM readout ── */}
          {tracing && (
            <div style={{ marginTop: 14, border: `1px dashed ${T.warnBd}`, background: T.warnBg2, borderRadius: 8, padding: '8px 10px', fontFamily: MONO, fontSize: 10.5, lineHeight: 1.5, color: T.warnT }}>
              {traceNote}
            </div>
          )}

          {/* ── Actions ── */}
          {(onIsolate || traceId) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {onIsolate && (
                <button type="button" onClick={() => onIsolate()} style={actionBtn(!tracing, T.acBg2, T.acBd2, T.acText)}>
                  ISOLATE 1 HOP
                </button>
              )}
              {traceId && (
                <button
                  type="button"
                  onClick={() => setTracing((v) => !v)}
                  aria-pressed={tracing}
                  style={actionBtn(tracing, T.warnBg, T.warnBd, T.warnT)}
                >
                  {tracing ? 'UPSTREAM ✓' : 'TRACE UPSTREAM'}
                </button>
              )}
            </div>
          )}
          {canRebuild && (
            <button
              type="button"
              onClick={onRebuildClick}
              disabled={rebuild === 'busy' || rebuild === 'done'}
              style={{
                ...actionBtn(rebuild === 'confirm', rebuild === 'error' ? T.faultBg : T.warnBg, rebuild === 'error' ? T.faultBd : T.warnBd, rebuild === 'error' ? T.faultT : T.warnT),
                width: '100%',
                marginTop: 6,
              }}
            >
              {rebuildLabel}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default LemuNodeDrawer;
