import { TRACK_PLACE_GROUPS } from './trackPlaces.js';

/* Which kinds of place are on the map — shown under the layer pills while
   Places is on. Groups and names are Place Hub's. */
export default function TrackPlacesFilter({
  loading,
  notice,
  counts,
  hiddenGroups,
  toggleGroup,
  retry,
}) {
  if (loading) return <div className="lp-places-note">Loading places…</div>;
  const groups = TRACK_PLACE_GROUPS.filter((g) => counts[g.id] > 0);
  return (
    <div className="lp-places" role="group" aria-label="Place types on the map">
      {groups.length === 0 && !notice ? (
        <div className="lp-places-note">No confirmed places yet. Add them in Place Hub.</div>
      ) : null}
      {groups.map((g) => (
        <button
          key={g.id}
          type="button"
          className="lp-layer-toggles__btn"
          aria-pressed={!hiddenGroups.has(g.id)}
          onClick={() => toggleGroup(g.id)}
        >
          {g.label} · {counts[g.id]}
        </button>
      ))}
      {notice ? (
        <div className="lp-places-note">
          {notice}{' '}
          <button type="button" className="lp-places-retry" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
