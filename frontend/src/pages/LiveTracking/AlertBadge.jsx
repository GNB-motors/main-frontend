/**
 * AlertBadge — how many alerts nobody has looked at yet.
 *
 * The count is the unacknowledged alerts of the last 24 hours for this truck.
 * Nothing to say means no badge, never a zero.
 */
export default function AlertBadge({ count = 0 }) {
  const total = Number(count);
  if (!Number.isFinite(total) || total <= 0) return null;
  const label = `${total} unacknowledged alert${total === 1 ? '' : 's'}`;
  return (
    <span
      className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--rd-act)] px-1 text-[11px] leading-none font-semibold tracking-normal text-white"
      aria-label={label}
      title={label}
    >
      {total}
    </span>
  );
}
