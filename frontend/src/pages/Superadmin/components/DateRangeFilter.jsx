import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import './DateRangeFilter.css';

// Monday-start of week (weekStartsOn: 1 semantics)
const startOfWeekMonday = () => dayjs().subtract((dayjs().day() + 6) % 7, 'day').startOf('day');

const PRESETS = [
  { key: 'today', label: 'Today', range: () => ({ from: dayjs().startOf('day'), to: dayjs().endOf('day') }) },
  { key: 'thisWeek', label: 'This Week', range: () => ({ from: startOfWeekMonday(), to: dayjs().endOf('day') }) },
  { key: 'thisMonth', label: 'This Month', range: () => ({ from: dayjs().startOf('month'), to: dayjs().endOf('day') }) },
  { key: 'thisYear', label: 'This Year', range: () => ({ from: dayjs().startOf('year'), to: dayjs().endOf('day') }) },
  { key: 'allTime', label: 'All Time', range: () => null },
];

function labelForValue(value) {
  if (!value?.startDate || !value?.endDate) return 'All Time';
  const start = dayjs(value.startDate);
  const end = dayjs(value.endDate);

  for (const preset of PRESETS) {
    if (preset.key === 'allTime') continue;
    const presetRange = preset.range();
    if (
      presetRange &&
      presetRange.from.isSame(start, 'day') &&
      presetRange.to.isSame(end, 'day')
    ) {
      return preset.label;
    }
  }
  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`;
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
      applyRange({ from: dayjs(range.from).startOf('day'), to: dayjs(range.to).endOf('day') });
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
