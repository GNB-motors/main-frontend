import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { tripsHistoryLink } from '../../utils/redesign/links';
import ToneBadge from '../../components/redesign/ToneBadge';
import NotYetAvailable from '../../components/redesign/NotYetAvailable';
import { rangeToParams } from '../Mileage/mileageDates';

/**
 * TripHistoryTab — where has this truck been, and when.
 *
 * It answers the question an owner actually has: "when was WB11F6762 last
 * at DALMIA OCL?". The rows are facts — a visit, a date, how long the
 * truck was there. The register rows come from the oil report, so they are
 * badged so nobody mistakes them for GPS.
 */
export default function TripHistoryTab({
  vehicle = null,
  site = null,
  from = null,
  to = null,
  minDwellMin = null,
}) {
  const minDwell = Math.max(0, Number(minDwellMin) || 0);
  const bounds =
    /^\d{4}-\d{2}-\d{2}$/.test(from || '') && /^\d{4}-\d{2}-\d{2}$/.test(to || '')
      ? rangeToParams({ from, to })
      : { from, to };
  const { data, loading, error } = useApi(
    async (signal) => {
      const first = await fleetViewService.getTripsHistory({
        site,
        vehicle,
        ...bounds,
        limit: 200,
        signal,
      });
      if (!minDwell || first.held) return first;
      const items = [...(first.items || [])];
      for (let page = 2; items.length < first.total && page <= 50; page++) {
        const next = await fleetViewService.getTripsHistory({
          site,
          vehicle,
          ...bounds,
          limit: 200,
          page,
          signal,
        });
        if (!next.items?.length) break;
        items.push(...next.items);
      }
      return { ...first, items, truncated: items.length < first.total };
    },
    [vehicle, site, from, to, minDwell],
    { scopeKey: `${vehicle}:${site}:${from}:${to}:${minDwell}` },
  );

  const items = useMemo(
    () =>
      (Array.isArray(data?.items) ? data.items : []).filter(
        (item) => !minDwell || (item.kind === 'VISIT' && item.dwellMin >= minDwell),
      ),
    [data, minDwell],
  );
  const countsByPlace = useMemo(
    () => (Array.isArray(data?.countsByPlace) ? data.countsByPlace : []),
    [data],
  );

  // The count for the place we are looking at.
  const placeCount = useMemo(() => {
    if (!site) return null;
    const found = countsByPlace.find((entry) => entry.place?.id === site);
    return found?.visits ?? null;
  }, [countsByPlace, site]);

  if (error?.status === 404) {
    return <NotYetAvailable what="Trip history" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {minDwell ? (
        <p>
          Visits of {minDwell} minutes or more{from && to ? ` · ${from} – ${to}` : ''}.
        </p>
      ) : null}
      {data?.truncated ? (
        <p role="status">
          Only part of this history could be loaded. Narrow the dates to see the remaining visits.
        </p>
      ) : null}
      {vehicle && site ? (
        <p className="m-0 text-[14px] text-[var(--rd-ink)]">
          {vehicle}
          {placeCount !== null ? ` visited this place ${placeCount} times` : ' visited this place'}
          {from && to ? ` between ${from} and ${to}` : ''}.
        </p>
      ) : null}

      {loading ? (
        <ul
          className="m-0 flex list-none flex-col gap-1 p-0"
          aria-busy="true"
          aria-label="Loading the history"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--rd-line)] py-2 last:border-b-0"
            >
              <span className="atx-skel h-[12px] w-[130px] shrink-0" />
              <span className="atx-skel h-[13px] w-[130px] shrink-0" />
              <span className="atx-skel h-[13px] min-w-[160px] flex-1" />
              <span className="atx-skel h-[12px] w-[110px] shrink-0" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          We could not load the history for this place.
        </p>
      ) : items.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          No visits found. History is kept from 15 Sep (GPS) and 1 Apr (your oil report).
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.registrationNumber}-${item.arrivedAt ?? item.register?.date}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--rd-line)] py-2 last:border-b-0"
            >
              <span className="w-[130px] shrink-0 text-[12px] text-[var(--rd-ink-3)] tabular-nums">
                {item.arrivedAt
                  ? formatIst(item.arrivedAt, { withDate: true })
                  : item.register?.date}
              </span>
              <span className="w-[130px] shrink-0 text-[13px] font-medium text-[var(--rd-ink)]">
                {item.registrationNumber}
              </span>
              <span className="min-w-[160px] flex-1 text-[13px] text-[var(--rd-ink)]">
                {item.kind === 'REGISTER_TRIP' ? (
                  <>
                    {item.register?.from ?? '—'} → {(item.register?.to ?? []).join(', ') || '—'}
                    {item.register?.driver ? ` · ${item.register.driver}` : ''}
                  </>
                ) : (
                  (item.place?.name ?? 'Place not known')
                )}
              </span>
              <span className="w-[110px] shrink-0 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
                {item.dwellMin === null || item.dwellMin === undefined
                  ? '—'
                  : formatDuration(item.dwellMin)}
              </span>
              {item.kind === 'REGISTER_TRIP' ? (
                <ToneBadge tone="info">From oil report</ToneBadge>
              ) : item.purpose ? (
                <ToneBadge tone="info">{item.purpose}</ToneBadge>
              ) : null}
              <span className="flex shrink-0 items-center gap-2">
                {item.replay?.to ? (
                  <Link
                    to={item.replay.to}
                    className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
                  >
                    See on map →
                  </Link>
                ) : null}
                {item.trip?.to ? (
                  <Link
                    to={item.trip.to}
                    className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
                  >
                    Trip →
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {site ? (
        <Link
          to={tripsHistoryLink({ site, vehicle })}
          className="w-fit text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
        >
          See all visits to this place →
        </Link>
      ) : null}
    </div>
  );
}
