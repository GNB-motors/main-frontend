import Ico from '../../routeHubIcons.jsx';
import { Empty, RowsSkeleton } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';
import {
  costBasisLabel,
  isOpen,
  legLabel,
  runWindow,
  shortDay,
  tripLabel,
} from './deviationRules.js';

const LEG_TONE = {
  LADEN: ['#C2323A', 'rgba(229,104,107,.14)'],
  APPROACH: ['#5D5D5E', 'rgba(93,93,94,.12)'],
  NONE: ['#5D5D5E', 'rgba(93,93,94,.08)'],
};

function LegPill({ trip }) {
  const [c, tint] = LEG_TONE[trip?.leg] || LEG_TONE.NONE;
  return (
    <span className="pill" style={{ '--c': c, '--tint': tint }}>
      {legLabel(trip)}
    </span>
  );
}

function StatusPill({ d }) {
  return isOpen(d) ? (
    <span className="pill" style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}>
      <Ico n="alert" s={11} />
      Please review
    </span>
  ) : (
    <span className="pill" style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}>
      <Ico n="check" s={11} />
      Reviewed
    </span>
  );
}

/**
 * Deviations grouped by the trip they happened on: the trip names its places
 * and day, each detour under it says when, on which leg, how far off and what
 * it cost. A detour outside any trip says so instead of showing a blank id.
 */
export default function DeviationFeed({ groups, selId, onSelect, first, error, pager }) {
  let body;
  if (groups.length) {
    body = groups.map((g) => (
      <div key={g.key} className="dev-group">
        <div className="dev-group-head">
          <span className="plate">{g.registrationNumber}</span>
          <div className="dev-group-t">
            <b>{g.trip ? tripLabel(g.trip) : 'Outside any trip'}</b>
            <span className="muted">
              {g.trip
                ? `Trip of ${shortDay(g.trip.tripStartAt)}`
                : g.events[0].corridorLabel || 'Between two known places'}
            </span>
          </div>
          <span className="sp" />
          {g.events.length > 1 ? (
            <span className="muted dev-group-sum">
              {g.events.length} detours · +{g.extraKm.toFixed(1)} km · {inr(g.costInr)}
            </span>
          ) : null}
        </div>
        {g.events.map((d) => (
          <button
            key={d._id}
            type="button"
            className={`dev-row${d._id === selId ? ' sel' : ''}`}
            aria-pressed={d._id === selId}
            onClick={() => onSelect(d._id)}
          >
            <span className="dev-row-when">
              <span className="mono strong">{runWindow(d) || '—'}</span>
              <span className="muted">{shortDay(d.startedAt || d.detectedAt)}</span>
            </span>
            <LegPill trip={d.trip} />
            <span className="dev-row-num">
              <span className="muted">Farthest</span>
              <span className="mono strong">{Number(d.maxOffKm || 0).toFixed(1)} km</span>
            </span>
            <span className="dev-row-num">
              <span className="muted">Extra</span>
              <span className="mono">
                {d.extraKmEstimate != null ? `+${Number(d.extraKmEstimate).toFixed(1)} km` : '—'}
              </span>
            </span>
            <span className="dev-row-num">
              <span className="muted">Cost (est.)</span>
              <span className="strong" style={{ color: '#C2323A' }} title={costBasisLabel(d)}>
                {d.estimatedExtraCostInr != null ? inr(d.estimatedExtraCostInr) : '—'}
              </span>
            </span>
            <StatusPill d={d} />
          </button>
        ))}
      </div>
    ));
  } else if (first) {
    body = <RowsSkeleton n={4} />;
  } else {
    body = (
      <Empty
        title={error ? 'Feed unavailable' : 'No deviations match'}
        sub={error || 'Change the filters or date range.'}
        tone={error ? '#C56200' : '#187A32'}
        icon={error ? 'alert' : 'check'}
      />
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="split" />
        </span>
        <h3>Deviations by trip</h3>
        <span className="sp" />
        <span className="hint">Select a detour to see it on the map</span>
      </div>
      <div className="dev-feed">{body}</div>
      {pager}
    </div>
  );
}
