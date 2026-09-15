import React, { useMemo } from 'react';
import LemuStatusChip from './LemuStatusChip';

/* Inline SVG sparkline for pulse buckets. 10 bars, latest right. */
const LemuNodePulse = ({ series, kind, window = 60 }) => {
  const bars = useMemo(() => {
    const latest = (series || []).slice(0, 10).reverse();
    if (!latest.length) return [];

    if (kind === 'route') {
      const maxN = Math.max(1, ...latest.map((b) => b.n || 0));
      return latest.map((b, i) => ({
        key: i,
        h: Math.max(2, ((b.n || 0) / maxN) * 48),
        label: `n ${b.n || 0}, err ${b.err || 0}`,
        err: b.err || 0,
      }));
    }

    if (kind === 'model') {
      const totals = latest.map((b) => (b.find || 0) + (b.insert || 0) + (b.update || 0) + (b.del || 0) + (b.agg || 0));
      const maxOps = Math.max(1, ...totals);
      return latest.map((b, i) => {
        const total = (b.find || 0) + (b.insert || 0) + (b.update || 0) + (b.del || 0) + (b.agg || 0);
        return {
          key: i,
          h: Math.max(2, (total / maxOps) * 48),
          label: `find ${b.find || 0} · ins ${b.insert || 0} · upd ${b.update || 0} · del ${b.del || 0} · agg ${b.agg || 0}`,
          err: 0,
        };
      });
    }

    return [];
  }, [series, kind]);

  if (!bars.length) {
    return (
      <div className="lemu-pulse lemu-pulse--empty">
        <div className="lemu-pulse__empty">Exists, but nothing has called it in the last 60m.</div>
      </div>
    );
  }

  const realCount = (series || []).length;
  const sparse = realCount < 10;

  return (
    <div className="lemu-pulse">
      <svg width="220" height="56" className="lemu-pulse__svg" role="img" aria-label="Pulse sparkline">
        {bars.map((bar, i) => (
          <rect
            key={bar.key}
            x={i * 22 + 2}
            y={54 - bar.h}
            width="18"
            height={bar.h}
            rx="2"
            className={bar.err > 0 ? 'lemu-pulse__bar lemu-pulse__bar--err' : 'lemu-pulse__bar'}
          >
            <title>{bar.label}</title>
          </rect>
        ))}
      </svg>
      {sparse && (
        <div className="lemu-pulse__sparse">{realCount} of {window} buckets</div>
      )}
    </div>
  );
};

export default LemuNodePulse;
