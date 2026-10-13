import React, { useEffect, useRef, useState } from 'react';
import { LemuService } from '../LemuService';
import { DARK, LIGHT, kindHue } from './graph/graphTheme';
import { upstreamNote, topoTraceLinks } from './graph/upstreamTrace';
import { evidenceVariant, metricsRows, ownedFunctionRows, mirrorPanel } from './graph/drawerModel';
import { fullRoutePath, relativeTime } from './utils';
import { getUserRole } from '../../../../utils/session';
import { MONO } from './drawer/drawerFonts';
import NodeDrawerScrim from './drawer/NodeDrawerScrim';
import NodeDrawerHeader from './drawer/NodeDrawerHeader';
import NodeDrawerMetrics from './drawer/NodeDrawerMetrics';
import NodeDrawerEvidence from './drawer/NodeDrawerEvidence';
import NodeDrawerFunctions from './drawer/NodeDrawerFunctions';
import NodeDrawerErrors from './drawer/NodeDrawerErrors';
import NodeDrawerMirror from './drawer/NodeDrawerMirror';
import NodeDrawerActions from './drawer/NodeDrawerActions';

/* The design's kgdrawer slide-in (220ms), injected so the drawer stays
   self-contained. Reduced motion honoured the same way the design does. */
const KGDRAWER_CSS = `
@keyframes kgdrawer{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.lemu-kgdrawer{animation:none !important}}
`;

const INFRA_KINDS = ['host', 'store', 'collection', 'table', 'pipe', 'source', 'surface'];

/* State chip recipes, one per state — the same trio the canvas rings use. */
const STATE_TONE = (T) => ({
  measured: { bg: T.okBg, fg: T.okT, bd: `1px solid ${T.okBd}` },
  declared: { bg: T.sunk, fg: T.t3, bd: `1px dashed ${T.hollow2}` },
  unreachable: { bg: T.faultBg, fg: T.faultT, bd: `1px solid ${T.faultBd}` },
});

