import { placeTitle } from '../intelligence/model/siteSummary.js';
import { kmLabel, minutesLabel } from '../intelligence/model/unitLabels.js';
import LegEnd from '../intelligence/LegEnd.jsx';
import Kpi from './Kpi.jsx';
import Empty from './Empty.jsx';
import ListSkeleton from './ListSkeleton.jsx';

export default function RoutesPanel({
  data,
  legs,
  sites,
  loading,
  error,
  chip,
  onChip,
  query,
  onQuery,
  sort,
  onSort,
  siteId,
  onSite,
  selectedId,
  hoveredId,
  onHover,
  onPick,
  onRetry,
}) {
  const totalRuns = data?.totals?.runs || 0;
  const topRuns = [...(data?.legs || [])]
    .sort((a, b) => b.traversals - a.traversals)
    .slice(0, 10)
    .reduce((sum, l) => sum + l.traversals, 0);
  const max = Math.max(1, ...legs.map((l) => l.traversals));
  return (
    <aside className="ph-side" aria-label="routes list">
      <div className="ph-route-kpis">
        <Kpi label="Legs" value={data?.totals?.legs ?? '—'} />
        <Kpi label="Runs" value={totalRuns} />
        <Kpi label="Places" value={data?.totals?.places ?? '—'} />
        <Kpi
          label="Top 10 share"
          value={totalRuns ? `${Math.round((topRuns / totalRuns) * 100)}%` : '—'}
        />
      </div>
      <div className="ph-route-controls">
        <input
          aria-label="Search route places"
          placeholder="Search places…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <div className="ph-route-chips">
          {[
            ['all', 'All'],
            ['busy', 'Busy 10+'],
            ['long', 'Long 150+ km'],
            ['slow', 'Slow lately'],
            ['plant', `In-plant (${data?.totals?.inPlant || 0})`],
          ].map(([id, label]) => (
            <button type="button" key={id} aria-pressed={chip === id} onClick={() => onChip(id)}>
              {label}
            </button>
          ))}
        </div>
        <label>
          Sort{' '}
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            <option value="runs">Runs</option>
            <option value="distance">Distance</option>
            <option value="time">Usual time</option>
            <option value="fuel">Fuel cost</option>
            <option value="spread">Spread</option>
          </select>
        </label>
        {siteId && (
          <button type="button" onClick={() => onSite(null)}>
            Showing legs from {sites.get(siteId) ? placeTitle(sites.get(siteId)) : 'this place'} ×
          </button>
        )}
      </div>
      {loading && <ListSkeleton />}
      {error && (
        <div className="ph-layer-error" role="alert">
          {error}{' '}
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
      {data?.truncated && (
        <p className="ph-layer-error" role="status">
          Showing the {data.legs.length} busiest of {data.total} legs.
        </p>
      )}
      {!loading && !error && !legs.length && (
        <Empty
          title={data?.legs?.length ? 'No routes match these filters.' : 'No routes learned yet.'}
          body={
            data?.legs?.length
              ? 'Try another filter or place name.'
              : 'A leg appears once trucks have driven between the same two places at least twice.'
          }
        />
      )}
      <div className="ph-route-list">
        {legs.map((leg) => (
          <button
            type="button"
            key={leg._id}
            className={`ph-route-row${selectedId === String(leg._id) ? ' is-selected' : ''}${hoveredId === String(leg._id) ? ' is-hovered' : ''}`}
            onClick={() => onPick(String(leg._id))}
            onMouseEnter={() => onHover(String(leg._id))}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(String(leg._id))}
            onBlur={() => onHover(null)}
          >
            <span>
              <LegEnd site={sites.get(String(leg.fromSiteId))} fallback="UNKNOWN" /> →{' '}
              <LegEnd site={sites.get(String(leg.toSiteId))} fallback="UNKNOWN" />
            </span>
            <span className="ph-route-meta">
              {leg.traversals} runs · {minutesLabel(leg.stats?.minutes?.p50)} ·{' '}
              {kmLabel(leg.stats?.km?.p50)}
            </span>
            <span
              className="ph-route-bar"
              style={{ width: `${Math.max(3, (leg.traversals / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
    </aside>
  );
}
