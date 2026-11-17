import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  toYmd,
  toDmy,
  parseDmyInput,
} from './customReportDateUtils';

/**
 * CustomReportDatePicker
 *
 * Requirements:
 * - Allows users to pick dates via interactive calendar picker popup.
 * - Displays dates strictly in consistent `dd-mm-yyyy` format.
 * - Supports keyboard input in `dd-mm-yyyy` format.
 * - Honors minDate and maxDate to restrict date selection.
 * - Updates state with IST-aligned ISO timestamps for backend queries.
 */
export default function CustomReportDatePicker({
  id = 'cr-datepicker',
  label = 'Date',
  value = '',
  onChange = null,
  minDate = '',
  maxDate = '',
  isEndOfDay = false,
  hasError = false,
  errorMessage = '',
  placeholder = 'dd-mm-yyyy',
}) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const initialYmd = useMemo(() => toYmd(value), [value]);
  const displayValue = useMemo(() => toDmy(value), [value]);
  const [typedText, setTypedText] = useState(displayValue);

  // Synchronise typed text when value changes from outside
  useEffect(() => {
    setTypedText(displayValue);
  }, [displayValue]);

  // Calendar month & year currently viewed
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => {
    if (initialYmd) {
      const [y] = initialYmd.split('-').map(Number);
      return y;
    }
    return today.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (initialYmd) {
      const [, m] = initialYmd.split('-').map(Number);
      return m - 1;
    }
    return today.getMonth();
  });

  // When picker opens, navigate calendar view to selected date if available
  useEffect(() => {
    if (isOpen && initialYmd) {
      const [y, m] = initialYmd.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [isOpen, initialYmd]);

  // Close calendar popup on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const emitDate = (ymd) => {
    if (!ymd) {
      onChange?.('');
      setTypedText('');
      return;
    }
    const isoString = isEndOfDay
      ? `${ymd}T23:59:59.999+05:30`
      : `${ymd}T00:00:00.000+05:30`;
    onChange?.(isoString);
    setTypedText(toDmy(ymd));
  };

  const handleDayClick = (dayNum) => {
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    emitDate(ymd);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    emitDate('');
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const ymd = `${y}-${m}-${d}`;

    if (minDate && ymd < minDate) return;
    if (maxDate && ymd > maxDate) return;

    emitDate(ymd);
    setIsOpen(false);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setTypedText(val);

    if (!val.trim()) {
      onChange?.('');
      return;
    }

    const parsedYmd = parseDmyInput(val);
    if (parsedYmd) {
      emitDate(parsedYmd);
    }
  };

  // Calendar day calculation
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const startWeekday = useMemo(() => {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const day = new Date(viewYear, viewMonth, 1).getDay();
    return (day + 6) % 7; // Convert to 0 = Monday, 6 = Sunday
  }, [viewYear, viewMonth]);

  const todayYmd = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  return (
    <div className="builder-field-group" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <div className="custom-datepicker-container">
        <div className="custom-datepicker-input-wrapper">
          <input
            id={id}
            aria-label={label}
            type="text"
            className={`custom-datepicker-input ${hasError ? 'has-error' : ''}`}
            placeholder={placeholder}
            value={typedText}
            onChange={handleTextChange}
            onClick={() => setIsOpen(true)}
            autoComplete="off"
          />

          <div className="custom-datepicker-actions">
            {typedText ? (
              <button
                type="button"
                className="custom-datepicker-icon-btn"
                onClick={handleClear}
                title="Clear date"
                aria-label="Clear date"
              >
                <X size={13} />
              </button>
            ) : null}

            <button
              type="button"
              className="custom-datepicker-icon-btn"
              onClick={() => setIsOpen((prev) => !prev)}
              title="Open calendar picker"
              aria-label="Open calendar picker"
            >
              <Calendar size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Dropdown Calendar Popup */}
        {isOpen && (
          <div
            className="custom-datepicker-dropdown"
            role="dialog"
            aria-label={`${label} calendar picker`}
          >
            {/* Header: Month & Year navigation */}
            <div className="custom-datepicker-header">
              <button
                type="button"
                className="custom-datepicker-nav-btn"
                onClick={handlePrevMonth}
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="custom-datepicker-month-label">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                className="custom-datepicker-nav-btn"
                onClick={handleNextMonth}
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="custom-datepicker-weekdays">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="custom-datepicker-weekday">
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="custom-datepicker-grid">
              {/* Empty leading padding */}
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const currentDayYmd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = initialYmd === currentDayYmd;
                const isTodayDay = todayYmd === currentDayYmd;

                const isBeforeMin = minDate ? currentDayYmd < minDate : false;
                const isAfterMax = maxDate ? currentDayYmd > maxDate : false;
                const isDisabled = isBeforeMin || isAfterMax;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDayClick(dayNum)}
                    className={`custom-datepicker-day ${isSelected ? 'is-selected' : ''} ${
                      isTodayDay ? 'is-today' : ''
                    }`}
                    title={isSelected ? 'Selected date' : isDisabled ? 'Date outside allowed range' : undefined}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer shortcuts */}
            <div className="custom-datepicker-footer">
              <button
                type="button"
                className="custom-datepicker-quick-btn"
                onClick={handleSelectToday}
              >
                Today
              </button>
              {value ? (
                <button
                  type="button"
                  className="custom-datepicker-quick-btn is-clear"
                  onClick={handleClear}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {hasError && errorMessage ? (
        <span className="text-xs text-rose-600 mt-0.5">{errorMessage}</span>
      ) : null}
    </div>
  );
}
