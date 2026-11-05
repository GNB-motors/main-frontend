/**
 * An ETA that has already passed says nothing about when the truck will
 * arrive, so it is never printed — the owner is told the estimate has passed
 * and is waiting for a new position.
 *
 * `etaAt` may be the time itself or the ETA object that holds it, because the
 * panels have both shapes.
 */
export function etaHasPassed(etaAt, now = Date.now()) {
  const raw =
    etaAt && typeof etaAt === 'object' ? (etaAt.at ?? etaAt.etaAt ?? null) : etaAt;
  if (!raw) return false;
  const at = new Date(raw).getTime();
  return Number.isFinite(at) && at < now;
}

/** The muted line that replaces a passed ETA. */
export const ETA_PASSED_TEXT = 'ETA passed — waiting for new position';