const LemuNodeDrawer = ({
  node,
  kind,
  pulseSeries,
  pulseStatus,
  edges,
  liveness,
  topology,
  errorAttribution,
  onClose,
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
    const focusable = () =>
      Array.from(
        drawer.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.disabled);
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
  const name =
    kind === 'route'
      ? `${node.method} ${fullRoutePath(node)}`
      : kind === 'model'
        ? node.modelName
        : kind === 'job'
          ? node.name
          : /* An unresolved module (diff ghost, stale deep link) carries label
           + _id but no name — fall through so the header shows SOMETHING
           truthful rather than a blank. */
            kind === 'module'
            ? node.name || node.label || node._id
            : node.label || node._id;
  const path =
    kind === 'module'
      ? node._functions?.[0]?.file || '—'
      : kind === 'model'
        ? node.collectionName || '—'
        : kind === 'route'
          ? fullRoutePath(node)
          : kind === 'job'
            ? node.cronExpression || '—'
            : node.declaredBy || '—';
  /* Host chip: INFRA names its hostId; code-layer nodes run on the API's
     own host, looked up from the topology self marker — never guessed. */
  const selfHost = (topology?.nodes || []).find((n) => n.kind === 'host' && n.self === true);
  const host = node.hostId
    ? node.hostId.replace(/^host:/, '')
    : INFRA_KINDS.includes(kind)
      ? 'unassigned'
      : selfHost
        ? selfHost.label
        : '—';

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
  const graphKey =
    kind === 'route'
      ? node._module
        ? `module:${node._module}`
        : null
      : kind === 'model'
        ? `model:${node.modelName}`
        : kind === 'job'
          ? `job:${node.name}`
          : kind === 'module'
            ? `module:${node.name}`
            : INFRA_KINDS.includes(kind)
              ? node._id
              : null;

  /* ── TRACE UPSTREAM — pure helpers over the layer's real edge set ── */
  const links = INFRA_KINDS.includes(kind) ? topoTraceLinks(topology?.edges) : edges || [];
  const traceId = graphKey || node._id;
  const nameOf = (id) =>
    (topology?.nodes || []).find((n) => n.id === id)?.label || id.replace(/^\w+:/, '');
  const TRACE_CAP = 8;
  const traceNote = tracing ? upstreamNote(traceId, links, TRACE_CAP, nameOf) : '';

  /* ── REBUILD MANIFEST (§0 C4) — a write, so it asks first ── */
  const canRebuild = getUserRole() === 'SUPER_ADMIN';
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
    fontFamily: MONO,
    fontSize: 9.5,
    letterSpacing: '.14em',
    color: T.t5,
    margin: '0 0 7px',
  };

  const evTone = ev
    ? {
        ok: {
          border: `1px solid ${T.l7}`,
          bg: T.f1,
          divider: `1px solid ${T.l3}`,
          dot: T.ok,
          dotBd: 'none',
          titleFg: T.okT,
          tsFg: T.t4,
          queryFg: T.t3,
          valueFg: T.t2,
        },
        hollow: {
          border: `1px dashed ${T.hollow2}`,
          bg: T.sunk,
          divider: `1px dashed ${T.hollow3}`,
          dot: T.void,
          dotBd: `1.5px dashed ${T.hollow}`,
          titleFg: T.t3,
          tsFg: T.t5,
          queryFg: T.t4,
          valueFg: T.t5,
        },
        fault: {
          border: `1px solid ${T.faultBd}`,
          bg: T.faultBg2,
          divider: `1px solid ${T.faultBd2}`,
          dot: T.fault,
          dotBd: 'none',
          titleFg: T.faultT,
          tsFg: T.faultT,
          queryFg: T.faultT2,
          valueFg: T.faultT,
        },
      }[ev.tone]
    : null;

  return (
    <>
      <style>{KGDRAWER_CSS}</style>
      <NodeDrawerScrim theme={theme} contained={contained} />
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
        <NodeDrawerHeader
          T={T}
          hue={hue}
          kind={kind}
          state={state}
          st={st}
          name={name}
          path={path}
          host={host}
          closeBtnRef={closeBtnRef}
          onClose={onClose}
        />

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 18px' }}>
          {node._unresolved ? (
            <p style={{ fontFamily: MONO, fontSize: 10.5, color: T.t5, lineHeight: 1.6 }}>
              Not present in the current manifest — shown from a version comparison or an outdated
              link.
            </p>
          ) : (
            <>
              {/* ── METRICS ── */}
              {metrics.length > 0 && (
                <NodeDrawerMetrics T={T} metrics={metrics} sectionTitle={sectionTitle} />
              )}

              {/* ── EVIDENCE — the most important block (P2) ── */}
              {ev && evTone && (
                <NodeDrawerEvidence T={T} ev={ev} evTone={evTone} sectionTitle={sectionTitle} />
              )}

              {/* ── OWNED FUNCTIONS ── */}
              {fnRows && <NodeDrawerFunctions T={T} fnRows={fnRows} sectionTitle={sectionTitle} />}

              {/* ── ATTRIBUTED ERRORS — window stated even when empty (P4) ── */}
              {graphKey && (
                <NodeDrawerErrors
                  T={T}
                  graphKey={graphKey}
                  errorAttribution={errorAttribution}
                  sectionTitle={sectionTitle}
                />
              )}

              {/* ── CLICKHOUSE MIRROR (§0 C3: absent fields omitted) ── */}
              {mirror && <NodeDrawerMirror T={T} mirror={mirror} sectionTitle={sectionTitle} />}
            </>
          )}

          <NodeDrawerActions
            T={T}
            tracing={tracing}
            setTracing={setTracing}
            traceNote={traceNote}
            traceId={traceId}
            onIsolate={onIsolate}
            canRebuild={canRebuild}
            rebuild={rebuild}
            onRebuildClick={onRebuildClick}
          />
        </div>
      </aside>
    </>
  );
};

export default LemuNodeDrawer;
