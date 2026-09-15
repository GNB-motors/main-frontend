import React from 'react';
import { relativeTime } from '../utils';

/* "Why is this node this colour?" — P2 made visible.

   A status with no visible source is how the ClickHouse breakage hid for
   weeks. Every state must be able to name the row and timestamp behind it,
   and a `declared` node must say plainly that nothing measured it rather
   than leaving the reader to assume it is fine. */
const LemuGraphEvidence = ({ node }) => {
  if (!node || !node.state) return null;
  const { state, evidence, declaredBy, self } = node;
  return (
    <div className="lemu-evidence">
      <div className="lemu-evidence__state" data-state={state}>{state}</div>
      <dl className="lemu-evidence__list">
        <dt>Declared by</dt><dd><code>{declaredBy}</code></dd>
        {evidence ? (
          <>
            <dt>Proved by</dt><dd><code>{evidence.source}</code></dd>
            <dt>Measured</dt><dd title={evidence.at}>{relativeTime(evidence.at)}</dd>
            {evidence.detail && (<><dt>Detail</dt>
              <dd><pre>{JSON.stringify(evidence.detail, null, 1)}</pre></dd></>)}
          </>
        ) : (
          <>
            <dt>Proved by</dt>
            <dd>
              {state === 'unreachable'
                ? 'a probe ran and failed'
                : 'nothing — no measurement in the last 24h'}
            </dd>
          </>
        )}
        {self && (
          <>
            <dt>Traffic</dt>
            <dd>self-measured — LEMUI polls its own endpoints; shown, not counted as proof</dd>
          </>
        )}
      </dl>
    </div>
  );
};

export default LemuGraphEvidence;
