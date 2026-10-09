import React, { useEffect, useState } from 'react';
import { HUB_DATE_PRESETS, rangeLabel } from '../mileageRows';
import SegmentedChips from './SegmentedChips';

const CUSTOM = 'CUSTOM';

/**
 * The hub's one date filter: quick dates, or "Pick dates" for any from–to.
 * `preset` is the quick choice in force, null when the range was picked.
 */
export default function HubDateBar({ preset, range, onPreset, onRange }) {
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState(range);
  const [problem, setProblem] = useState('');
  const open = picking || !preset;

  useEffect(() => {
    setDraft(range);
  }, [range]);

  const choose = (key) => {
    if (key === CUSTOM) {
      setDraft(range);
      setProblem('');
      setPicking(true);
      return;
    }
    setPicking(false);
    onPreset(key);
  };

  const handleFromChange = (newFrom) => {
    const next = { ...draft, from: newFrom };
    setDraft(next);
    if (newFrom && next.to && newFrom <= next.to) {
      setProblem('');
      onRange({ from: newFrom, to: next.to });
    }
  };

  const handleToChange = (newTo) => {
    const next = { ...draft, to: newTo };
    setDraft(next);
    if (next.from && newTo && next.from <= newTo) {
      setProblem('');
      onRange({ from: next.from, to: newTo });
    }
  };

  const apply = (e) => {
    e.preventDefault();
    if (!draft.from || !draft.to || draft.from > draft.to) {
      setProblem('Pick a start date on or before the end date.');
      return;
    }
    setProblem('');
    setPicking(false);
    onRange(draft);
  };

  return (
    <section className="mhub-datebar" aria-label="Dates">
      <span className="mhub-datebar-label">Dates</span>
      <SegmentedChips
        ariaLabel="Quick dates"
        options={[...HUB_DATE_PRESETS, { key: CUSTOM, label: 'Pick dates' }]}
        value={open ? CUSTOM : preset}
        onChange={choose}
      />
      <span className="mhub-range">
        Showing <b>{rangeLabel(range)}</b>
      </span>
      <form className={`mhub-custom${open ? ' open' : ''}`} onSubmit={apply}>
        <label htmlFor="hub-from">
          From
          <input
            id="hub-from"
            aria-label="From date"
            type="date"
            value={draft.from || ''}
            max={draft.to || undefined}
            onChange={(e) => handleFromChange(e.target.value)}
          />
        </label>
        <label htmlFor="hub-to">
          To
          <input
            id="hub-to"
            aria-label="To date"
            type="date"
            value={draft.to || ''}
            min={draft.from || undefined}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </label>
        <button type="submit" className="pshell-btn pshell-btn--primary">
          Show these dates
        </button>
        {problem && (
          <span className="mhub-custom-problem" role="alert">
            {problem}
          </span>
        )}
      </form>
    </section>
  );
}
