import { Truck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { inr, num } from '../../../utils/formatMoney.js';
import { formatInrCompact } from '../../../utils/formatters.js';
import { durationLabel, hoursLabel } from '../model/placeLabels.js';
import { IDLE_COLOR, idleTone } from '../placeHubStyle.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import Empty from './Empty.jsx';
import Kpi from './Kpi.jsx';
import LayerError from './LayerError.jsx';
import ListSkeleton from './ListSkeleton.jsx';
import Segmented from './Segmented.jsx';

export default function IdlingPanel({
  loading,
  view,
  onView,
  live,
  liveTotals,
  spots,
  historyTotals,
  truncated,
  idleSetting,
  errors,
  selectedId,
  onPickLive,
  onPickSpot,
}) {
  const thresholdMin = idleSetting?.idleThresholdMin;
  return (
    <>
      <div className="ph-kpis">
        <Kpi
          label="Idling now"
          value={num(liveTotals.count)}
          hint={`${num(liveTotals.excessCount)} outside a place`}
        />
        <Kpi
          label="Burning now"
          value={formatInrCompact(liveTotals.rupees)}
          tone={liveTotals.excessRupees > 0 ? 'crit' : null}
        />
        <Kpi
          label="Excess · 7 days"
          value={formatInrCompact(historyTotals.excessRupees)}
          tone="crit"
        />
        <Kpi label="Idle hours · 7 days" value={hoursLabel(historyTotals.hours)} />
      </div>
      <div className="ph-filter">
        <Segmented
          label="Idling view"
          value={view}
          onChange={onView}
          options={[
            { id: 'live', label: 'Live now', count: live.length },
            { id: 'spots', label: 'Idle spots · 7 days', count: spots.length },
          ]}
        />
        {thresholdMin != null ? (
          <p className="ph-idle-rule">
            <Clock size={13} aria-hidden="true" />
            <span>
              Counting stops of <strong>{num(thresholdMin)} min</strong> or more
              {idleSetting.idleThresholdSource === 'DEFAULT' ? ' (default)' : ''}
            </span>
            <Link to="/settings?section=idling">Change</Link>
          </p>
        ) : null}
      </div>
      <LayerError errors={errors} what="idling data" />
      {loading && !live.length && !spots.length ? (
        <ListSkeleton />
      ) : view === 'live' ? (
        live.length ? (
          <ul className="ph-list">
            {live.map((e) => {
              const id = `live:${e._id}`;
              const excess = e.legitimacy === 'excess';
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`ph-row${id === selectedId ? ' is-selected' : ''}`}
                    onClick={() => onPickLive(e)}
                  >
                    <TypeTile Icon={Truck} color={excess ? IDLE_COLOR.excess : IDLE_COLOR.legit} />
                    <span className="ph-row-main">
                      <span className="ph-row-title ph-mono">
                        {e.registrationNumber || 'Unknown truck'}
                      </span>
                      <span className="ph-row-sub">
                        {durationLabel(e.durationMin)} · {e.zoneName || 'Outside any place'}
                      </span>
                    </span>
                    <span className="ph-row-end">
                      <strong>{inr(e.rupees)}</strong>
                      <span className={`ph-pill ${excess ? 'ph-pill--crit' : 'ph-pill--ok'}`}>
                        {excess ? 'Excess' : 'Legit'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty
            icon={Truck}
            title="No truck is idling right now"
            body="Live idling shows here the moment an engine runs while parked."
          />
        )
      ) : spots.length ? (
        <>
          {truncated && <p className="ph-note">Built from the latest 500 idle events.</p>}
          <ol className="ph-list">
            {spots.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`ph-row${s.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onPickSpot(s)}
                >
                  <span className="ph-rank" style={{ color: IDLE_COLOR[idleTone(s.excessShare)] }}>
                    {i + 1}
                  </span>
                  <span className="ph-row-main">
                    <span className="ph-row-title">
                      {s.zoneNames[0] || <PlaceLabel lat={s.lat} lng={s.lng} showMap={false} />}
                    </span>
                    <span className="ph-row-sub">
                      {num(s.events)} idles · {hoursLabel(s.hours)} · {num(s.trucks.length)} trucks
                    </span>
                  </span>
                  <span className="ph-row-end">
                    <strong>{formatInrCompact(s.rupees)}</strong>
                    <span className="ph-row-sub">{Math.round(s.excessShare * 100)}% excess</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <Empty icon={Truck} title="No idling in the last 7 days" />
      )}
    </>
  );
}
