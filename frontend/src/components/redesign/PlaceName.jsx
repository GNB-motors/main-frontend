import { placeCategoryColor } from '@/utils/redesign/tone';

/**
 * PlaceName — a place, the way the owner says it.
 *
 * It never prints "Unknown site". The API promises a real name (an address
 * or "Near <town>" at worst); when the panel genuinely has no place, it says
 * "Location not known" instead of inventing a word for nothing.
 */
export default function PlaceName({ place = null, showCategory = false }) {
  if (!place) {
    return <span className="text-[var(--rd-ink-3)]">Location not known</span>;
  }

  const color = placeCategoryColor(place.category);

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="font-medium text-[var(--rd-ink)]">{place.name}</span>
      {showCategory && place.category ? (
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--rd-ink-3)]">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {place.category}
        </span>
      ) : null}
    </span>
  );
}
