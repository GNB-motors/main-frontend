import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { PERIOD_PRESETS, isYmd } from './intelligenceModel';

/**
 * IntelligencePeriodPicker — which days the page is about.
 *
 * The choice lives in the URL as two dates (contract §0: a date-only `from`
 * is IST midnight, a date-only `to` is the end of that IST day), so a shared
 * link and the Back button both come back to the same days.
 */
export default function IntelligencePeriodPicker({ period, onPreset, onCustom }) {
  const [showCustom, setShowCustom] = useState(false);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const buttons = PERIOD_PRESETS.filter((preset) => preset.id !== 'custom');

  const handleCustomChange = () => {
    const nextFrom = fromRef.current?.value ?? '';
    const nextTo = toRef.current?.value ?? '';
    // A half-typed date is not a period yet, so nothing is written to the URL.
    if (isYmd(nextFrom) && isYmd(nextTo) && nextFrom <= nextTo) {
      onCustom({ from: nextFrom, to: nextTo });
    }
  };

  const customOpen = showCustom || period?.preset === 'custom';

  return (
    <div className="flex flex-col items-end gap-2">
      <div
        role="group"
        aria-label="Period"
        className="flex flex-wrap items-center gap-1 rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-1"
      >
        {buttons.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={period?.preset === preset.id}
            onClick={() => onPreset(preset.id)}
            className={`rounded-[var(--rd-radius-xs)] px-2.5 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)] ${
              period?.preset === preset.id
                ? 'bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
                : 'text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)]'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={customOpen}
          aria-expanded={customOpen}
          onClick={() => setShowCustom((open) => !open)}
          className={`inline-flex items-center gap-1 rounded-[var(--rd-radius-xs)] px-2.5 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)] ${
            customOpen
              ? 'bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
              : 'text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)]'
          }`}
        >
          <CalendarDays size={14} aria-hidden="true" />
          Custom
        </button>
      </div>

      {customOpen ? (
        <div className="flex items-center gap-2" key={`${period?.from}-${period?.to}`}>
          <label className="flex items-center gap-1 text-[12px] text-[var(--rd-ink-2)]">
            From
            <input
              ref={fromRef}
              type="date"
              defaultValue={period?.from ?? ''}
              max={period?.to ?? undefined}
              onChange={handleCustomChange}
              aria-label="Period from date"
              className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] text-[var(--rd-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
            />
          </label>
          <label className="flex items-center gap-1 text-[12px] text-[var(--rd-ink-2)]">
            To
            <input
              ref={toRef}
              type="date"
              defaultValue={period?.to ?? ''}
              min={period?.from ?? undefined}
              onChange={handleCustomChange}
              aria-label="Period to date"
              className="rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] text-[var(--rd-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
