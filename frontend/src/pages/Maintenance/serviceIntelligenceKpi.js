// KPI summary across the loaded set for the current tab. `now` is injectable
// so the 30-day window can be tested deterministically.
export const computeServiceKpi = (rows, now = new Date()) => {
  const total = rows.length;
  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const last30 = rows.filter((r) => {
    const d = new Date(r.date);
    return d >= cutoff;
  }).length;
  return { total, totalAmount, last30 };
};
