import { legBarSegments, legBarSentence } from './tripLegModel';

/**
 * TripLegBar — the trip's distance, split by what the truck was carrying.
 *
 * A plain bar built from divs and CSS widths — no chart library. Each
 * slice is in the leg's own colour, the same colour the map uses for that
 * kind of run, so a glance at the map and a glance at the bar agree.
 */
export default function TripLegBar({ trip }) {
  const segments = legBarSegments(trip);

  if (!segments.length) {
    return <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">No distance recorded for this trip.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--rd-card-2)]"
        role="img"
        aria-label={legBarSentence(trip)}
      >
        {segments.map((segment) => (
          <span
            key={segment.kind}
            className="h-full"
            style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
            title={`${segment.label} · ${Math.round(segment.km)} km`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--rd-ink-2)]">
        {segments.map((segment) => (
          <span key={segment.kind} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            {segment.label}
            <span className="tabular-nums">{Math.round(segment.km)} km</span>
          </span>
        ))}
      </div>
    </div>
  );
}
