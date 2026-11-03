import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { tripsHistoryLink } from '../../utils/redesign/links';

/**
 * PlaceRecentVisits — the last visits to one of our places.
 *
 * It answers "when was this truck last here?" without leaving the map. The
 * list is a fact, not a judgement: who came, when, and for how long.
 */
export default function PlaceRecentVisits({ place, limit = 10 }) {
  const siteId = place?.id ?? null;

  const { data, loading } = useApi(
    (signal) => fleetViewService.getTripsHistory({ site: siteId, limit, signal }),
    [siteId, limit],
    { enabled: Boolean(siteId) },
  );

  const visits = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.slice(0, limit);
  }, [data, limit]);

  if (!siteId) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">Recent visits</h3>
      {loading ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">Loading visits…</p>
      ) : visits.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          No recorded visits to this place yet.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {visits.map((visit) => (
            <li
              key={`${visit.registrationNumber}-${visit.arrivedAt ?? visit.kind}`}
              className="flex items-baseline justify-between gap-2 text-[13px]"
            >
              <span className="font-medium text-[var(--rd-ink)]">{visit.registrationNumber}</span>
              <span className="text-[var(--rd-ink-2)] tabular-nums">
                {visit.arrivedAt ? formatIst(visit.arrivedAt) : '—'}
              </span>
              <span className="text-[var(--rd-ink-3)] tabular-nums">
                {visit.dwellMin === null ? '—' : formatDuration(visit.dwellMin)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={tripsHistoryLink({ site: siteId })}
        className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
      >
        See all visits →
      </Link>
    </section>
  );
}
