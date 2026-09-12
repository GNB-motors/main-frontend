import React, { useState } from 'react';
import { LemuService } from '../../LemuService';
import { DARK } from './graphTheme';
import { stamp } from './kgTable';
import { getUserRole } from '../../../../../utils/session';
import { useConfirm } from '../../../../../components/ui/confirmContext';

/* "No graph on record" (plan Task 12): the topology endpoint answered with
   zero nodes. Chrome is dimmed by the tab (lemu-graph3d--graph-empty); this
   overlay carries the honest explanation.

   Per §0: the design's failure rows (SIGKILL · oom · rss 3.9 GiB, worker id,
   scanner version) are fiction — the real payload carries degraded[]
   ({step, reason, affects}) and generatedAt, and those are shown instead.
   When degraded[] is empty, only the last attempt time is shown.

   Per §0 C4 the action is REBUILD MANIFEST (POST /api/lemu/manifest/rebuild,
   SUPER_ADMIN only, a write — so it asks first). SCANNER LOG and the
   "est. 6–9 min" estimate do not exist and are dropped. */

const BODY_COPY = 'Nothing here is healthy or unhealthy — it is simply unmeasured. No inferred topology is drawn.';

const isSuperAdmin = () => {
  try { return getUserRole() === 'SUPER_ADMIN'; } catch { return false; }
};

const LemuGraphEmpty = ({ generatedAt = null, degraded = [] }) => {
  const [phase, setPhase] = useState('idle'); // idle | busy | done | error
  const [error, setError] = useState('');
  const confirm = useConfirm();

  const handleRebuild = async () => {
    if (phase === 'busy') return;
    /* A write against the running system's manifest — confirm first. */
    const ok = await confirm({
      title: 'Rebuild the system manifest?',
      body: 'The backend re-derives it from the running codebase.',
      confirmLabel: 'Rebuild manifest',
      danger: true,
    });
    if (!ok) return;
    setPhase('busy');
    setError('');
    try {
      await LemuService.rebuildManifest();
      setPhase('done');
    } catch (e) {
      setError(e?.detail || e?.message || 'Rebuild failed.');
      setPhase('error');
    }
  };

  const attempt = stamp(generatedAt);
  const mono = { fontFamily: 'var(--lg-mono)' };

  return (
    <div
      className="lemu-graph3d__empty"
      role="status"
      style={{ background: `radial-gradient(70% 60% at 50% 45%, ${DARK.emptyIn}, ${DARK.emptyOut})` }}
    >
      <div
        className="lemu-graph3d__empty-card"
        style={{
          background: DARK.panelCard,
          border: `1px solid ${DARK.l9}`,
          boxShadow: `0 30px 90px ${DARK.sh1}`,
        }}
      >
        <div className="lemu-graph3d__empty-head">
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: DARK.bg,
              border: `1.5px dashed ${DARK.hollow}`,
              boxShadow: `inset 0 0 8px ${DARK.inset}`,
            }}
          />
          <span style={{ ...mono, fontSize: 12.5, letterSpacing: '.06em', color: DARK.t2 }}>
            NO GRAPH ON RECORD
          </span>
        </div>

        <p className="lemu-graph3d__empty-copy" style={{ color: DARK.t4 }}>
          {BODY_COPY}
        </p>

        <div
          className="lemu-graph3d__empty-detail"
          style={{ border: `1px solid ${DARK.l7}` }}
        >
          <div
            className="lemu-graph3d__empty-row"
            style={{ borderBottom: `1px solid ${DARK.l3}` }}
          >
            <span style={{ ...mono, color: DARK.t5 }}>last attempt</span>
            <span style={{ ...mono, color: DARK.t3, fontVariantNumeric: 'tabular-nums' }}>
              {attempt ? `${attempt} UTC` : '—'}
            </span>
          </div>
          {degraded.map((d, i) => (
            <div
              key={`${d.step}-${i}`}
              className="lemu-graph3d__empty-row"
              style={i < degraded.length - 1 ? { borderBottom: `1px solid ${DARK.l3}` } : undefined}
            >
              <span style={{ ...mono, color: DARK.t5 }}>{d.step}</span>
              <span style={{ ...mono, color: DARK.faultT }}>
                {d.reason}{d.affects?.length ? ` (affects ${d.affects.length})` : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="lemu-graph3d__empty-actions">
          {isSuperAdmin() && (
            <button
              type="button"
              onClick={handleRebuild}
              disabled={phase === 'busy'}
              style={{
                border: `1px solid ${DARK.acBd}`,
                background: DARK.acBg,
                color: DARK.acText,
                opacity: phase === 'busy' ? 0.6 : 1,
              }}
            >
              {phase === 'busy' ? 'REBUILDING…' : 'REBUILD MANIFEST'}
            </button>
          )}
          <div className="lemu-graph3d__empty-status" style={{ ...mono }}>
            {phase === 'done' && <span style={{ color: DARK.okT }}>rebuild requested — the board refreshes with the next data poll</span>}
            {phase === 'error' && <span style={{ color: DARK.faultT }}>{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LemuGraphEmpty;
