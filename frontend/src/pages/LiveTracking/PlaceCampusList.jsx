import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { placeApiId } from './placePanelModel.js';

/**
 * PlaceCampusList — the parts of a plant.
 *
 * A plant is not one point on the map: it is a campus with a gate, a
 * siding, a parking area and a weighbridge. The owner asked that the
 * place panel list them, so a truck "at JK BUXAR" can be pinned down to
 * the weighbridge rather than to a circle 600 m wide.
 */
export default function PlaceCampusList({ place }) {
  // The API knows the bare site id ("site:abc" → "abc").
  const placeId = placeApiId(place);

  const { data, loading } = useApi(
    (signal) => fleetViewService.getCampuses({ signal }),
    [],
    { enabled: Boolean(placeId) },
  );

  const campuses = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data]);

  // The campus that holds this place, if there is one.
  const campus = useMemo(() => {
    if (!placeId) return null;
    return (
      campuses.find((item) => item.id === placeId) ??
      campuses.find((item) =>
        (item.memberSites || []).some((site) => site.id === placeId),
      ) ??
      null
    );
  }, [campuses, placeId]);

  if (!placeId || loading) return null;
  if (!campus) return null;

  const members = Array.isArray(campus.memberSites) ? campus.memberSites : [];

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">Inside this plant</h3>
      {members.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          No gates, sidings or weighbridges have been named here yet.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {members.map((member) => (
            <li key={member.id} className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate text-[var(--rd-ink)]">{member.name}</span>
              <span className="shrink-0 text-[12px] text-[var(--rd-ink-3)]">inside this plant</span>
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 text-[11px] text-[var(--rd-ink-3)]">
        {campus.trucksInsideNow ?? 0} trucks are inside {campus.name} right now.
      </p>
    </section>
  );
}
