import { formatIdlingChip } from './trackIdlingModel';

/**
 * TrackIdlingChip — "Idling 23 min" on a truck.
 *
 * The chip only exists when the idling console knows how long the truck has
 * been standing. An unknown duration is not a zero.
 */
export default function TrackIdlingChip({ minutes, className = '' }) {
  const label = formatIdlingChip(minutes);
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--rd-watch-tint)] px-2 py-0.5 text-[11px] font-medium text-[var(--rd-watch-ink)] ${className}`}
    >
      {label}
    </span>
  );
}
