import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import {
  formatInIST,
  istDayEndISO,
  istDayStartISO,
  istDayString,
  shiftDay,
  weekdayOf,
} from '@/utils/dateUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import './DateRangeFilter.css';

// Ranges are IST calendar days ("YYYY-MM-DD"); weeks start on Monday.
const today = () => istDayString();
const mondayOf = (day) => shiftDay(day, -((weekdayOf(day) + 6) % 7));

const PRESETS = [
  { key: 'today', label: 'Today', range: () => ({ from: today(), to: today() }) },
  { key: 'thisWeek', label: 'This Week', range: () => ({ from: mondayOf(today()), to: today() }) },
  {
    key: 'thisMonth',
    label: 'This Month',
    range: () => ({ from: `${today().slice(0, 8)}01`, to: today() }),
  },
  {
    key: 'thisYear',
    label: 'This Year',
    range: () => ({ from: `${today().slice(0, 5)}01-01`, to: today() }),
  },
  { key: 'allTime', label: 'All Time', range: () => null },
];

// The calendar hands back local-midnight Dates for the days the user clicked.
const pickedDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function labelForValue(value) {
  if (!value?.startDate || !value?.endDate) return 'All Time';
  const start = istDayString(value.startDate);
  const end = istDayString(value.endDate);

  for (const preset of PRESETS) {
    if (preset.key === 'allTime') continue;
    const presetRange = preset.range();
    if (presetRange && presetRange.from === start && presetRange.to === end) {
      return preset.label;
    }
  }
  return `${formatInIST(value.startDate, 'D MMM YYYY')} – ${formatInIST(value.endDate, 'D MMM YYYY')}`;
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
      onChange({ startDate: istDayStartISO(range.from), endDate: istDayEndISO(range.to) });
    }
    setDraftRange(undefined);
    setOpen(false);
  };

  const handlePreset = (preset) => applyRange(preset.range());

  const handleCalendarSelect = (range) => {
    setDraftRange(range);
    if (range?.from && range?.to) {
      applyRange({ from: pickedDay(range.from), to: pickedDay(range.to) });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="date-range-trigger">
        <CalendarDays size={15} />
        <span>{labelForValue(value)}</span>
        <ChevronDown size={14} className="date-range-trigger-chevron" />
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
