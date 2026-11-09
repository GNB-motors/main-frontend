const numeric = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Keep service distances on the forecast snapshot; live telemetry can be newer. */
export function serviceDistance(prediction, health) {
  const current = numeric(prediction?.currentOdometer) ?? numeric(health?.canOdo);
  const last = numeric(prediction?.lastServiceOdometer) ?? numeric(health?.lastServiceKm);
  const next = numeric(prediction?.projectedServiceDueOdometer) ?? numeric(health?.nextServiceKm);
  const remaining =
    numeric(prediction?.kmUntilDue) ?? (current != null && next != null ? next - current : null);
  const percent =
    current != null && last != null && next != null && next > last
      ? Math.max(0, Math.min(100, ((current - last) / (next - last)) * 100))
      : null;
  return { current, last, next, remaining, percent };
}
