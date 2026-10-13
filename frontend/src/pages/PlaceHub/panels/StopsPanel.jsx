import { CircleCheck, Clock } from 'lucide-react';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { num } from '../../../utils/formatMoney.js';
import { hoursLabel } from '../model/placeLabels.js';
import { stopTotals } from '../model/stopGroups.js';
import { STOP_COLOR } from '../placeHubStyle.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import Empty from './Empty.jsx';
import Kpi from './Kpi.jsx';
import ListSkeleton from './ListSkeleton.jsx';

export default function StopsPanel({ loading, error, groups, siteOf, selectedId, onPick }) {
  const t = stopTotals(groups);
  return (
    <>
      <div className="ph-kpis">
        <Kpi
          label="Unexplained"
          value={hoursLabel(t.minutes / 60)}
          tone={t.minutes ? 'warn' : null}
        />
        <Kpi label="Places" value={num(t.places)} />
        <Kpi label="Stops · 7 days" value={num(t.stops)} />
        <Kpi label="Trucks" value={num(t.trucks)} />
      </div>
      <p className="ph-note ph-note--lead">
        Long stops that fuel, loading, a bill, a service, rest rules or a queue don’t explain.
        Answer one and it leaves the list.
      </p>
      {loading && !groups.length ? (
        <ListSkeleton />
      ) : error ? (
        <Empty title="Could not load stops" body="Try again in a minute." />
      ) : groups.length ? (
        <ol className="ph-list">
          {groups.map((g) => {
            const site = siteOf(g.siteId);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  className={`ph-row${g.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onPick(g)}
                >
                  {site ? (
                    <TypeTile type={site.type} />
                  ) : (
                    <TypeTile Icon={Clock} color={STOP_COLOR} />
                  )}
                  <span className="ph-row-main">
                    <span className="ph-row-title">
                      {site ? site.name : <PlaceLabel lat={g.lat} lng={g.lng} showMap={false} />}
                    </span>
                    <span className="ph-row-sub">
                      {num(g.stops.length)} stop{g.stops.length === 1 ? '' : 's'} ·{' '}
                      {num(g.trucks.length)} truck{g.trucks.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="ph-row-end">
                    <strong>{hoursLabel(g.minutes / 60)}</strong>
                    <span className="ph-row-sub">unexplained</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <Empty
          icon={CircleCheck}
          title="No unexplained stop time this week"
          body="Every long stop matched fuel, loading, a bill, a service, rest rules or a queue — or you answered it."
        />
      )}
    </>
  );
}
