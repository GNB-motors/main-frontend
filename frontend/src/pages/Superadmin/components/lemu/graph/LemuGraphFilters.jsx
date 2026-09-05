import React, { useMemo } from 'react';
import { KINDS, kindHue, hexa } from './graphTheme';
import { GRAPH_STATES, nf, countByState, countByKind } from './graphPanelCounts';

/* Filter panel (plan Task 9): STATE chips (visibility toggles) and KIND
   chips, docked left 16 / bottom 48 under .lemu-kgfilt. All counts derive
   from the WHOLE active-layer graph — a filter must show what it is hiding,
   so the numbers cannot move as chips are switched off.

   The design's glyph vocabulary is rendered in the DOM, not the canvas:
   solid dot = measured, dashed hollow ring = never measured (the design's
   word for `declared` — absence of evidence, not a claim of health),
   fault ring = unreachable. */

/* short label per state, per the design: `declared` reads "never measured". */
const STATE_META = {
  measured: { short: 'measured', tone: 'measured' },
  declared: { short: 'never measured', tone: 'never' },
  unreachable: { short: 'unreachable', tone: 'unreachable' },
};

const LemuGraphFilters = ({
  nodes,
  offStates,
  onToggleState,
  offKinds,
  onToggleKind,
  onShowAllKinds,
  theme = 'dark',
}) => {
  /* Whole-graph counts, recomputed only when the graph changes — never from
     a filtered subset. */
  const stateCounts = useMemo(() => countByState(nodes), [nodes]);
  const kindCounts = useMemo(() => countByKind(nodes), [nodes]);
  const kindKeys = useMemo(
    () => Object.keys(KINDS).filter((k) => kindCounts[k]),
    [kindCounts],
  );
  const anyKindOff = kindKeys.some((k) => offKinds.has(k));

  return (
    <div className="lemu-kgfilt">
      <div className="lemu-kgfilt__head">
        <span className="lemu-kgfilt__title">STATE</span>
        <span className="lemu-kgfilt__note">fill encodes evidence</span>
      </div>
      <div className="lemu-kgfilt__states">
        {GRAPH_STATES.map((state) => {
          const off = offStates.has(state);
          const meta = STATE_META[state];
          return (
            <button
              key={state}
              type="button"
              data-state={state}
              aria-pressed={!off}
              className={`lemu-kgfilt__state${off ? ' lemu-kgfilt__state--off' : ''}`}
              title={`${off ? 'Show' : 'Hide'} ${meta.short} nodes`}
              onClick={() => onToggleState(state)}
            >
              <span className="lemu-kgfilt__state-top">
                <i className={`lemu-kgfilt__glyph lemu-kgfilt__glyph--${meta.tone}`} aria-hidden="true" />
                <span className="lemu-kgfilt__count">{nf(stateCounts[state])}</span>
              </span>
              <span className="lemu-kgfilt__label">{meta.short}</span>
            </button>
          );
        })}
      </div>
      <div className="lemu-kgfilt__head">
        <span className="lemu-kgfilt__title">KIND</span>
        <button
          type="button"
          className="lemu-kgfilt__all"
          data-dim={!anyKindOff}
          onClick={anyKindOff ? onShowAllKinds : undefined}
        >
          {anyKindOff ? 'show all' : `${kindKeys.length} kinds`}
        </button>
      </div>
      <div className="lemu-kgfilt__kinds">
        {kindKeys.map((k) => {
          const off = offKinds.has(k);
          const hue = kindHue(k, theme);
          return (
            <button
              key={k}
              type="button"
              data-kind={k}
              aria-pressed={!off}
              className={`lemu-kgfilt__kind${off ? ' lemu-kgfilt__kind--off' : ''}`}
              onClick={() => onToggleKind(k)}
            >
              <i
                className="lemu-kgfilt__dot"
                aria-hidden="true"
                style={off
                  ? { background: 'var(--l12)', boxShadow: 'none' }
                  : { background: hue, boxShadow: `0 0 7px ${hexa(hue, 0.6)}` }}
              />
              <span className="lemu-kgfilt__kind-label">{KINDS[k].label}</span>
              <span className="lemu-kgfilt__kind-count">{nf(kindCounts[k])}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LemuGraphFilters;
