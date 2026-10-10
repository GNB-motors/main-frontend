import { useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RANGE_PRESETS, dateOf, rangeLabel, ymdOf } from './tripRange';

const narrowScreen = () => typeof window !== 'undefined' && window.innerWidth < 640;

/** Open on last month + this month, so the second month isn't all future days. */
const firstShownMonth = (months) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
};

/**
 * The Trip list's period dropdown: preset periods, or a custom from–to picked on a
 * calendar. A custom pick only applies on "Apply", so half a range never reloads the list.
 */
export default function TripRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('presets');
  const [draft, setDraft] = useState(undefined);

  const openChange = (next) => {
    setOpen(next);
    if (next) {
      setView(value.range === 'custom' ? 'custom' : 'presets');
      setDraft(
        value.range === 'custom' ? { from: dateOf(value.from), to: dateOf(value.to) } : undefined,
      );
    }
  };

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draft?.from) return;
    const from = ymdOf(draft.from);
    const to = ymdOf(draft.to || draft.from);
    pick({ range: 'custom', from, to });
  };

  const months = narrowScreen() ? 1 : 2;
  const filtered = value.range !== 'all';
  const draftText = draft?.from
    ? rangeLabel({
        range: 'custom',
        from: ymdOf(draft.from),
        to: ymdOf(draft.to || draft.from),
      })
    : 'Pick a start date, then an end date';

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        className={`atx-range-trigger${filtered ? ' atx-range-trigger--on' : ''}`}
        aria-label={`Trips in: ${rangeLabel(value)}`}
      >
        <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
        <span>{rangeLabel(value)}</span>
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" className="atx-range-chev" />
      </PopoverTrigger>
      <PopoverContent align="end" className="atx-scope atx-range-pop w-auto p-0">
        {view === 'presets' ? (
          <div className="atx-range-list" role="listbox" aria-label="Date range">
            {RANGE_PRESETS.map((p) => {
              const active = value.range === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className="atx-range-opt"
                  onClick={() => pick({ range: p.key })}
                >
                  <span>{p.label}</span>
                  {active ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                </button>
              );
            })}
            <div className="atx-range-sep" role="presentation" />
            <button
              type="button"
              role="option"
              aria-selected={value.range === 'custom'}
              className="atx-range-opt"
              onClick={() => setView('custom')}
            >
              <span>Custom range…</span>
              {value.range === 'custom' ? (
                <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              ) : null}
            </button>
          </div>
        ) : (
          <div className="atx-range-custom">
            <button type="button" className="atx-range-back" onClick={() => setView('presets')}>
              <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
              Presets
            </button>
            <Calendar
              mode="range"
              numberOfMonths={months}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from || firstShownMonth(months)}
              endMonth={new Date()}
              disabled={{ after: new Date() }}
              weekStartsOn={1}
            />
            <div className="atx-range-foot">
              <span className="atx-range-draft">{draftText}</span>
              <button type="button" className="atx-btn atx-btn--sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="atx-btn atx-btn--sm atx-btn--primary"
                disabled={!draft?.from}
                onClick={applyCustom}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
