/* Pure view-model builders for the node drawer (plan 5, Task 10).
   Everything here is a deterministic map from the real payload
   (topology node / manifest record / error-attribution groups) to the
   shape the drawer renders — no fabricated numbers, no Date.now
   dependence except through injectable formatters.

   §0 C2: evidence strings come from node.evidence / node.declaredBy only.
   §0 C3: mirror-panel rows are omitted when their field is absent.
   §0 C5: module size is modules[].totalLoc / functionCount, never
          functions[].loc.
   §0 C6/C6b: the self-measurement note keys on kind === 'surface' plus
          selfMeasured (the renamed surface flag); the legacy `self`
          fallback is guarded by the same kind check so a host carrying
          `self: true` ("this is our host") never gets the note. */

import { formatDuration } from '../utils';

/* The design's nf(): '—' for missing, en-US grouping otherwise. */
export const nf = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : n.toLocaleString('en-US'));

/* Design stamp(): UTC 'YYYY-MM-DD HH:MM:SS' + ' UTC', '—' when unparsable. */
export const stampUTC = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
};

/* §0 C6b — true only for self-measured SURFACES, never for hosts. */
export const selfMeasuredSurface = (node) => !!node
  && node.kind === 'surface'
  && (node.selfMeasured === true || node.self === true);

/* Render an evidence.detail object as the design's evQuery line:
   'k: v' pairs joined by ' · ', null-valued keys dropped. A detail with
   nothing to say yields null (the row is then omitted, not blanked). */
export const detailText = (detail) => {
  if (detail === null || detail === undefined) return null;
  if (typeof detail !== 'object') return String(detail);
  const parts = Object.entries(detail)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  return parts.length ? parts.join(' · ') : null;
};

/* The measured-variant value line: the single most important number in
   the detail, named — never a synthesized scale. */
export const valueFromDetail = (detail) => {
  if (!detail || typeof detail !== 'object') return null;
  if (detail.n != null) return `${nf(detail.n)} calls`;
  if (detail.ops != null) return `${nf(detail.ops)} ops`;
  if (detail.rowCount != null) return `${nf(detail.rowCount)} rows`;
  if (detail.rowsWritten != null) return `${nf(detail.rowsWritten)} rows written`;
  if (detail.tableCount != null) return `${nf(detail.tableCount)} tables`;
  if (detail.status != null) return String(detail.status);
  return null;
};

/* The EVIDENCE block, three variants keyed on node.state (§0 C2).
   Returns { tone, title, ts, query, value, source, method } — method is
   always null: the real payload has no probe-method field and inventing
   one is exactly the fiction C2 bans (the footer then shows source only). */
export const evidenceVariant = (node) => {
  const state = node.state || 'declared';
  const ev = node.evidence || null;

  if (state === 'measured') {
    return {
      tone: 'ok',
      title: 'MEASUREMENT ROW',
      ts: ev?.at ? stampUTC(ev.at) : '—',
      query: detailText(ev?.detail),
      value: valueFromDetail(ev?.detail),
      source: ev?.source || null,
      method: null,
    };
  }

  if (state === 'unreachable') {
    return {
      tone: 'fault',
      title: 'PROBE FAILED',
      ts: ev?.at ? stampUTC(ev.at) : '—',
      query: detailText(ev?.detail)
        || (ev?.source ? `probe via ${ev.source} did not answer` : 'the probe ran and did not answer'),
      value: 'no value',
      source: ev?.source || null,
      method: null,
    };
  }

  if (selfMeasuredSurface(node)) {
    /* §0 C6 — the surface IS measured, but only by this page looking at
       itself; the traffic is shown (metrics below) yet cannot count as
       evidence. Never let it read as an unexplained hollow ring. */
    return {
      tone: 'hollow',
      title: 'NO ROW ON RECORD',
      ts: 'never',
      query: node.declaredBy ? `declared by ${node.declaredBy}` : null,
      value: `self-measured — only this page polls this API, so the traffic below is not evidence · ${nf(node.metrics?.n)} requests in 24h`,
      source: node.declaredBy || null,
      method: null,
    };
  }

  return {
    tone: 'hollow',
    title: 'NO ROW ON RECORD',
    ts: 'never',
    query: node.declaredBy ? `declared by ${node.declaredBy}` : null,
    value: 'nothing measured — not zero, not healthy',
    source: node.declaredBy || null,
    method: null,
  };
};

/* IMPORTS / IMPORTED BY for the code layer: counts of edges of kind
   'require' in each direction (§0 C5). Manifest edges are plain
   { from, to, kind } strings; topology edges have the same shape. */
