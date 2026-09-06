/* The single source of truth for graph colour.

   P3 — one channel, one meaning:
     hue        -> kind        (what this thing is)
     ring/fill  -> state       (whether anything has measured it)
     outline    -> selection or diff overlay
     opacity    -> search match
     pip        -> errors      (a node owns attributed errors)

   The v1 nodeColor() returned a dim grey for search misses, rose for the
   selection, cyan for "live" and otherwise a kind colour — four meanings
   collapsed onto one channel, which is why the board read as noise. Nothing
   here may reintroduce that.

   All colour tokens below are copied VERBATIM from the design source
   (design/lemu-kg/Knowledge Graph.dc.html, script block lines ~380-456) —
   do not retype or "improve" a value. The one addition is `route` (§0 C7):
   the design has no route kind, so it takes the mount hue family (#FB923C)
   at reduced saturation — #C98F5E in dark, #9E602E in light — keeping it
   distinct from mount in both themes. */

import { getPref, setPref } from '../../../../../utils/session.js';


export const KINDS = {
  host:      { c: '#8592AD', label: 'host' },
  source:    { c: '#FBBF24', label: 'source' },
  job:       { c: '#C084FC', label: 'job' },
  store:     { c: '#38BDF8', label: 'store' },
  collection:{ c: '#22D3B7', label: 'collection' },
  pipe:      { c: '#A3E635', label: 'pipe' },
  table:     { c: '#4ADE80', label: 'table' },
  surface:   { c: '#F472B6', label: 'surface' },
  module:    { c: '#60A5FA', label: 'module' },
  model:     { c: '#F0ABFC', label: 'model' },
  mount:     { c: '#FB923C', label: 'mount' },
  route:     { c: '#C98F5E', label: 'route' },
};

export const DARK = {
  bg:'#06070A',chrome:'#080A0E',thead:'#0C0F15',railIcon:'#1B2130',sel:'#24334F',
  void:'#030407',voidFault:'#0B0406',measGlow:'rgba(143,166,200,.75)',
  panel:'rgba(11,13,19,.72)',panelSolid:'rgba(10,12,18,.8)',panelCard:'rgba(11,13,19,.86)',panelToast:'rgba(11,13,19,.85)',
  railBg:'rgba(9,11,16,.82)',tableBg:'rgba(11,13,18,.7)',tableOv:'rgba(6,7,10,.97)',tipBg:'rgba(9,11,16,.92)',
  emptyIn:'rgba(16,20,29,.6)',emptyOut:'rgba(6,7,10,.94)',
  inputBg:'rgba(0,0,0,.28)',sunk:'rgba(0,0,0,.4)',sunk2:'rgba(0,0,0,.35)',inset:'rgba(0,0,0,.9)',inset2:'rgba(0,0,0,.95)',
  sh1:'rgba(0,0,0,.7)',sh2:'rgba(0,0,0,.6)',sh3:'rgba(0,0,0,.55)',sh4:'rgba(0,0,0,.5)',
  l1:'rgba(255,255,255,.04)',l2:'rgba(255,255,255,.045)',l3:'rgba(255,255,255,.055)',l4:'rgba(255,255,255,.06)',
  l5:'rgba(255,255,255,.07)',l6:'rgba(255,255,255,.075)',l7:'rgba(255,255,255,.08)',l8:'rgba(255,255,255,.085)',
  l9:'rgba(255,255,255,.09)',l10:'rgba(255,255,255,.1)',l11:'rgba(255,255,255,.11)',l12:'rgba(255,255,255,.13)',
  l13:'rgba(255,255,255,.14)',l14:'rgba(255,255,255,.24)',
  f1:'rgba(255,255,255,.02)',f2:'rgba(255,255,255,.025)',f3:'rgba(255,255,255,.035)',f4:'rgba(255,255,255,.05)',
  t1:'#EDF2FA',t2:'#E4EBF6',t3:'#C6D0DE',t4:'#8C97A9',t5:'#5E6879',t6:'#4A5364',
  ac:'#6C9BFF',acText:'#CBDCFF',acBg:'rgba(96,140,250,.2)',acBg2:'rgba(96,140,250,.12)',acBg3:'rgba(96,140,250,.05)',
  acBd:'rgba(122,162,255,.42)',acBd2:'rgba(122,162,255,.3)',link:'#7FB2FF',linkH:'#A9CCFF',
  warnT:'#FCD68A',warnBg:'rgba(251,191,36,.14)',warnBg2:'rgba(251,191,36,.06)',warnBd:'rgba(251,191,36,.38)',
  ok:'#4ADE80',okT:'#9FE8BC',okGlow:'rgba(74,222,128,.7)',okBg:'rgba(74,222,128,.1)',okBd:'rgba(74,222,128,.22)',
  fault:'#FF5C5C',faultT:'#FF9A9A',faultT2:'#FFC1C1',faultBg:'rgba(255,92,92,.12)',faultBg2:'rgba(255,92,92,.055)',
  faultBd:'rgba(255,92,92,.32)',faultBd2:'rgba(255,92,92,.18)',
  hollow:'rgba(150,163,184,.62)',hollow2:'rgba(150,163,184,.5)',hollow3:'rgba(150,163,184,.22)',hollow4:'rgba(150,163,184,.06)'
};

