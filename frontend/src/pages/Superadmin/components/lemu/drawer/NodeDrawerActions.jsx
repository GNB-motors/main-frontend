import React from 'react';
import { MONO } from './drawerFonts';

const NodeDrawerActions = ({
  T,
  tracing,
  setTracing,
  traceNote,
  traceId,
  onIsolate,
  canRebuild,
  rebuild,
  onRebuildClick,
}) => {
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

  const rebuildLabel = {
    idle: 'REBUILD MANIFEST',
    confirm: 'CONFIRM REBUILD',
    busy: 'REBUILDING…',
    done: 'REBUILD REQUESTED ✓',
    error: 'REBUILD FAILED — RETRY?',
  }[rebuild];

  return (
    <>
      {/* ── TRACE UPSTREAM readout ── */}
      {tracing && (
        <div
          style={{
            marginTop: 14,
            border: `1px dashed ${T.warnBd}`,
            background: T.warnBg2,
            borderRadius: 8,
            padding: '8px 10px',
            fontFamily: MONO,
            fontSize: 10.5,
            lineHeight: 1.5,
            color: T.warnT,
          }}
        >
          {traceNote}
        </div>
      )}

      {/* ── Actions ── */}
      {(onIsolate || traceId) && (
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {onIsolate && (
            <button
              type="button"
              onClick={() => onIsolate()}
              style={actionBtn(!tracing, T.acBg2, T.acBd2, T.acText)}
            >
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
            ...actionBtn(
              rebuild === 'confirm',
              rebuild === 'error' ? T.faultBg : T.warnBg,
              rebuild === 'error' ? T.faultBd : T.warnBd,
              rebuild === 'error' ? T.faultT : T.warnT,
            ),
            width: '100%',
            marginTop: 6,
          }}
        >
          {rebuildLabel}
        </button>
      )}
    </>
  );
};

export default NodeDrawerActions;
