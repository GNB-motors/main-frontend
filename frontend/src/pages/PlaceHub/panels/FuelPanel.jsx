import { Flame, Droplets } from 'lucide-react';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { num } from '../../../utils/formatMoney.js';
import { formatInrCompact, timeAgo } from '../../../utils/formatters.js';
import { PROVENANCE_LABEL } from '../model/fuelRisk.js';
import { radiusLabel } from '../model/placeLabels.js';
import { PROVENANCE_COLOR, DRAIN_COLOR } from '../placeHubStyle.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import Empty from './Empty.jsx';
import Kpi from './Kpi.jsx';
import LayerError from './LayerError.jsx';
import ListSkeleton from './ListSkeleton.jsx';
import Segmented from './Segmented.jsx';

export default function FuelPanel({
  loading,
  view,
  onView,
  hotspots,
  cells,
  totals,
  disclaimer,
  errors,
  selectedId,
  onPickHotspot,
  onPickCell,
}) {
  return (
    <>
      <div className="ph-kpis">
        <Kpi
          label="Your hotspots"
          value={num(totals.active)}
          tone={totals.active ? 'crit' : null}
        />
        <Kpi label="Network hotspots" value={num(totals.network)} />
        <Kpi
          label="Est. drain"
          value={formatInrCompact(totals.drainRupees)}
          tone={totals.drainRupees ? 'warn' : null}
        />
        <Kpi label="Fuel drops" value={num(totals.drainEvents)} />
      </div>
      <div className="ph-filter">
        <Segmented
          label="Fuel risk view"
          value={view}
          onChange={onView}
          options={[
            { id: 'hotspots', label: 'Hotspots', count: hotspots.length },
            { id: 'drain', label: 'Drain map', count: cells.length },
          ]}
        />
      </div>
      <LayerError errors={errors} what="fuel data" />
      {loading && !hotspots.length && !cells.length ? (
        <ListSkeleton />
      ) : view === 'hotspots' ? (
        hotspots.length ? (
          <ul className="ph-list">
            {hotspots.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={`ph-row${h.id === selectedId ? ' is-selected' : ''}${h.active ? '' : ' is-dim'}`}
                  onClick={() => onPickHotspot(h)}
                >
                  <TypeTile Icon={Flame} color={PROVENANCE_COLOR[h.provenance]} />
                  <span className="ph-row-main">
                    <span className="ph-row-title">{h.name}</span>
                    <span className="ph-row-sub">
                      {PROVENANCE_LABEL[h.provenance]} · {radiusLabel(h.radiusM)}
                      {h.lastIncidentAt ? ` · ${timeAgo(h.lastIncidentAt)}` : ''}
                    </span>
                  </span>
                  <span className="ph-row-end">
                    <strong>{num(h.incidentCount)}</strong>
                    <span className="ph-row-sub">{h.active ? 'incidents' : 'dismissed'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            icon={Flame}
            title="No fuel hotspots"
            body="Hotspots are learned from theft alerts, or you can mark one from the drain map."
          />
        )
      ) : cells.length ? (
        <>
          {disclaimer && <p className="ph-note">{disclaimer}</p>}
          <ol className="ph-list">
            {cells.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`ph-row${c.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onPickCell(c)}
                >
                  <TypeTile Icon={Droplets} color={DRAIN_COLOR} />
                  <span className="ph-row-main">
                    <span className="ph-row-title">
                      <PlaceLabel lat={c.lat} lng={c.lng} showMap={false} />
                    </span>
                    <span className="ph-row-sub">
                      {num(c.events)} drops · {num(Math.round(c.litres))} L ·{' '}
                      {num(c.vehicles.length)} trucks
                    </span>
                  </span>
                  <span className="ph-row-end">
                    <strong>{formatInrCompact(c.rupees)}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <Empty icon={Droplets} title="No fuel drops in this window" />
      )}
    </>
  );
}