export const LIGHT = {
  bg:'#F4F5F8',chrome:'#FFFFFF',thead:'#EDF0F5',railIcon:'#E7EBF2',sel:'#CFE0FF',
  void:'#FFFFFF',voidFault:'#FFF4F4',measGlow:'rgba(51,65,85,.25)',
  panel:'rgba(255,255,255,.78)',panelSolid:'rgba(255,255,255,.9)',panelCard:'rgba(255,255,255,.95)',panelToast:'rgba(255,255,255,.93)',
  railBg:'rgba(255,255,255,.88)',tableBg:'rgba(255,255,255,.72)',tableOv:'rgba(244,245,248,.98)',tipBg:'rgba(255,255,255,.96)',
  emptyIn:'rgba(226,231,240,.6)',emptyOut:'rgba(244,245,248,.94)',
  inputBg:'rgba(15,23,42,.04)',sunk:'rgba(15,23,42,.045)',sunk2:'rgba(15,23,42,.04)',inset:'rgba(15,23,42,.16)',inset2:'rgba(15,23,42,.2)',
  sh1:'rgba(15,23,42,.16)',sh2:'rgba(15,23,42,.13)',sh3:'rgba(15,23,42,.11)',sh4:'rgba(15,23,42,.1)',
  l1:'rgba(15,23,42,.05)',l2:'rgba(15,23,42,.06)',l3:'rgba(15,23,42,.07)',l4:'rgba(15,23,42,.08)',
  l5:'rgba(15,23,42,.09)',l6:'rgba(15,23,42,.095)',l7:'rgba(15,23,42,.1)',l8:'rgba(15,23,42,.11)',
  l9:'rgba(15,23,42,.12)',l10:'rgba(15,23,42,.14)',l11:'rgba(15,23,42,.15)',l12:'rgba(15,23,42,.17)',
  l13:'rgba(15,23,42,.18)',l14:'rgba(15,23,42,.28)',
  f1:'rgba(15,23,42,.02)',f2:'rgba(15,23,42,.025)',f3:'rgba(15,23,42,.035)',f4:'rgba(15,23,42,.05)',
  t1:'#0B1220',t2:'#17233A',t3:'#33415A',t4:'#56637A',t5:'#78849A',t6:'#9AA5B5',
  ac:'#2563EB',acText:'#1D4ED8',acBg:'rgba(37,99,235,.11)',acBg2:'rgba(37,99,235,.07)',acBg3:'rgba(37,99,235,.04)',
  acBd:'rgba(37,99,235,.4)',acBd2:'rgba(37,99,235,.26)',link:'#1D4ED8',linkH:'#1E40AF',
  warnT:'#92610A',warnBg:'rgba(217,119,6,.13)',warnBg2:'rgba(217,119,6,.06)',warnBd:'rgba(217,119,6,.35)',
  ok:'#16A34A',okT:'#15803D',okGlow:'rgba(22,163,74,.35)',okBg:'rgba(22,163,74,.1)',okBd:'rgba(22,163,74,.28)',
  fault:'#DC2626',faultT:'#B91C1C',faultT2:'#991B1B',faultBg:'rgba(220,38,38,.09)',faultBg2:'rgba(220,38,38,.05)',
  faultBd:'rgba(220,38,38,.3)',faultBd2:'rgba(220,38,38,.18)',
  hollow:'rgba(71,85,105,.75)',hollow2:'rgba(71,85,105,.5)',hollow3:'rgba(71,85,105,.32)',hollow4:'rgba(71,85,105,.07)'
};

