import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { labelStyle, rowStyle } from './approvalDialogStyles';

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
  <div style={rowStyle}>
    <span style={labelStyle}>When</span>
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <Button
        type="button"
        size="sm"
        variant={timeMode === 'window' ? 'default' : 'outline'}
        onClick={() => setTimeMode('window')}
      >
        One-time window
      </Button>
      <Button
        type="button"
        size="sm"
        variant={timeMode === 'recurrence' ? 'default' : 'outline'}
        onClick={() => setTimeMode('recurrence')}
      >
        Recurring
      </Button>
    </div>
    {timeMode === 'window' ? (
      <div style={{ display: 'flex', gap: 8 }}>
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
      <div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {WEEKDAYS.map((w) => (
            <Button
              key={w.d}
              type="button"
              size="sm"
              variant={weekdays.includes(w.d) ? 'default' : 'outline'}
              onClick={() => toggleDay(w.d)}
            >
              {w.label}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>From hour</span>
          <Input
            type="number"
            min="0"
            max="24"
            aria-label="From hour"
            value={fromHour}
            onChange={(e) => setFromHour(e.target.value)}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 13 }}>to</span>
          <Input
            type="number"
            min="0"
            max="24"
            aria-label="To hour"
            value={toHour}
            onChange={(e) => setToHour(e.target.value)}
            style={{ width: 80 }}
          />
        </div>
      </div>
    )}
  </div>
);

export default ApprovalWhenFields;
