import React from 'react';
import { MONO } from './drawerFonts';

const NodeDrawerFunctions = ({ T, fnRows, sectionTitle }) => {
  const card = {
    border: `1px solid ${T.l5}`,
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: 16,
  };

  return (
    <>
      <div style={sectionTitle}>OWNED FUNCTIONS</div>
      <div style={card}>
        {fnRows.slice(0, 50).map((f, i) => (
          <div
            key={`${f.ref}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '6px 10px',
              borderBottom: `1px solid ${T.l2}`,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: MONO,
                fontSize: 11,
                color: T.t3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {f.name}
            </span>
            {f.count > 1 && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontVariantNumeric: 'tabular-nums',
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: T.f4,
                  color: T.t5,
                  whiteSpace: 'nowrap',
                }}
              >
                ×{f.count}
              </span>
            )}
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontVariantNumeric: 'tabular-nums',
                color: T.t5,
                whiteSpace: 'nowrap',
              }}
            >
              {f.loc}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: T.link,
                whiteSpace: 'nowrap',
              }}
            >
              {f.ref}
            </span>
          </div>
        ))}
        {fnRows.length === 0 && (
          <div
            style={{
              padding: 10,
              fontFamily: MONO,
              fontSize: 10.5,
              color: T.t6,
              textAlign: 'center',
            }}
          >
            no functions attributed
          </div>
        )}
      </div>
      {fnRows.length > 50 && (
        <div style={{ ...sectionTitle, marginTop: -12 }}>showing 50 of {fnRows.length}</div>
      )}
    </>
  );
};

export default NodeDrawerFunctions;
