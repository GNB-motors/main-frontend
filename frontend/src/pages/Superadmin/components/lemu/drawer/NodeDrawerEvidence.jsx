import React from 'react';
import { MONO } from './drawerFonts';

const NodeDrawerEvidence = ({ T, ev, evTone, sectionTitle }) => (
  <>
    <div style={sectionTitle}>EVIDENCE</div>
    <div
      style={{
        borderRadius: 9,
        overflow: 'hidden',
        marginBottom: 16,
        border: evTone.border,
        background: evTone.bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          borderBottom: evTone.divider,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flex: 'none',
            background: evTone.dot,
            border: evTone.dotBd,
          }}
          aria-hidden="true"
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '.09em',
            color: evTone.titleFg,
          }}
        >
          {ev.title}
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            color: evTone.tsFg,
          }}
        >
          {ev.ts}
        </span>
      </div>
      {ev.query && (
        <div
          style={{
            padding: '9px 10px',
            fontFamily: MONO,
            fontSize: 10.5,
            lineHeight: 1.6,
            color: evTone.queryFg,
            overflowWrap: 'anywhere',
          }}
        >
          {ev.query}
        </div>
      )}
      {ev.value && (
        <div
          style={{
            padding: '0 10px 9px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: '.09em',
              color: T.t5,
            }}
          >
            →
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12.5,
              fontVariantNumeric: 'tabular-nums',
              color: evTone.valueFg,
            }}
          >
            {ev.value}
          </span>
        </div>
      )}
      {(ev.source || ev.method) && (
        <div
          style={{
            padding: '6px 10px',
            borderTop: evTone.divider,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            fontFamily: MONO,
            fontSize: 9.5,
            color: T.t5,
          }}
        >
          <span style={{ overflowWrap: 'anywhere' }}>{ev.source}</span>
          <span>{ev.method}</span>
        </div>
      )}
    </div>
  </>
);

export default NodeDrawerEvidence;
