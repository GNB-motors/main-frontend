import { Link } from 'react-router-dom';
import { STOP_MARKERS } from '../LiveTracking/trackLayersModel';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { trackLink } from '../../utils/redesign/links';

/**
 * TripStopList — "stops on this trip", with the reason for each one.
 *
 * The owner asked for this: on a trip you want to know why the truck
 * stopped. Each row gives the reason, the place, the time and how long,
 * and the evidence behind the reason — "tank went up 212 L at IOCL Mohania".
 *
 * A stop we cannot explain says "Stopped, reason not known", in grey. It is
 * never a warning: an unexplained stop is a fact, not a problem.
 */
export default function TripStopList({ stops = [], registrationNumber = null }) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return (
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
        No stops were recorded on this trip.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {stops.map((stop, index) => {
        const marker = STOP_MARKERS[stop.reason] ?? STOP_MARKERS.UNEXPLAINED;
        const unknown = stop.reason === 'UNEXPLAINED' || stop.reason == null;
        const to = trackLink({
          reg: registrationNumber,
          from: stop.startAt,
          to: stop.endAt,
          at: stop.startAt,
        });

        return (
          <li key={`${stop.startAt}-${index}`}>
            <Link
              to={to}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-[var(--rd-radius-xs)] px-1 py-1 no-underline transition-colors hover:bg-[var(--rd-card-2)]"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: marker.color }}
              />
              <span
                className={`w-[150px] shrink-0 text-[13px] ${
                  unknown ? 'text-[var(--rd-ink-3)]' : 'text-[var(--rd-ink)]'
                }`}
              >
                {unknown ? 'Stopped, reason not known' : stop.reason}
              </span>
              <span className="min-w-[140px] flex-1 text-[13px] text-[var(--rd-ink)]">
                {stop.place?.name ?? 'No named place'}
              </span>
              <span className="w-[150px] shrink-0 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
                {formatIst(stop.startAt, { withDate: true })}
                {stop.durationMin != null ? ` · ${formatDuration(stop.durationMin)}` : ''}
              </span>
            </Link>
            {stop.reasonWhy ? (
              <p className="m-0 px-1 text-[12px] text-[var(--rd-ink-3)]">{stop.reasonWhy}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