export const KINDS_LIGHT = {
  host:'#64748B',source:'#B45309',job:'#7C3AED',store:'#0369A1',collection:'#0D9488',pipe:'#4D7C0F',
  table:'#15803D',surface:'#BE185D',module:'#2563EB',model:'#A21CAF',mount:'#C2410C',
  route:'#9E602E'
};

export const CANVAS = {
  dark:{ g0:'#0C1017',g1:'#08090E',g2:'#050609',void:'#030407',voidFault:'#0B0406',
    labelBg:'rgba(4,5,8,.8)',labelOn:'#E8EEF8',labelOff:'#93A0B3',
    hostFill:'rgba(133,146,173,.045)',hostFillSel:'rgba(133,146,173,.09)',hostStroke:'rgba(133,146,173,.22)',
    hostStrokeSel:'rgba(180,195,220,.5)',hostLabel:'#8592AD',hostLabelSel:'#C6D2E6',hostSub:'#4E586A',hostChip:'rgba(6,7,10,.85)',
    selRing:'rgba(255,255,255,.95)',halo:'rgba(255,255,255,.2)',nbRing:'rgba(255,255,255,.4)',hoverRing:'rgba(255,255,255,.6)',
    spec:'rgba(255,255,255,.28)',pipRim:'#06070A',innerRim:'rgba(0,0,0,.85)',glow:true,faultCss:'#FF5C5C' },
  light:{ g0:'#FFFFFF',g1:'#F7F8FB',g2:'#EAEDF3',void:'#FFFFFF',voidFault:'#FFF5F5',
    labelBg:'rgba(255,255,255,.86)',labelOn:'#0B1220',labelOff:'#5A6779',
    hostFill:'rgba(71,85,105,.045)',hostFillSel:'rgba(71,85,105,.09)',hostStroke:'rgba(71,85,105,.24)',
    hostStrokeSel:'rgba(30,41,59,.55)',hostLabel:'#475569',hostLabelSel:'#1E293B',hostSub:'#94A3B8',hostChip:'rgba(255,255,255,.9)',
    selRing:'rgba(15,23,42,.9)',halo:'rgba(15,23,42,.16)',nbRing:'rgba(15,23,42,.32)',hoverRing:'rgba(15,23,42,.5)',
    spec:'rgba(255,255,255,.5)',pipRim:'#FFFFFF',innerRim:'rgba(15,23,42,.2)',glow:false,faultCss:'#DC2626' }
};

/* Theme-aware accessors. The draw pass and the DOM chrome both resolve
   their palette through these — never index DARK/LIGHT/CANVAS directly
   at a call site. */
export const themeTokens = (theme) => (theme === 'light' ? LIGHT : DARK);
export const canvasTokens = (theme) => CANVAS[theme === 'light' ? 'light' : 'dark'];

/* Hue = kind (P3). The design's hues replace the old hand-picked
   KIND_HUE map entirely. */
export const kindHue = (kind, theme) =>
  theme === 'light' ? KINDS_LIGHT[kind] : (KINDS[kind] ? KINDS[kind].c : undefined);

/* Backwards-compatible dark-theme hue map for pre-redesign consumers that
   index KIND_HUE as a plain object (LemuGraphTab). New
   code should call kindHue(kind, theme). Values are the DESIGN's hues. */
