import React from 'react';

/* 24h time scrubber (Phase 5): a range control over the pulse history.
   `value` is a bucket index or null (live = the freshest bucket driving
   the normal rollup). The label always says what the graph is showing —
   scrubbed into the past must never read as stale/broken data. */
const hhmm = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const LemuTimeScrubber = ({ buckets, value, onChange }) => {
  const max = Math.max(0, (buckets?.length || 1) - 1);
  const idx = value == null ? max : Math.min(value, max);
  const bucket = buckets?.[idx];
  return (
    <div className="lemu-graph3d__scrubber lemu-graph3d__panel" role="group" aria-label="Replay activity over the pulse history">
      <button
        type="button"
        className={value == null
          ? 'lemu-graph3d__scrubber-live lemu-graph3d__scrubber-live--on'
          : 'lemu-graph3d__scrubber-live'}
        aria-pressed={value == null}
        onClick={() => onChange(null)}
      >
        Live
      </button>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={idx}
        disabled={!buckets?.length}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Scrub back through the pulse history"
      />
      <span className="lemu-graph3d__scrubber-time">
        {value == null ? 'live' : `showing ${hhmm(bucket?.bucketStart)}`}
      </span>
    </div>
  );
};

export default LemuTimeScrubber;
