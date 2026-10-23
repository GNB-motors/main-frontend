import React from 'react';
import { MONO } from './drawerFonts';

const NodeDrawerMirror = ({ T, mirror, sectionTitle }) => (
  <>
    <div style={sectionTitle}>CLICKHOUSE MIRROR</div>
    <div
      style={{
        borderRadius: 9,
        overflow: 'hidden',
        border: `1px solid ${T.l7}`,
        background: T.f1,
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${T.l3}`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flex: 'none',
            background: mirror.ok ? T.ok : T.void,
            border: mirror.ok ? 'none' : `1.5px dashed ${T.hollow2}`,
          }}
          aria-hidden="true"
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: mirror.ok ? T.t3 : T.t5,
            overflowWrap: 'anywhere',
          }}
        >
          {mirror.name}
        </span>
      </div>
      {mirror.rows.map((r) => (
        <div
          key={r.k}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            borderBottom: `1px solid ${T.l1}`,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              color: T.t5,
              whiteSpace: 'nowrap',
            }}
          >
            {r.k}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              fontVariantNumeric: 'tabular-nums',
              color: mirror.ok ? T.t3 : T.t5,
              overflowWrap: 'anywhere',
              textAlign: 'right',
            }}
          >
            {r.v}
          </span>
        </div>
      ))}
    </div>
  </>
);

export default NodeDrawerMirror;
