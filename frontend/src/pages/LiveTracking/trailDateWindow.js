const DAY_MS = 86400000;
const IST_OFFSET_MS = 19800000;

function today(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function dayStart(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Choose a valid trail date.');
  const start = new Date(`${date}T00:00:00+05:30`);
  if (!Number.isFinite(start.getTime()) || today(start) !== date)
    throw new Error('Choose a valid trail date.');
  return start;
}

function resolve(selection = { period: 'today' }, now = new Date()) {
  const current = today(now);
  const startDate =
    selection.period === 'custom'
      ? selection.startDate
      : selection.period === 'yesterday'
        ? today(new Date(now.getTime() - DAY_MS))
        : current;
  const endDate = selection.period === 'custom' ? selection.endDate : startDate;
  const start = dayStart(startDate);
  const end = dayStart(endDate);
  if (endDate < startDate) throw new Error('End date must be on or after start date.');
  if (endDate > current) throw new Error('Choose today or an earlier date.');
  // Road geometry accepts at most eight days per request, including both dates.
  if (end.getTime() - start.getTime() >= 8 * DAY_MS)
    throw new Error('Choose a range of up to 8 days.');
  return {
    from: start.toISOString(),
    to: new Date(Math.min(now.getTime(), end.getTime() + DAY_MS - 1)).toISOString(),
  };
}

function label(selection, now = new Date()) {
  const { from, to } = resolve(selection, now);
  const format = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return today(new Date(from)) === today(new Date(to))
    ? format(from)
    : `${format(from)} – ${format(to)}`;
}

function key(selection) {
  return `${selection.period}:${selection.startDate ?? ''}:${selection.endDate ?? ''}`;
}

export default { today, resolve, label, key };
