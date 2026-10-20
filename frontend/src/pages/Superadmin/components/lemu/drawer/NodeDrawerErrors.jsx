import React from 'react';
import { nf, stampUTC, errorWindowLabel } from '../graph/drawerModel';
import { relativeTime } from '../utils';
import { MONO } from './drawerFonts';

const NodeDrawerErrors = ({ T, graphKey, errorAttribution, sectionTitle }) => {
  const errorGroups = (errorAttribution?.groups || [])
    .filter((g) => g.nodeId === graphKey)
    .sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
  const windowLabel = errorWindowLabel(errorAttribution?.windowHours);
  const windowFrom = errorAttribution?.generatedAt
    ? stampUTC(
        new Date(
          new Date(errorAttribution.generatedAt).getTime() -
            (errorAttribution.windowHours || 720) * 3600 * 1000,
        ).toISOString(),
      ).replace(' UTC', '')
    : null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ ...sectionTitle, margin: 0 }}>ATTRIBUTED ERRORS</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            fontVariantNumeric: 'tabular-nums',
            padding: '1px 6px',
            borderRadius: 4,
            background: errorGroups.length ? T.faultBg : T.f4,
            color: errorGroups.length ? T.faultT : T.t5,
          }}
        >
          {errorGroups.length ? nf(errorGroups.reduce((s, g) => s + (g.occurrences || 0), 0)) : '0'}{' '}
          in {windowLabel}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {errorGroups.slice(0, 10).map((g) => (
          <div
            key={g.fingerprint || g.message}
            style={{
              border: `1px solid ${T.faultBd}`,
              background: T.faultBg2,
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span
                style={{
                  flex: 1,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: T.faultT2,
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}
              >
                {g.message || g.sampleMessage || g.errorName || 'unknown error'}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontVariantNumeric: 'tabular-nums',
                  color: T.faultT,
                  whiteSpace: 'nowrap',
                }}
              >
                {nf(g.occurrences)}×
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 5,
                fontFamily: MONO,
                fontSize: 10,
              }}
            >
              <span style={{ color: T.link, overflowWrap: 'anywhere' }}>
                {g.file
                  ? `${g.file}${Number.isInteger(g.line) ? `:${g.line}` : ''}`
                  : 'file unknown'}
                {' · '}
                <span data-quality={g.matchQuality}>
                  {g.matchQuality === 'exact'
                    ? '✓ exact'
                    : g.matchQuality === 'file'
                      ? '~ file-only'
                      : 'unattributed'}
                </span>
              </span>
              <span
                style={{
                  color: T.t5,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.lastOccurrence ? relativeTime(g.lastOccurrence) : '—'}
              </span>
            </div>
          </div>
        ))}
        {errorGroups.length > 10 && (
          <div style={{ fontFamily: MONO, fontSize: 10, color: T.t5 }}>
            showing 10 of {errorGroups.length} — see the Errors tab
          </div>
        )}
        {errorAttribution == null ? (
          <div
            style={{
              border: `1px solid ${T.l5}`,
              borderRadius: 8,
              padding: '9px 10px',
              fontFamily: MONO,
              fontSize: 10.5,
              color: T.t5,
            }}
          >
            attribution unavailable — could not load
          </div>
        ) : (
          errorGroups.length === 0 && (
            <div
              style={{
                border: `1px solid ${T.l5}`,
                borderRadius: 8,
                padding: '9px 10px',
                fontFamily: MONO,
                fontSize: 10.5,
                color: T.t5,
              }}
            >
              {`no attributed errors in the last ${windowLabel}`}
              {windowFrom ? ` · window ${windowFrom} → now` : ''}
            </div>
          )
        )}
      </div>
    </>
  );
};

export default NodeDrawerErrors;
