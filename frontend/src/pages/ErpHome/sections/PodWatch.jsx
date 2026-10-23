import React from 'react';
import CcIcon from '../commandCenterIcons';
import { RED, AMB, GRN } from '../commandCenterTones';
import { pct } from '../commandCenterFormat';

function PodWatch({ summary, onOpen }) {
  const ageing = summary?.pendingCounts?.podAgeing || {};
  const total = summary?.pendingCounts?.pendingPods || 0;
  const buckets = [
    { l: 'Under 7 days', n: ageing.under7d || 0, ...GRN, bar: '#25BA4C' },
    { l: '7–14 days', n: ageing.from7to14d || 0, ...AMB, bar: '#F0AA48' },
    { l: 'Over 14 days', n: ageing.over14d || 0, ...RED, bar: '#C2323A' },
  ];
  const oldest = summary?.podOldest || [];

  return (
    <div className="card" id="pod">
      <div className="card-head">
        <span style={{ color: 'var(--fg-brand)', display: 'inline-flex' }}>
          <CcIcon n="clock" />
        </span>
        <h2>POD ageing watch</h2>
      </div>
      <div className="pod-body">
        <div>
          <div className="pod-total">
            <span className="v">{total}</span>
            <span className="hint" style={{ color: 'var(--fg-secondary)' }}>
              trips closed, waiting for the physical POD
            </span>
          </div>
        </div>
        <div className="pod-bar">
          {total > 0 &&
            buckets.map((b) => (
              <i key={b.l} style={{ width: pct(b.n, total), background: b.bar }} />
            ))}
        </div>
        <div className="buckets">
          {buckets.map((b) => (
            <button
              type="button"
              key={b.l}
              className="bucket"
              style={{ '--c': b.c }}
              onClick={onOpen}
            >
              <div className="k">{b.l}</div>
              <div className="v">{b.n}</div>
            </button>
          ))}
        </div>
        <div className="oldest">
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            Oldest waiting
          </div>
          {oldest.length ? (
            oldest.map((t) => {
              const tone = t.ageDays > 14 ? RED : t.ageDays >= 7 ? AMB : GRN;
              return (
                <div className="orow" key={t._id}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="strong">
                      {t.vehicleNumber || '—'}{' '}
                      <span className="mono muted" style={{ fontWeight: 400 }}>
                        {t.ref}
                      </span>
                    </div>
                    <div className="muted">{t.partyName || '—'}</div>
                  </div>
                  <span className="pill" style={{ '--c': tone.c, '--tint': tone.tint }}>
                    {t.ageDays}d
                  </span>
                </div>
              );
            })
          ) : (
            <div className="orow">
              <span className="muted">No PODs outstanding.</span>
            </div>
          )}
        </div>
        <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={onOpen}>
          View all POD trips <CcIcon n="arrowR" s={14} />
        </button>
      </div>
    </div>
  );
}

export default PodWatch;
