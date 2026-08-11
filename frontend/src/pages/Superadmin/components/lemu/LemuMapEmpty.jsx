import React from 'react';
import { AlertTriangle, Inbox, RefreshCw, ServerCrash } from 'lucide-react';

/* Map-level empty / error / stale states. Each string matches §07 exactly. */
const LemuMapEmpty = ({ status, onRebuild }) => {
  if (status === 'loading') {
    return (
      <div className="lemu-map-empty lemu-map-empty--loading">
        <div className="lemu-spinner" />
        <div className="lemu-map-empty__title">Reading manifest v— …</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="lemu-map-empty lemu-map-empty--error">
        <div className="lemu-map-empty__icon"><ServerCrash size={24} /></div>
        <div className="lemu-map-empty__title">/manifest failed (500). This is a fetch error, not an empty system.</div>
        <button type="button" className="lemu-btn lemu-btn--secondary" onClick={onRebuild}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="lemu-map-empty lemu-map-empty--empty">
        <div className="lemu-map-empty__icon"><Inbox size={24} /></div>
        <div className="lemu-map-empty__title">No manifest yet — the boot introspector hasn't written one.</div>
        <button type="button" className="lemu-btn lemu-btn--secondary" onClick={onRebuild}>
          <RefreshCw size={14} /> Rebuild
        </button>
      </div>
    );
  }

  if (status === 'stale') {
    return (
      <div className="lemu-map-empty lemu-map-empty--stale">
        <div className="lemu-map-empty__icon"><AlertTriangle size={24} /></div>
        <div className="lemu-map-empty__title">
          Structure v— · — ago. Pulse tint frozen — last bucket — ago, flush timer may be off.
        </div>
      </div>
    );
  }

  return null;
};

export default LemuMapEmpty;