export const requireCounts = (id, edges) => {
  let imports = 0;
  let importedBy = 0;
  (edges || []).forEach((e) => {
    if (e.kind !== 'require') return;
    if (e.from === id) imports += 1;
    if (e.to === id) importedBy += 1;
  });
  return { imports, importedBy };
};

/* METRICS — the design's 2×2 grid, populated per kind from real fields.
   `node` is the state-carrying row when one exists (INFRA topology node,
   or a job's _topo); `opts.manifestNode` is the code-layer manifest
   record for jobs. `opts.rel` formats ISO timestamps relatively (the
   component injects utils.relativeTime; tests inject a stub so the rows
   stay deterministic). */
export const metricsRows = (node, kind, codeEdges = [], opts = {}) => {
  const { rel = (iso) => iso, manifestNode, latestPulse = {}, liveness = null, pulseStatus, jobHealth = {} } = opts;
  const m = node.metrics || {};
  const isColl = kind === 'collection';
  const isTab = kind === 'table';

  if (node.state) {
    if (selfMeasuredSurface(node)) {
      return [
        { label: 'REQUESTS 24H', value: nf(m.n), sub: 'systempulses.routes' },
        { label: 'ERRORS 24H', value: nf(m.err), sub: 'systempulses.routes' },
        { label: 'LIVENESS', value: '—', sub: 'self-measured', ok: false },
        { label: 'EVIDENCE', value: '—', sub: 'not evidence', ok: false },
      ];
    }
    if (node.state !== 'measured') {
      /* Design verbatim: four dashes, each sub-label naming the absence. */
      return [
        { label: 'SCALE', value: '—', sub: 'no measurement', ok: false },
        { label: 'LAST VALUE', value: '—', sub: 'never recorded', ok: false },
        { label: isColl || isTab ? 'ROWS' : 'LINES', value: '—', sub: 'unmeasured', ok: false },
        { label: 'TRAFFIC 24H', value: '—', sub: 'unmeasured', ok: false },
      ];
    }
    switch (kind) {
      case 'host':
        return [
          { label: 'RSS (MB)', value: nf(m.rssMb), sub: 'process.rssMb' },
          { label: 'UPTIME (s)', value: nf(m.uptimeSec), sub: 'process.uptimeSec' },
          { label: 'EVENT-LOOP (ms)', value: nf(m.eventLoopLagMs), sub: 'process.eventLoopLagMs' },
        ].filter((r) => r.value !== '—');
      case 'store':
        return [
          { label: 'COLLECTIONS', value: nf(m.collectionCount), sub: 'pulse collections' },
          { label: 'TABLES', value: nf(m.tableCount), sub: 'warehouse tables' },
        ].filter((r) => r.value !== '—');
      case 'collection':
        return [
          { label: 'OPS 24H', value: nf(m.ops), sub: 'systempulses.collections' },
          { label: 'FAILED', value: nf(m.fail), sub: 'failed ops' },
          { label: 'LAST SEEN', value: m.lastSeen ? rel(m.lastSeen) : '—', sub: 'liveness', ok: !!m.lastSeen },
        ];
      case 'table': {
        const live = m.liveness || {};
        return [
          { label: 'LIVENESS', value: live.ok == null ? '—' : live.ok ? 'yes' : 'no', sub: 'warehouse_liveness', ok: live.ok != null },
          { label: 'CHECKED', value: live.checkedAt ? rel(live.checkedAt) : '—', sub: 'warehouse_liveness', ok: !!live.checkedAt },
          { label: 'ERROR', value: live.error || '—', sub: 'last probe', ok: false },
        ];
      }
      case 'pipe':
        return [
          { label: 'LAG (s)', value: nf(m.lagSeconds), sub: 'ingestionwatermarks' },
          { label: 'WATERMARKS', value: nf(m.watermarks), sub: 'sources' },
        ];
      case 'source':
        return [
          { label: 'CALLS 24H', value: nf(m.calls), sub: 'systempulses.external' },
          { label: 'FAILURES 24H', value: nf(m.failures), sub: 'systempulses.external' },
        ];
      case 'surface':
        return [
          { label: 'REQUESTS 24H', value: nf(m.n), sub: 'systempulses.routes' },
          { label: 'ERRORS 24H', value: nf(m.err), sub: 'systempulses.routes' },
        ];
      case 'job': {
        const rows = [
          { label: 'STATUS', value: m.status || '—', sub: 'jobheartbeats', ok: !!m.status },
          { label: 'SILENT (ms)', value: nf(m.silentMs), sub: 'jobheartbeats' },
        ];
        const src = manifestNode || {};
        if (src.intervalMs) rows.push({ label: 'INTERVAL', value: `${src.intervalMs}ms`, sub: 'manifest' });
        if (src.instrumented != null) rows.push({ label: 'INSTRUMENTED', value: src.instrumented ? 'yes' : 'no', sub: 'manifest' });
        return rows;
      }
      default:
        return [];
    }
  }

  /* Code layer — structural facts from the manifest, pulse from the
     latest bucket; nothing here claims to be measurement evidence. */
  switch (kind) {
    case 'module': {
      const { imports, importedBy } = requireCounts(node._id, codeEdges);
      return [
        { label: 'LINES', value: nf(node.totalLoc), sub: 'totalLoc' },
        { label: 'FUNCTIONS', value: nf(node.functionCount), sub: 'functionCount' },
        { label: 'IMPORTS', value: nf(imports), sub: 'require edges' },
        { label: 'IMPORTED BY', value: nf(importedBy), sub: 'require edges' },
      ];
    }
    case 'model': {
      const live = liveness?.collections?.[node.collectionName];
      return [
        { label: 'DOCS', value: node.estimatedDocs == null ? '—' : nf(node.estimatedDocs), sub: 'estimated', ok: node.estimatedDocs != null },
        { label: 'PATHS', value: nf(node.pathCount), sub: 'manifest' },
        { label: 'INDEXES', value: nf(node.indexCount), sub: 'manifest' },
        { label: 'LAST TRAFFIC', value: live?.lastSeen ? rel(live.lastSeen) : '—', sub: live?.lastSeen ? 'liveness' : 'no traffic in 24h', ok: !!live?.lastSeen },
      ];
    }
    case 'route': {
      const bad = pulseStatus === 'error';
      const sub = bad ? 'pulse unavailable' : 'pulse · latest bucket';
      return [
        { label: 'CALLS', value: bad ? '—' : nf(latestPulse.n), sub, ok: !bad },
        { label: 'ERRORS', value: bad ? '—' : nf(latestPulse.err), sub, ok: !bad },
        { label: 'P50', value: bad ? '—' : formatDuration(latestPulse.p50), sub, ok: !bad },
        { label: 'P95', value: bad ? '—' : formatDuration(latestPulse.p95), sub, ok: !bad },
      ];
    }
    case 'job':
      return [
        { label: 'STATUS', value: jobHealth.status || 'unmonitored', sub: 'jobhealth' },
        { label: 'LAST OK', value: jobHealth.lastOkAt ? rel(jobHealth.lastOkAt) : '—', sub: 'jobhealth', ok: !!jobHealth.lastOkAt },
        { label: 'INTERVAL', value: node.intervalMs ? `${node.intervalMs}ms` : '—', sub: 'manifest' },
        { label: 'INSTRUMENTED', value: node.instrumented == null ? '—' : node.instrumented ? 'yes' : 'no', sub: 'manifest' },
      ];
    default:
      return [];
  }
};

