import React from 'react';
import { X } from 'lucide-react';
import { hexa } from '../graph/graphTheme';
import { MONO } from './drawerFonts';

const NodeDrawerHeader = ({ T, hue, kind, state, st, name, path, host, closeBtnRef, onClose }) => {
  const chip = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '.06em',
    padding: '3px 8px',
    borderRadius: 5,
  };

  const glyphStyle = {
    width: 15,
    height: 15,
    borderRadius: '50%',
    flex: 'none',
    marginTop: 2,
    background: state === 'measured' ? hue : state === 'unreachable' ? T.voidFault : T.void,
    border:
      state === 'measured'
        ? 'none'
        : state === 'unreachable'
          ? `2px solid ${T.fault}`
          : `2px dashed ${hexa(hue, 0.6)}`,
    boxShadow:
      state === 'measured'
        ? `0 0 12px ${hexa(hue, 0.7)}`
        : state === 'unreachable'
          ? `0 0 0 3px ${T.faultBg}`
          : `inset 0 0 7px ${T.inset2}`,
  };

  const headBg =
    state === 'unreachable'
      ? `linear-gradient(180deg, ${T.faultBg2}, transparent)`
      : state === 'declared'
        ? `linear-gradient(180deg, ${T.hollow4}, transparent)`
        : `linear-gradient(180deg, ${hexa(hue, 0.09)}, transparent)`;

  return (
    <div
      style={{
        padding: '13px 14px 12px',
        borderBottom: `1px solid ${T.l6}`,
        background: headBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={glyphStyle} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 14,
              fontWeight: 500,
              color: T.t1,
              overflowWrap: 'anywhere',
              lineHeight: 1.3,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              color: T.t5,
              marginTop: 3,
              overflowWrap: 'anywhere',
            }}
          >
            {path}
          </div>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          style={{
            flex: 'none',
            border: `1px solid ${T.l10}`,
            background: 'transparent',
            color: T.t4,
            borderRadius: 6,
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
        <span
          style={{
            ...chip,
            background: hexa(hue, 0.12),
            color: hue,
            border: `1px solid ${hexa(hue, 0.3)}`,
          }}
        >
          {kind}
        </span>
        {st && (
          <span
            style={{ ...chip, background: st.bg, color: st.fg, border: st.bd }}
            data-state={state}
          >
            {state === 'declared' ? 'DECLARED · NEVER MEASURED' : state.toUpperCase()}
          </span>
        )}
        <span style={{ ...chip, background: T.f4, color: T.t4, border: `1px solid ${T.l5}` }}>
          {host}
        </span>
      </div>
    </div>
  );
};

export default NodeDrawerHeader;