export const KIND_HUE = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.c]));

export const KIND_LABEL = {
  module: 'Modules', model: 'Models', job: 'Jobs',
  mount: 'Route mounts', route: 'Routes',
  host: 'Hosts', store: 'Stores', collection: 'Collections',
  table: 'Tables', pipe: 'Pipelines', source: 'Sources', surface: 'Surfaces',
};

/* Human labels for edge kinds, for the legend. There is deliberately no
   LINK_COLOR: a link is coloured as a gradient between its two endpoint
   kind hues (see kgDraw.js) — direction-readable and one less colour
   vocabulary to learn. This map survives for the legend text only. */
export const LINK_LABEL = {
  require: 'Requires',
  model: 'Uses model',
  mount: 'Mounts',
  job: 'Runs job',
  route: 'Routes',
  reads: 'Reads',
  writes: 'Writes',
  hosts: 'Hosts',
  contains: 'Contains',
  mirrors: 'Mirrors (CDC)',
  serves: 'Serves',
};

/* Ring = state (P3). Each ring kind carries the design's concrete recipe;
   kgDraw.js renders these numbers verbatim. A hollow node must stay
   legible when zoomed out, which is why every non-measured node also gets
   minRadius 4.6. */
export const RING_RECIPES = {
  // measured: solid disc in the kind hue; glow (dark) or 1px rim (light) in the draw pass
  solid: {},
  // declared ("never measured"): fill is C.void — NEVER the kind hue; dashed
  // ring in the hue; inner rim stroke. The node is empty on purpose.
  hollow: {
    fill: 'void',
    ringAlpha: (glow) => (glow ? 0.42 : 0.62),
    ringWidth: (r, glow) => Math.max(1, r * (glow ? 0.17 : 0.20)),
    dash: (r) => [Math.max(2, r * 0.5), Math.max(2, r * 0.44)],
    innerRim: (r) => Math.max(0.5, r - 1.6),
  },
  // unreachable: fill C.voidFault; solid fault ring; dashed halo; diagonal
  // slash — the slash is what separates "we tried and failed" from "we
  // never tried". Not decoration.
  fault: {
    fill: 'voidFault',
    ringAlpha: 0.95,
    ringWidth: (r) => Math.max(1.1, r * 0.2),
    halo: { offset: 3.4, alpha: 0.3, dash: [2, 3] },
    slash: { x0: -0.5, y0: 0.5, x1: 0.5, y1: -0.5, alpha: 0.8, width: (r) => Math.max(1, r * 0.16) },
  },
  // diff overlay 'removed' — the manifest-diff owns the node, not state.
  // A ghost renders HOLLOW at reduced opacity with the diff outline ring —
  // never the fault ring/slash: it was removed from the manifest, it did not
  // fail a probe. One channel, one meaning (P3). The draw pass multiplies
  // node alpha by `dim` for this ring.
  ghost: {
    fill: 'void',
    dim: 0.45,
    ringAlpha: (glow) => (glow ? 0.42 : 0.62),
    ringWidth: (r, glow) => Math.max(1, r * (glow ? 0.17 : 0.20)),
    dash: (r) => [Math.max(2, r * 0.5), Math.max(2, r * 0.44)],
    innerRim: (r) => Math.max(0.5, r - 1.6),
  },
};

/* The manifest-diff ghost marker: either state (diffOverlay.ghostNode stamps
   state: 'removed') or the explicit ghost flag. Kept in one place so the
   draw pass and nodeAppearance agree on what a ghost is. */
export const isGhostNode = (node) => Boolean(node) && (node.state === 'removed' || node.ghost === true);

const RING_BY_STATE = { measured: 'solid', declared: 'hollow', unreachable: 'fault', removed: 'ghost' };

/* Outline halo colours, one per outline meaning. 'selected'/'neighbour' are
   selection; 'added'/'changed'/'removed' are the manifest-diff overlay
   (Phase 5). The overlay owns the channel while it is on — selection
   highlighting is suppressed rather than stacking two meanings (P3). */
