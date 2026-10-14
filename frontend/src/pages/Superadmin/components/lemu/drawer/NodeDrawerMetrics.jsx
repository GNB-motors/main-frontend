import React from 'react';
import { MONO } from './drawerFonts';

const NodeDrawerMetrics = ({ T, metrics, sectionTitle }) => (
  <>
    <div style={sectionTitle}>METRICS</div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        marginBottom: 16,
      }}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            border: `1px solid ${T.l5}`,
            borderRadius: 8,
            padding: '8px 10px',
            background: m.ok === false ? T.sunk2 : T.f2,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: '.09em',
              color: T.t5,
              marginBottom: 4,
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-.01em',
              color: m.ok === false ? T.t6 : T.t2,
              overflowWrap: 'anywhere',
            }}
          >
            {m.value}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: T.t6, marginTop: 2 }}>{m.sub}</div>
        </div>
      ))}
    </div>
  </>
);

export default NodeDrawerMetrics;
