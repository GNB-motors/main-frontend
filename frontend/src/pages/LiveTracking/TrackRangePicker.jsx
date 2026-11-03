import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatIst, formatIstDate } from '../../utils/redesign/format';
import { isLongRange, rangePresets } from './trackUrlModel';

/**
 * TrackRangePicker — the "Range" button on the timeline.
 *
 * Four presets that apply at once, and a custom range with a date and a
 * time for each end, in IST — because "yesterday 6 pm" is when the owner
 * wants to look, and a date alone is not enough to find it.
 */
export default function TrackRangePicker({
  from = null,
  to = null,
  trip = null,
  onApply,
  trigger = null,
}) {
  const [customFrom, setCustomFrom] = useState(() => toLocalInput(from));
  const [customTo, setCustomTo] = useState(() => toLocalInput(to));

  // Presets are always relative to the real clock, never to the current range —
  // otherwise picking "Yesterday" would move the clock back and the next
  // "Yesterday" would mean the day before. (bug: presets must not drift)
  const presets = rangePresets({ now: new Date(), trip });

  // Which preset the current range matches, so it can read as selected.
  const activeId =
    (from &&
      to &&
      presets.find(
        (p) =>
          Math.abs(p.from.getTime() - from.getTime()) < 60000 &&
          Math.abs(p.to.getTime() - to.getTime()) < 60000,
      )?.id) ||
    null;

  const applyPreset = (preset) => {
    onApply?.({ from: preset.from, to: preset.to });
  };

  const applyCustom = () => {
    const fromDate = fromLocalInput(customFrom);
    const toDate = fromLocalInput(customTo);
    if (!fromDate || !toDate) return;
    onApply?.({ from: fromDate, to: toDate });
  };

  const long = isLongRange({ from, to });

  return (
    <Popover>
      <PopoverTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              Range
            </Button>
          )
        }
      />
      <PopoverContent
        align="end"
        className="w-[300px] border-[var(--rd-line)] bg-[var(--rd-card)] p-3"
      >
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-[var(--rd-ink-2)]">Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={activeId === preset.id}
                  className={`rounded-[var(--rd-radius-sm)] border px-2.5 py-1 text-[12px] transition-colors ${
                    activeId === preset.id
                      ? 'border-[#2563eb] font-semibold text-[#2563eb]'
                      : 'border-[var(--rd-line)] font-medium text-[var(--rd-ink-2)] hover:border-[var(--rd-line-strong)] hover:text-[var(--rd-ink)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-[var(--rd-ink-2)]">
              Custom (IST)
            </p>
            <label className="mb-1 flex items-center gap-2 text-[12px] text-[var(--rd-ink-2)]">
              From
              <input
                type="date"
                aria-label="From date"
                value={customFrom.date}
                onChange={(event) =>
                  setCustomFrom((prev) => ({ ...prev, date: event.target.value }))
                }
                className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-1.5 py-1 text-[12px] text-[var(--rd-ink)]"
              />
              <input
                type="time"
                step="60"
                aria-label="From time"
                value={customFrom.time}
                onChange={(event) =>
                  setCustomFrom((prev) => ({ ...prev, time: event.target.value }))
                }
                className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-1.5 py-1 text-[12px] text-[var(--rd-ink)]"
              />
            </label>
            <label className="mb-2 flex items-center gap-2 text-[12px] text-[var(--rd-ink-2)]">
              To
              <input
                type="date"
                aria-label="To date"
                value={customTo.date}
                onChange={(event) => setCustomTo((prev) => ({ ...prev, date: event.target.value }))}
                className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-1.5 py-1 text-[12px] text-[var(--rd-ink)]"
              />
              <input
                type="time"
                step="60"
                aria-label="To time"
                value={customTo.time}
                onChange={(event) => setCustomTo((prev) => ({ ...prev, time: event.target.value }))}
                className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-1.5 py-1 text-[12px] text-[var(--rd-ink)]"
              />
            </label>
            <Button size="sm" onClick={applyCustom} disabled={!customFrom.date || !customTo.date}>
              Show
            </Button>
          </div>

          {from && to ? (
            <p className="m-0 text-[11px] text-[var(--rd-ink-3)]">
              Now showing {formatIstDate(from)} {formatIst(from, { withDate: false })} –{' '}
              {formatIstDate(to)} {formatIst(to, { withDate: false })}
            </p>
          ) : null}

          {long ? (
            <p className="m-0 text-[11px] text-[var(--rd-watch-ink)]">
              Long range: the path is simplified; zoom in on the timeline for detail.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A Date as the date and time an `<input type="date">` expects, in IST. */
function toLocalInput(date) {
  if (!date) return { date: '', time: '' };
  const shifted = new Date(date.getTime() + (330 + date.getTimezoneOffset()) * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`,
    time: `${pad(shifted.getHours())}:${pad(shifted.getMinutes())}`,
  };
}

/** The date and time an `<input type="date">` holds, as an IST Date. */
function fromLocalInput({ date, time }) {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = (time || '00:00').split(':').map(Number);
  if (!year || !month || !day) return null;
  const utc = Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0);
  const value = new Date(utc);
  return Number.isNaN(value.getTime()) ? null : value;
}