/* OWNED FUNCTIONS — source order (startLine), row shape per Task 10:
   name · loc · file:line. `loc` is shown because the design's row carries
   it; it is the FILE's line count (§0 C5) and is never used as a size.

   The manifest records unnamed functions under their enclosing statement,
   so a row can come back literally named 'if', 'catch', 'for', … — those
   and empty names display as '<anonymous>' (the raw keyword would read as
   a real function name, and dozens of same-named rows were the "anonymous
   functions" report). Consecutive rows with the same display name AND the
   same file:line collapse into one row carrying `count` — the manifest
   emits one record per anonymous closure at the same statement — so the
   drawer renders a ×N badge instead of N identical lines. The sort is
   applied BEFORE collapsing so the source order is preserved. */
const CONTROL_FLOW_NAMES = new Set(['if', 'else', 'for', 'while', 'switch', 'catch', 'try', 'do']);

const functionDisplayName = (f) => {
  const n = (f.functionName || '').trim();
  return n && !CONTROL_FLOW_NAMES.has(n) ? n : '<anonymous>';
};

export const ownedFunctionRows = (functions) => {
  const rows = [...(functions || [])]
    /* Functions with no recorded startLine cannot be placed in source
       order — they go last, not first. */
    .sort((a, b) => (a.startLine ?? Number.POSITIVE_INFINITY) - (b.startLine ?? Number.POSITIVE_INFINITY))
    .map((f) => ({
      name: functionDisplayName(f),
      loc: nf(f.loc),
      ref: `${f.file || '—'}${Number.isInteger(f.startLine) ? `:${f.startLine}` : ''}`,
    }));
  const out = [];
  for (const r of rows) {
    const prev = out[out.length - 1];
    if (prev && prev.name === r.name && prev.ref === r.ref) prev.count = (prev.count || 1) + 1;
    else out.push(r);
  }
  return out;
};

