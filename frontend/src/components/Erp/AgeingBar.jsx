import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AGEING_ORDER, ageingColor } from '../../utils/erpChartTheme';
import { inr, num, pct } from '../../utils/formatMoney';

/**
 * AgeingBar — a stacked bar of ageing buckets, plus the numbers underneath.
 *
 * The micro-table is not optional decoration. A stacked bar answers "roughly
 * how bad is it"; an accounts person then needs the exact figure to chase, and
 * a hover tooltip is not somewhere you can read from, copy, or print. Bar for
 * the shape, table for the number.
 *
 * Every segment and every row is clickable through to the filtered list, so the
 * chart is a navigation control rather than a picture.
 *
 * @param {Array<{bucket:string, amount:number, count:number}>} buckets
 * @param {(bucket:string) => string|null} linkFor  destination per bucket
 */
const AgeingBar = ({
  title = null,
  buckets = [],
  total = 0,
  linkFor = null,
  onBucketClick = null,
  loading = false,
  emptyText = 'Nothing outstanding',
}) => {
  const navigate = useNavigate();
  const byBucket = new Map(buckets.map((b) => [b.bucket, b]));
  const ordered = AGEING_ORDER
    .map((bucket) => byBucket.get(bucket) || { bucket, amount: 0, count: 0 })
    .filter((b) => b.amount > 0 || b.count > 0);

  const sum = total || ordered.reduce((acc, b) => acc + (b.amount || 0), 0);

  const activate = (bucket) => {
    if (onBucketClick) onBucketClick(bucket);
    else if (linkFor) {
      const path = linkFor(bucket);
      if (path) navigate(path);
    }
  };

  if (loading) {
    return (
      <div className="erp-card" style={{ padding: '18px 20px' }}>
        {title && <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700 }}>{title}</h3>}
        <div
          style={{
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'erpShimmer 1.5s infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div className="erp-card" style={{ padding: '18px 20px' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{title}</h3>
          <span className="erp-numeric" style={{ fontSize: '15px', fontWeight: 700 }}>{inr(sum)}</span>
        </div>
      )}

      {ordered.length === 0 || sum <= 0 ? (
        <p className="erp-muted" style={{ margin: 0, fontSize: '13px' }}>{emptyText}</p>
      ) : (
        <>
          <div className="erp-ageing-track" role="img" aria-label={`Ageing breakdown totalling ${inr(sum)}`}>
            {ordered.map((b) => {
              const share = pct(b.amount, sum);
              if (share <= 0) return null;
              return (
                <button
                  key={b.bucket}
                  type="button"
                  className="erp-ageing-seg"
                  style={{ width: `${share}%`, background: ageingColor(b.bucket) }}
                  onClick={() => activate(b.bucket)}
                  title={`${b.bucket}: ${inr(b.amount)} (${b.count} bills)`}
                  aria-label={`${b.bucket}: ${inr(b.amount)}, ${b.count} bills`}
                />
              );
            })}
          </div>

          <table className="erp-table compact" style={{ marginTop: '14px', minWidth: 0 }}>
            <thead>
              <tr>
                <th>Bucket</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Bills</th>
                <th style={{ textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((b) => (
                <tr
                  key={b.bucket}
                  className="clickable"
                  onClick={() => activate(b.bucket)}
                >
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span className="erp-ageing-swatch" style={{ background: ageingColor(b.bucket) }} />
                      {b.bucket === 'CURRENT' ? 'Not yet due' : b.bucket === 'UNKNOWN' ? 'No due date' : `${b.bucket} days`}
                    </span>
                  </td>
                  <td className="erp-numeric" style={{ textAlign: 'right' }}>{inr(b.amount)}</td>
                  <td className="erp-numeric" style={{ textAlign: 'right' }}>{num(b.count)}</td>
                  <td className="erp-numeric" style={{ textAlign: 'right', color: '#64748b' }}>
                    {pct(b.amount, sum).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AgeingBar;
