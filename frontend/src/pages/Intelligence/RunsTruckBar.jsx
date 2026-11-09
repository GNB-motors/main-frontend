import Link from '@/components/redesign/FleetLink';
import { formatKm } from '@/utils/redesign/format';
import { trackLink } from '@/utils/redesign/links';
import { unknownKmText } from './runsBarsModel';

/**
 * RunsTruckBar — one truck's kilometres of the period, in three colours.
 *
 * Loaded km, empty km and plant-to-plant km share the bar, so a truck that
 * mostly runs empty looks different from one that runs loaded. The bar is a
 * link: it takes the owner to that truck's track for the same days.
 *
 * The new backend also reports the km the truck drove that could not be
 * attributed to loaded or empty running. That part is not a third colour — it
 * is unknown, so it is written beside the bar instead of being drawn.
 */
export default function RunsTruckBar({ row, maxKm = 0, from = null, to = null }) {
  // A truck whose km were not measured has no km at all: the bar stays empty
  // and the number is a dash, never 0 km.
  const total = row?.totalKm ?? null;
  const width = total != null && maxKm > 0 ? Math.max(2, (total / maxKm) * 100) : 0;
  const part = (value) => (total > 0 && value != null ? (value / total) * 100 : 0);
  const unknown = unknownKmText(row);

  const label = [
    row?.registrationNumber,
    `${formatKm(total)} in total`,
    `${formatKm(row?.loadedKm)} loaded`,
    `${formatKm(row?.emptyKm)} empty`,
    `${formatKm(row?.repositionKm)} plant to plant`,
    unknown ? `${unknown}, neither loaded nor empty` : null,
  ]
    .filter(Boolean)
    .join(', ');

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
      {unknown ? (
        <span className="w-[132px] shrink-0 text-right text-[12px] text-[var(--rd-ink-3)]">
          {unknown}
        </span>
      ) : null}
    </Link>
  );
}
