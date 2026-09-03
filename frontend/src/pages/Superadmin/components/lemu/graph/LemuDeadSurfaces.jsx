import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

/* The standing dead-surface panel (Phase 5). Groups are rendered in
   SEVERITY order: a job that reports success while writing nothing is the
   sneakiest failure, so zeroOutputJobs leads; disabled-by-flag is
   configuration, not a fault, so it renders last and muted. A group only
   appears when it has rows; the header counts describe the full layer. */
const GROUPS = [
  ['zeroOutputJobs', 'Zero-output runs'],
  ['neverRanJobs', 'Never ran'],
  ['orphanModules', 'Orphan modules'],
  ['idleModels', 'Idle models'],
  ['quietMounts', 'Quiet mounts'],
  ['disabledJobs', 'Disabled by flag'],
];

const LemuDeadSurfaces = ({ surfaces, onSelectNode }) => {
  const [open, setOpen] = useState(false);
  const total = useMemo(
    () => GROUPS.reduce((n, [key]) => n + (surfaces?.[key]?.length || 0), 0),
    [surfaces],
  );
  if (!total) return null;

  return (
    <section className="lemu-graph3d__dead lemu-graph3d__panel" aria-label="Dead surfaces">
      <button
        type="button"
        className="lemu-graph3d__dead-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight size={13} className={open ? 'lemu-graph3d__dead-caret lemu-graph3d__dead-caret--open' : 'lemu-graph3d__dead-caret'} aria-hidden="true" />
        Dead surfaces <b>{total}</b>
      </button>
      {open && (
        <div className="lemu-graph3d__dead-body">
          {GROUPS.map(([key, label]) => {
            const rows = surfaces[key] || [];
            if (!rows.length) return null;
            const muted = key === 'disabledJobs';
            return (
              <div key={key} className={muted ? 'lemu-graph3d__dead-group lemu-graph3d__dead-group--muted' : 'lemu-graph3d__dead-group'}>
                <div className="lemu-graph3d__dead-group-head">
                  {label} <b>{rows.length}</b>
                </div>
                <ul>
                  {rows.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="lemu-graph3d__dead-row"
                        title={r.reason}
                        onClick={() => onSelectNode?.(r.id)}
                      >
                        <span className="lemu-graph3d__dead-label">{r.label}</span>
                        <span className="lemu-graph3d__dead-reason">{r.reason}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LemuDeadSurfaces;
