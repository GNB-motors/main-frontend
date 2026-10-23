import React from 'react';
import { degradedDetail, degradedTitle } from '../degradedExplain';

/* The stacked overlay rails above the canvas: INFRA states, attribution
   quality, analysis readouts and the degraded strip. */
const GraphRails = ({
  view,
  summary,
  dimmedStates,
  toggleStateDim,
  errorAttribution,
  attributionQuality,
  unattributedCount,
  unattributedLabel,
  openErrors,
  livePath,
  diffOverlay,
  diffVersion,
  blast,
  pathInfo,
  degraded,
  degradedDismissed,
  degradedStripRef,
  degradedOpenIdx,
  setDegradedOpenIdx,
  setDegradedDismissed,
  topology,
}) => (
  <>
    {/* INFRA status rail: payload summary as chips. Clicking one dims the
          other states through the search-opacity channel (see `matches`). */}
    {view === 'graph' && summary && (
      <div
        className="lemu-graph3d__statusrail lemu-graph3d__panel"
        role="group"
        aria-label="Node states"
      >
        {[
          ['measured', '●'],
          ['declared', '○'],
          ['unreachable', '⊘'],
        ].map(([state, mark]) => (
          <button
            key={state}
            type="button"
            data-state={state}
            className={`lemu-graph3d__statechip${dimmedStates.has(state) ? '' : ' lemu-graph3d__statechip--on'}`}
            aria-pressed={!dimmedStates.has(state)}
            title={`Dim the other states (${state} stays bright)`}
            onClick={() => toggleStateDim(state)}
          >
            <i aria-hidden="true">{mark}</i> {state} <b>{summary[state] ?? 0}</b>
          </button>
        ))}
      </div>
    )}

    {/* Attribution quality rail: the honest headline of Phase 4 — how many
          errors resolve to a function (exact), to a file only (file), or to
          nothing (none). Same chip styling as the state rail above; clicking
          switches to the Errors tab. The unattributed line shares the click
          target: an error shown as unattributable beats one silently dropped. */}
    {view === 'graph' && errorAttribution?.groups?.length > 0 && (
      <div
        className="lemu-graph3d__attribrail lemu-graph3d__panel"
        role="group"
        aria-label="Error attribution quality"
      >
        <button
          type="button"
          className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
          title="Open the Errors tab"
          onClick={openErrors}
        >
          <i aria-hidden="true">⚠</i> exact <b>{attributionQuality.exact}</b>
          {' · '}file <b>{attributionQuality.file}</b>
          {' · '}none <b>{attributionQuality.none}</b>
        </button>
        {unattributedCount > 0 && (
          <button
            type="button"
            className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
            title="Open the Errors tab"
            onClick={openErrors}
          >
            {unattributedLabel}
          </button>
        )}
      </div>
    )}

    {/* Analysis rail (Phase 5): one chip per active analysis, stacked under
          the attribution rail — readouts, not alarms, reusing statechip
          styling. */}
    {view === 'graph' && (blast || pathInfo || diffOverlay || livePath) && (
      <div
        className="lemu-graph3d__analysisrail lemu-graph3d__panel"
        role="group"
        aria-label="Analysis readouts"
      >
        {livePath && (
          <span
            className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
            data-analysis="livepath"
          >
            <i aria-hidden="true">⌁</i> live path: <b>{livePath.size}</b> measured nodes lit
          </span>
        )}
        {diffOverlay && (
          <span
            className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
            data-analysis="diff"
          >
            <i aria-hidden="true">±</i> diff (v{diffVersion}): <b>{diffOverlay.counts.added}</b>{' '}
            added · <b>{diffOverlay.counts.changed}</b> changed ·{' '}
            <b>{diffOverlay.counts.removed}</b> removed
          </span>
        )}
        {blast && (
          <span
            className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
            data-analysis="blast"
          >
            <i aria-hidden="true">◉</i> blast: <b>{blast.down.size}</b> downstream ·{' '}
            <b>{blast.up.size}</b> upstream
          </span>
        )}
        {pathInfo &&
          (pathInfo.length > 0 ? (
            <span
              className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
              data-analysis="path"
            >
              <i aria-hidden="true">→</i> path: <b>{pathInfo.length - 1}</b> hop
              {pathInfo.length - 1 === 1 ? '' : 's'}
            </span>
          ) : (
            /* [] is a real answer: the layers have different edge sets, so
               the copy names the layer rather than claiming disconnection. */
            <span
              className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
              data-analysis="path"
            >
              <i aria-hidden="true">∅</i> no path in this layer
            </span>
          ))}
      </div>
    )}

    {/* Degraded strip: every measurement the backend could not complete is
          named here instead of failing silently (spec §3.3). Notice tone, not
          alarm — each chip opens a detail popover explaining the probe, the
          reason, what it affects and when the payload reported it. Dismissible,
          re-armed by the next payload. */}
    {view === 'graph' && degraded.length > 0 && !degradedDismissed && (
      <div
        ref={degradedStripRef}
        className="lemu-graph3d__degraded lemu-graph3d__panel"
        role="alert"
      >
        {degraded.map((d, i) => (
          <button
            key={`${d.step}-${i}`}
            type="button"
            className="lemu-graph3d__degraded-chip"
            aria-expanded={degradedOpenIdx === i}
            aria-label={`Details: ${degradedTitle(d.step)}`}
            onClick={() => setDegradedOpenIdx(degradedOpenIdx === i ? null : i)}
          >
            <code>{d.step}</code> — {d.reason}
            {d.affects?.length ? ` (affects ${d.affects.length})` : ''}
          </button>
        ))}
        <button
          type="button"
          className="lemu-graph3d__degraded-x"
          onClick={() => {
            setDegradedDismissed(true);
            setDegradedOpenIdx(null);
          }}
          aria-label="Dismiss degraded report"
        >
          ×
        </button>
        {degradedOpenIdx != null && degraded[degradedOpenIdx] && (
          <div
            className="lemu-graph3d__degraded-pop lemu-graph3d__panel"
            role="dialog"
            aria-label={`Degraded detail: ${degraded[degradedOpenIdx].step}`}
          >
            <h3 className="lemu-graph3d__degraded-pop-title">
              {degradedTitle(degraded[degradedOpenIdx].step)}
            </h3>
            <dl style={{ margin: 0 }}>
              {degradedDetail(degraded[degradedOpenIdx], {
                nodes: topology?.nodes || [],
                generatedAt: topology?.generatedAt || null,
              }).map((row) => (
                <div key={row.k} className="lemu-graph3d__degraded-pop-row">
                  <dt>{row.k}</dt>
                  <dd className={row.mono ? 'lemu-graph3d__degraded-pop-mono' : undefined}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    )}
  </>
);

export default GraphRails;