export const OUTLINE_COLOR = {
  selected: '#ffffff',
  neighbour: '#cbd5e1',
  added: '#34d399',
  changed: '#fbbf24',
  removed: '#94a3b8',
};

/* hexa('#RRGGBB', alpha) -> 'rgba(r,g,b,a)'. Non-hex strings pass through
   unchanged so theme tokens that are already rgba() can be fed to it
   blindly. Ported verbatim from the design. */
export const hexa = (hex, a) => {
  if (!hex || hex.charAt(0) !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};

/**
 * @param {object} node  { id, kind, state?, errorCount? }
 * @param {object} ctx   { selectedNodeId?, matches?: Set<string>, neighbours?: Set<string>|object,
 *                         overlay?: Map<nodeId, 'added'|'removed'|'changed'> }
 * @returns { color, opacity, ring: 'solid'|'hollow'|'fault'|'ghost',
 *            outline: null|'selected'|'neighbour'|'added'|'changed'|'removed',
 *            pip: null|'errors', minRadius }
 */
export const nodeAppearance = (node, ctx = {}) => {
  const { selectedNodeId, matches, neighbours, overlay } = ctx;
  const color = kindHue(node.kind, 'dark') || '#94a3b8';

  let opacity = 1;
  if (matches && matches.size && !matches.has(node.id)) opacity = 0.11;

  let outline = null;
  if (overlay && overlay.size) {
    const mark = overlay.get(node.id);
    if (mark === 'added' || mark === 'changed' || mark === 'removed') outline = mark;
  } else if (selectedNodeId && node.id === selectedNodeId) outline = 'selected';
  else if (neighbours && (neighbours.has ? neighbours.has(node.id) : neighbours[node.id])) outline = 'neighbour';

  const ring = isGhostNode(node) ? 'ghost' : (node.state ? RING_BY_STATE[node.state] || 'hollow' : 'solid');

  // A hollow node must stay legible zoomed out: any non-measured node
  // gets a hard floor of 4.6 on its radius (design ~line 1064).
  const minRadius = node.state === 'measured' ? 2.2 : 4.6;

  // Errors get their own channel, never a hue override (P3): a pip, drawn by
  // the canvas on top of whatever the ring/outline treatment produced.
  const pip = node.errorCount ? 'errors' : null;

  return { color, opacity, ring, outline, pip, minRadius };
};

/* ---------- theme plumbing (plan Task 14) ----------

   The design's syncFilters (Knowledge Graph.dc.html, ~line 789) writes the
   whole DARK/LIGHT token set onto the document root as CSS custom properties
   when the theme flips. Here the write is SCOPED to the graph container
   element instead: the graph CSS vars (--panel, --l8, ...) are defined under
   .lemu-graph3d, so writing them on that element reaches every panel the
   graph owns and nothing else in the app shell. The static CSS keeps the
   DARK values as fallbacks; these inline properties override them while the
   graph is mounted, and clearThemeVars removes them on unmount. */

export const THEME_STORAGE_KEY = 'lemu-graph-theme';

/* Storage is best-effort (via utils/session.js prefs): private mode, disabled
   storage and sandboxed iframes can all throw. Any unreadable value means dark
   (the design's default board). */
export const readStoredTheme = () =>
  getPref(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';

export const writeStoredTheme = (theme) => {
  // persistence is a convenience, not a requirement
  setPref(THEME_STORAGE_KEY, theme === 'light' ? 'light' : 'dark');
};

export const applyThemeVars = (el, theme) => {
  if (!el || !el.style) return;
  const T = themeTokens(theme);
  Object.keys(T).forEach((k) => el.style.setProperty('--' + k, T[k]));
};

export const clearThemeVars = (el) => {
  if (!el || !el.style) return;
  const keys = new Set([...Object.keys(DARK), ...Object.keys(LIGHT)]);
  keys.forEach((k) => el.style.removeProperty('--' + k));
};
