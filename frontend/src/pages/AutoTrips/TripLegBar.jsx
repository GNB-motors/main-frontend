import { legBarSegments, legBarSentence, unattributedKm, unknownDriveText } from './tripLegModel';
import { fmtKm } from './autoTripFormat';

/**
 * TripLegBar — the trip's distance, split by what the truck was carrying.
 *
 * A plain bar built from divs and CSS widths — no chart library. Each
 * slice is in the leg's own colour, the same colour the map uses for that
 * kind of run, so a glance at the map and a glance at the bar agree.
 *
 * Distance the server could not attribute to a leg is said on its own line,
 * so the bar keeps telling the truth about the legs it does know.
 */
export default function TripLegBar({ trip }) {
  const segments = legBarSegments(trip);
  const unattributed = unattributedKm(trip);
  const unknownDrive = unknownDriveText(trip);
  const note =
    unattributed != null ? (
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
        Not attributed: {fmtKm(unattributed)}
        {unknownDrive ? ` · ${unknownDrive}` : ''}
      </p>
    ) : null;

  if (!segments.length) {
    if (note) return note;
    return (
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">No distance recorded for this trip.</p>
    );
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
      {note}
    </div>
  );
}
