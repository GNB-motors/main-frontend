import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  isSameDay,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import './DateRangeFilter.css';

const PRESETS = [
  { key: 'today', label: 'Today', range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { key: 'thisWeek', label: 'This Week', range: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfDay(new Date()) }) },
  { key: 'thisMonth', label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { key: 'thisYear', label: 'This Year', range: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
  { key: 'allTime', label: 'All Time', range: () => null },
];

function labelForValue(value) {
  if (!value?.startDate || !value?.endDate) return 'All Time';
  const start = new Date(value.startDate);
  const end = new Date(value.endDate);

  for (const preset of PRESETS) {
    if (preset.key === 'allTime') continue;
    const presetRange = preset.range();
    if (
      presetRange &&
      isSameDay(presetRange.from, start) &&
      isSameDay(presetRange.to, end)
    ) {
      return preset.label;
    }
  }
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}

/**
 * Popover date-range control: preset shortcuts (Today / This Week / This Month /
 * This Year / All Time) alongside a two-month range calendar for a manual pick.
 *
 * onChange receives { startDate, endDate } as ISO strings, or
 * { startDate: null, endDate: null } for "All Time".
 */
const DateRangeFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(undefined);

  const applyRange = (range) => {
    if (!range) {
      onChange({ startDate: null, endDate: null });
    } else {
      onChange({ startDate: range.from.toISOString(), endDate: range.to.toISOString() });
    }
    setDraftRange(undefined);
    setOpen(false);
  };

  const handlePreset = (preset) => applyRange(preset.range());

  const handleCalendarSelect = (range) => {
    setDraftRange(range);
    if (range?.from && range?.to) {
      applyRange({ from: startOfDay(range.from), to: endOfDay(range.to) });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="date-range-trigger">
          <CalendarDays size={15} />
          <span>{labelForValue(value)}</span>
          <ChevronDown size={14} className="date-range-trigger-chevron" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="date-range-popover">
        <div className="date-range-popover-body">
          <div className="date-range-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="date-range-preset-btn"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="date-range-calendar">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draftRange}
              onSelect={handleCalendarSelect}
              disabled={{ after: new Date() }}
            />
            <p className="date-range-calendar-hint">
              Pick a start and end date to apply a custom range.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
