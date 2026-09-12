import { OUTCOME_LABELS, OUTCOME_TONE, WEEKDAYS } from './erpCall.constants';

/** "Mon · Wed · Fri", always in weekday order regardless of how they were stored. */
export const dayLabel = (days = []) =>
  WEEKDAYS.filter((w) => days.includes(w.value))
    .map((w) => w.short)
    .join(' · ') || '—';

/**
 * What to print in a table cell. "Mon · Tue · Wed · Thu · Fri · Sat · Sun" is
 * seven things to read to learn one thing; "Every day" is one.
 */
export const scheduleLabel = (days = []) => {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays';
  return dayLabel(days);
};

/**
 * A calendar cell's state, keeping the three concepts apart:
 *   Scheduled — the schedule says today, but no task exists yet.
 *   Open      — the task exists and is still to be worked.
 *   <outcome> — the task is closed, and this is how the call went.
 * Collapsing these was the old bug: "Open" was rendered under an Outcome
 * heading, where it reads as a result the KAM recorded rather than the absence
 * of one.
 */
export const taskState = (task) => {
  if (!task) return { key: 'SCHEDULED', label: 'Scheduled', tone: 'neutral', kind: 'plan' };
  if (task.status === 'OPEN') return { key: 'OPEN', label: 'Open', tone: 'info', kind: 'task' };
  return {
    key: task.outcome || 'CLOSED',
    label: OUTCOME_LABELS[task.outcome] || 'Closed',
    tone: OUTCOME_TONE[task.outcome] || 'neutral',
    kind: 'outcome',
  };
};

export const kamName = (kam) => {
  if (!kam) return '—';
  const full = `${kam.firstName || ''} ${kam.lastName || ''}`.trim();
  return full || '—';
};

export const kamInitials = (kam) => {
  if (!kam) return '?';
  return `${(kam.firstName || '?')[0]}${(kam.lastName || '')[0] || ''}`.toUpperCase();
};

/** "Mon, 8 Sep" — no year, because every date shown here is within days. */
export const shortDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

/**
 * "Today" / "Tomorrow" / "Mon, 8 Sep".
 *
 * The relative words are worth the branch: a KAM scanning fifty rows for what
 * they have to do today should not be date-arithmeticking against the calendar
 * on their wall.
 */
export const relativeDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.round((startOfLocalDay(d) - startOfLocalDay(new Date())) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return shortDate(d);
};

export const startOfLocalDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (value, n) => {
  const d = startOfLocalDay(value);
  d.setDate(d.getDate() + n);
  return d;
};

/** Monday of the week containing `value` — the calendar grid always starts there. */
export const startOfWeek = (value) => {
  const d = startOfLocalDay(value);
  // getDay(): 0 = Sunday. Sunday belongs to the week that started six days ago,
  // not the one about to start, so it shifts back 6 rather than forward 1.
  return addDays(d, d.getDay() === 0 ? -6 : 1 - d.getDay());
};

export const isSameDay = (a, b) =>
  startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();

/** A day key both a schedule row and a CallTask can be bucketed under. */
export const dayKey = (value) => startOfLocalDay(value).toISOString().slice(0, 10);
