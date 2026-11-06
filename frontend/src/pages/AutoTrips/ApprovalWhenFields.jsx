import { Input } from '../../components/ui/input';

const WEEKDAYS = [
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
  { d: 6, label: 'Sat' },
  { d: 0, label: 'Sun' },
];

/** The "When" block of a movement approval: a date window, or weekdays with an hour range. */
const ApprovalWhenFields = ({
  timeMode,
  setTimeMode,
  from,
  setFrom,
  to,
  setTo,
  weekdays,
  toggleDay,
  fromHour,
  setFromHour,
  toHour,
  setToHour,
}) => (
  <div className="atx-field atx-field--wide">
    <span className="atx-field-label">When</span>
    <div className="atx-seg" role="group" aria-label="When type">
      <button
        type="button"
        className={`atx-seg-item${timeMode === 'window' ? ' atx-seg-item--active' : ''}`}
        aria-pressed={timeMode === 'window'}
        onClick={() => setTimeMode('window')}
      >
        One-time window
      </button>
      <button
        type="button"
        className={`atx-seg-item${timeMode === 'recurrence' ? ' atx-seg-item--active' : ''}`}
        aria-pressed={timeMode === 'recurrence'}
        onClick={() => setTimeMode('recurrence')}
      >
        Recurring
      </button>
    </div>
    {timeMode === 'window' ? (
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          aria-label="From date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          type="date"
          aria-label="To date"
          value={to}
          min={from}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="atx-seg atx-seg--sm" role="group" aria-label="Weekdays">
          {WEEKDAYS.map((w) => (
            <button
              key={w.d}
              type="button"
              className={`atx-seg-item${weekdays.includes(w.d) ? ' atx-seg-item--active' : ''}`}
              aria-pressed={weekdays.includes(w.d)}
              onClick={() => toggleDay(w.d)}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[var(--ds-ink2)]">From hour</span>
          <Input
            type="number"
            min="0"
            max="24"
            aria-label="From hour"
            value={fromHour}
            onChange={(e) => setFromHour(e.target.value)}
            className="w-[80px]"
          />
          <span className="text-[13px] text-[var(--ds-ink2)]">to</span>
          <Input
            type="number"
            min="0"
            max="24"
            aria-label="To hour"
            value={toHour}
            onChange={(e) => setToHour(e.target.value)}
            className="w-[80px]"
          />
        </div>
      </div>
    )}
  </div>
);

export default ApprovalWhenFields;
