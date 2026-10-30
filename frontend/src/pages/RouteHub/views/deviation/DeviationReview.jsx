import { useState } from 'react';
import Ico from '../../routeHubIcons.jsx';
import { REVIEW_REASONS, isOpen, reasonLabel } from './deviationRules.js';

/** Mark reviewed (optionally saying why) or reopen. Reviewing is "seen", not a verdict. */
export default function DeviationReview({ event, busy, onReview }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen(event)) {
    return (
      <div className="dev-review">
        <span className="pill" style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}>
          <Ico n="check" s={11} />
          Reviewed
        </span>
        <span className="muted">
          {[reasonLabel(event.reviewReason), event.reviewNote].filter(Boolean).join(' · ') ||
            'No reason given'}
        </span>
        <span className="sp" />
        <button
          type="button"
          className="btn btn--sm"
          disabled={busy}
          onClick={() => onReview({ status: 'OPEN' })}
        >
          Reopen
        </button>
      </div>
    );
  }

  return (
    <div className="dev-review">
      <label className="field">
        <select
          aria-label="Why did the truck leave the usual route?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Reason (optional)</option>
          {REVIEW_REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field grow">
        <input
          type="text"
          maxLength={500}
          aria-label="Note"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn btn--sm"
        disabled={busy}
        onClick={() =>
          onReview({
            status: 'REVIEWED',
            reason: reason || undefined,
            note: note.trim() || undefined,
          })
        }
      >
        <Ico n="eye" s={14} />
        Mark reviewed
      </button>
    </div>
  );
}
