import { LifeBuoy, Phone } from 'lucide-react';
import SectionCard from '../../components/redesign/SectionCard';
import { formatNumber } from '../../utils/redesign/format';

/**
 * HelpNearbySection — who can help this truck right now.
 *
 * The section is hidden entirely when there is nothing to show: an empty
 * card that says "no help nearby" is worse than no card, because it makes
 * the owner wonder what went wrong.
 */
export default function HelpNearbySection({ nearbyHelp = [], onPickPlace = null }) {
  if (!nearbyHelp.length) return null;

  return (
    <SectionCard icon={LifeBuoy} tone="info" title="Help nearby">
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {nearbyHelp.slice(0, 5).map((place) => (
          <li key={place.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPickPlace?.(place)}
              className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--rd-ink)]">
                {place.name}
              </span>
              <span className="shrink-0 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
                {formatNumber(place.distanceKm, { digits: 1 })} km
              </span>
            </button>
            {place.phone ? (
              <a
                href={`tel:${place.phone}`}
                aria-label={`Call ${place.name}`}
                title={`Call ${place.name}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--rd-line)] text-[var(--rd-brand-2)] transition-colors hover:border-[var(--rd-line-strong)]"
              >
                <Phone size={13} aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
