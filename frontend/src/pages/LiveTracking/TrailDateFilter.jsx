import { useState } from 'react';
import trailDateWindow from './trailDateWindow.js';

export default function TrailDateFilter({ selection, loading, notice, onSelect }) {
  const [choice, setChoice] = useState(null);
  const [draftRange, setDraftRange] = useState({});
  const selectionKey = trailDateWindow.key(selection);
  const activePeriod = choice?.selectionKey === selectionKey ? choice.period : selection.period;
  const customOpen = activePeriod === 'custom';
  const currentDay = trailDateWindow.today();
  const startDate = draftRange.startDate ?? selection.startDate ?? currentDay;
  const endDate = draftRange.endDate ?? selection.endDate ?? currentDay;
  const customSelection = { period: 'custom', startDate, endDate };
  let validation = '';
  try {
    trailDateWindow.resolve(customSelection);
  } catch (error) {
    validation = error.message;
  }
  const choose = (period) => {
    setChoice({ selectionKey, period });
    onSelect({ period });
  };

  return (
    <div className="lt-trail-date-filter" aria-label="Trail date filter">
      <div className="lt-trail-date-head">
        <strong>Trail date</strong>
        <span>{loading ? 'Loading…' : `${trailDateWindow.label(selection)} · IST`}</span>
      </div>
      <div className="lt-trail-date-options" role="group" aria-label="Trail day">
        <button
          type="button"
          aria-pressed={activePeriod === 'today'}
          disabled={loading}
          onClick={() => choose('today')}
        >
          Today
        </button>
        <button
          type="button"
          aria-pressed={activePeriod === 'yesterday'}
          disabled={loading}
          onClick={() => choose('yesterday')}
        >
          Yesterday
        </button>
        <button
          type="button"
          aria-pressed={customOpen}
          aria-expanded={customOpen}
          disabled={loading}
          onClick={() => setChoice({ selectionKey, period: 'custom' })}
        >
          Custom date
        </button>
      </div>
      {customOpen && (
        <form
          className="lt-trail-custom-date"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading && !validation) onSelect(customSelection);
          }}
        >
          <label>
            <span>Start date</span>
            <input
              type="date"
              aria-label="Start date"
              value={startDate}
              max={currentDay}
              disabled={loading}
              onChange={(event) =>
                setDraftRange((prev) => ({ ...prev, startDate: event.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>End date</span>
            <input
              type="date"
              aria-label="End date"
              value={endDate}
              min={startDate || undefined}
              max={currentDay}
              disabled={loading}
              onChange={(event) =>
                setDraftRange((prev) => ({ ...prev, endDate: event.target.value }))
              }
              required
            />
          </label>
          <button type="submit" disabled={loading || Boolean(validation)}>
            Show trail
          </button>
          {validation && (
            <div className="lt-trail-range-error" role="status">
              {validation}
            </div>
          )}
        </form>
      )}
      {notice && (
        <div className="lt-trail-notice" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
