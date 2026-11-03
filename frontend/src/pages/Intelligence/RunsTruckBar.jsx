import Link from '@/components/redesign/FleetLink';
import { formatKm } from '@/utils/redesign/format';
import { trackLink } from '@/utils/redesign/links';

/**
 * RunsTruckBar — one truck's kilometres of the period, in three colours.
 *
 * Loaded km, empty km and plant-to-plant km share the bar, so a truck that
 * mostly runs empty looks different from one that runs loaded. The bar is a
 * link: it takes the owner to that truck's track for the same days.
 */
export default function RunsTruckBar({ row, maxKm = 0, from = null, to = null }) {
  const total = row?.totalKm ?? 0;
  const width = maxKm > 0 ? Math.max(2, (total / maxKm) * 100) : 0;
  const part = (value) => (total > 0 ? (value / total) * 100 : 0);

  const label = [
    row?.registrationNumber,
    `${formatKm(total)} in total`,
    `${formatKm(row?.loadedKm)} loaded`,
    `${formatKm(row?.emptyKm)} empty`,
    `${formatKm(row?.repositionKm)} plant to plant`,
  ].join(', ');

  return (
    <Link
      to={trackLink({ reg: row?.registrationNumber, from, to })}
      aria-label={label}
      className="flex items-center gap-3 rounded-[var(--rd-radius-xs)] px-1 py-1 no-underline hover:bg-[var(--rd-card-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
    >
      <span className="w-[110px] shrink-0 truncate text-[12px] font-medium text-[var(--rd-ink-2)]">
        {row?.registrationNumber}
      </span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--rd-card-2)]">
        <span className="flex h-full" style={{ width: `${width}%` }}>
          <span
            className="h-full bg-[var(--rd-leg-loaded)]"
            style={{ width: `${part(row?.loadedKm)}%` }}
          />
          <span
            className="h-full bg-[var(--rd-leg-empty)]"
            style={{ width: `${part(row?.emptyKm)}%` }}
          />
          <span
            className="h-full bg-[var(--rd-leg-reposition)]"
            style={{ width: `${part(row?.repositionKm)}%` }}
          />
        </span>
      </span>
      <span className="w-[92px] shrink-0 text-right text-[12px] text-[var(--rd-ink-3)] tabular-nums">
        {formatKm(total)}
      </span>
    </Link>
  );
}