/* P4 — the attribution window stated explicitly. The page asks the
   endpoint without params, so the backend default (30 days) is what the
   tab actually uses; the payload echoes it as windowHours. */
export const errorWindowLabel = (windowHours) => {
  const h = Number(windowHours) > 0 ? Number(windowHours) : 24 * 30;
  return h % 24 === 0 ? `${h / 24} d` : `${h} h`;
};

/* Scalar sub-fields worth surfacing from the warehouse reconciliation
   rows (their ClickHouse schemas evolve; anything absent is omitted —
   §0 C3 — never substituted). */
const COMPLETENESS_KEYS = ['windowTo', 'expectedRows', 'actualRows', 'missingRows', 'missingPercent', 'rowCount'];
const CORRECTNESS_KEYS = ['windowTo', 'checkedRows', 'mismatchCount', 'mismatchPercent', 'sampledRows'];

const scalarRows = (obj, keys, prefix, rel) => {
  if (!obj || typeof obj !== 'object' || obj.error) return [];
  return keys
    .filter((k) => obj[k] !== null && obj[k] !== undefined)
    .map((k) => ({
      k: `${prefix}.${k}`,
      v: /At$|^windowTo$/.test(k) && Number.isNaN(Number(obj[k])) ? rel(obj[k]) : nf(obj[k]),
    }));
};

/* CLICKHOUSE MIRROR panel (§0 C3). Built only from mirrors edges and the
   warehouse rows already on the topology payload; kinds the mirror does
   not concern get the design's `not applicable` variant. */
export const mirrorPanel = (node, topology, rel = (iso) => iso) => {
  const edges = topology?.edges || [];
  const nodes = topology?.nodes || [];
  const nodeState = (id) => nodes.find((n) => n.id === id)?.state;

  if (node.kind === 'collection') {
    const out = edges.filter((e) => e.kind === 'mirrors' && e.from === node.id);
    /* Downstream rows belong to this collection only when it actually
       feeds the CDC pipe — an unmirrored collection gets no rows at all
       rather than the shared pipe's numbers (§0 C3). */
    const tableEdge = out.length
      ? edges.find((e) => e.kind === 'mirrors' && e.from === 'pipe:cdc' && e.to?.startsWith('table:'))
      : null;
    const tableLabel = tableEdge ? tableEdge.to.replace(/^table:/, '') : null;
    const rows = [];
    if (out.length) rows.push({ k: 'direction', v: 'mongo → clickhouse' });
    if (tableLabel) rows.push({ k: 'table', v: tableLabel });
    const pipeState = out.length ? nodeState('pipe:cdc') : null;
    if (pipeState) rows.push({ k: 'pipe', v: pipeState });
    return {
      name: tableLabel ? `clickhouse · ${tableLabel}` : (out.length ? 'mirrors → pipe:cdc' : 'no mirror edge'),
      ok: out.length > 0,
      rows,
    };
  }

  if (node.kind === 'table') {
    const live = node.metrics?.liveness || {};
    const rows = [];
    if (live.ok != null) rows.push({ k: 'liveness', v: live.ok ? 'yes' : 'no' });
    if (live.checkedAt) rows.push({ k: 'checked', v: rel(live.checkedAt) });
    if (live.error) rows.push({ k: 'error', v: live.error });
    rows.push(...scalarRows(node.metrics?.completeness, COMPLETENESS_KEYS, 'completeness', rel));
    rows.push(...scalarRows(node.metrics?.correctness, CORRECTNESS_KEYS, 'correctness', rel));
    return { name: node.label, ok: node.state === 'measured' && rows.length > 0, rows };
  }

  if (node.kind === 'pipe') {
    const rows = [];
    if (node.metrics?.lagSeconds != null) rows.push({ k: 'lag (s)', v: nf(node.metrics.lagSeconds) });
    if (node.metrics?.watermarks != null) rows.push({ k: 'watermarks', v: nf(node.metrics.watermarks) });
    const detail = node.evidence?.detail || {};
    if (detail.rowCount != null) rows.push({ k: 'rows', v: nf(detail.rowCount) });
    if (detail.source) rows.push({ k: 'source', v: detail.source });
    return { name: node.label, ok: node.state === 'measured' && rows.length > 0, rows };
  }

  return {
    name: `n/a for kind ${node.kind}`,
    ok: false,
    rows: [{ k: 'mirror', v: 'not applicable' }],
  };
};
