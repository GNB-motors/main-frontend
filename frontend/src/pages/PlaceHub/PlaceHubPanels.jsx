import {
  Search,
  MapPinPlus,
  Truck,
  Flame,
  Droplets,
  CircleAlert,
  CircleCheck,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { compactInr, inr, num } from '../../utils/formatMoney.js';
import {
  PLACE_GROUPS,
  PROVENANCE_LABEL,
  placeTypeLabel,
  radiusLabel,
  durationLabel,
  hoursLabel,
  stopTotals,
} from './placeHubModel.js';
import {
  styleOfType,
  PROVENANCE_COLOR,
  IDLE_COLOR,
  idleTone,
  DRAIN_COLOR,
  STOP_COLOR,
} from './placeHubStyle.js';

dayjs.extend(relativeTime);

/* ─── Shared bits ────────────────────────────────────────────────────────── */

export function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`ph-kpi${tone ? ` ph-kpi--${tone}` : ''}`}>
      <span className="ph-kpi-label">{label}</span>
      <strong className="ph-kpi-value">{value}</strong>
      {hint && <span className="ph-kpi-hint">{hint}</span>}
    </div>
  );
}

export function TypeTile({ type, color: override, Icon: IconOverride, size = 34 }) {
  const { Icon, color } = styleOfType(type);
  const C = IconOverride || Icon;
  const c = override || color;
  return (
    <span
      className="ph-tile"
      style={{ width: size, height: size, color: c, background: `${c}1a`, borderColor: `${c}33` }}
      aria-hidden="true"
    >
      <C size={Math.round(size * 0.5)} />
    </span>
  );
}

function Segmented({ value, options, onChange, label }) {
  return (
    <div className="ph-seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={`ph-seg-btn${value === o.id ? ' is-on' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {o.count != null && <span className="ph-seg-count">{num(o.count)}</span>}
        </button>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="ph-list" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="ph-row ph-row--ghost">
          <span className="ph-shimmer ph-ghost-tile" />
          <span className="ph-ghost-lines">
            <span className="ph-shimmer" />
            <span className="ph-shimmer" />
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon = CircleAlert, title, body, action }) {
  const Icon = icon;
  return (
    <div className="ph-empty">
      <span className="ph-empty-icon">
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

function LayerError({ errors }) {
  const failed = Object.entries(errors).filter(([, e]) => e);
  if (!failed.length) return null;
  return (
    <p className="ph-layer-error" role="status">
      <CircleAlert size={13} /> Some places could not load ({failed.map(([k]) => k).join(', ')}).
      What loaded is shown.
    </p>
  );
}

/* ─── Places ─────────────────────────────────────────────────────────────── */

function placeMeta(p) {
  if (p.risk && p.status !== 'REJECTED')
    return (
      <span className="ph-pill ph-pill--crit" title="Theft or unauthorised refuelling reported">
        <ShieldAlert size={11} /> Fuel risk
      </span>
    );
  if (p.status === 'PROPOSED') return <span className="ph-pill ph-pill--warn">To review</span>;
  if (p.status === 'REJECTED') return <span className="ph-pill ph-pill--muted">Not a place</span>;
  if (p.erp) return <span className="ph-pill ph-pill--muted">ERP</span>;
  if (p.source === 'zone' && (p.alerts.entry || p.alerts.exit))
    return <span className="ph-pill ph-pill--info">Alerts</span>;
  return null;
}

const STATUS_CHIPS = new Set(['risk', 'review', 'rejected']);
const CHIP_TONE = { risk: 'crit', review: 'warn' };

// No KPI tiles here: the chips already carry every count.
export function PlacesPanel({
  loading,
  places,
  counts,
  group,
  onGroup,
  query,
  onQuery,
  selectedId,
  onPick,
  errors,
  canEdit,
  onAdd,
  reviewNote,
}) {
  const chips = PLACE_GROUPS.filter((g) => g.id === 'all' || counts[g.id]);
  const chip = (g) => (
    <button
      key={g.id}
      type="button"
      role="tab"
      aria-selected={group === g.id}
      className={`ph-chip${group === g.id ? ' is-on' : ''}${CHIP_TONE[g.id] ? ` ph-chip--${CHIP_TONE[g.id]}` : ''}`}
      onClick={() => onGroup(g.id)}
    >
      {g.label}
      <span>{num(counts[g.id] || 0)}</span>
    </button>
  );
  return (
    <>
      <div className="ph-filter">
        <label className="ph-input">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search places"
            aria-label="Search places"
          />
        </label>
        {/* Two rows: what kind of place, then where it stands. */}
        <div className="ph-chip-rows" role="tablist" aria-label="Which places">
          <div className="ph-chips">{chips.filter((g) => !STATUS_CHIPS.has(g.id)).map(chip)}</div>
          {chips.some((g) => STATUS_CHIPS.has(g.id)) && (
            <div className="ph-chips">{chips.filter((g) => STATUS_CHIPS.has(g.id)).map(chip)}</div>
          )}
        </div>
      </div>
      <LayerError errors={errors} />
      {reviewNote && <p className="ph-note">{reviewNote}</p>}
      {loading && !places.length ? (
        <ListSkeleton />
      ) : places.length ? (
        <ul className="ph-list">
          {places.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`ph-row${p.id === selectedId ? ' is-selected' : ''}`}
                onClick={() => onPick(p)}
              >
                <TypeTile type={p.type} />
                <span className="ph-row-main">
                  <span className="ph-row-title">{p.name}</span>
                  <span className="ph-row-sub">
                    {placeTypeLabel(p.type)}
                    {' · '}
                    {p.polygon ? 'Outline' : radiusLabel(p.radiusM)}
                    {p.subtitle ? ` · ${p.subtitle}` : ''}
                  </span>
                  {p.raw?.tripDrops?.trips ? (
                    <span className="ph-row-flag">
                      {num(p.raw.tripDrops.trips)} trip
                      {p.raw.tripDrops.trips === 1 ? '' : 's'} turned around here
                    </span>
                  ) : null}
                </span>
                {placeMeta(p)}
              </button>
            </li>
          ))}
        </ul>
      ) : query || group !== 'all' ? (
        <Empty icon={Search} title="No places match" body="Try another search or type." />
      ) : (
        <Empty
          icon={MapPinPlus}
          title="No places yet"
          body="Add your warehouses and zones once — trips, alerts and idling all use them."
          action={
            canEdit && (
              <button type="button" className="ph-btn ph-btn--primary" onClick={onAdd}>
                Add a place
              </button>
            )
          }
        />
      )}
    </>
  );
}

/* ─── Idling ─────────────────────────────────────────────────────────────── */

export function IdlingPanel({
  loading,
  view,
  onView,
  live,
  liveTotals,
  spots,
  historyTotals,
  truncated,
  selectedId,
  onPickLive,
  onPickSpot,
}) {
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
          value={compactInr(liveTotals.rupees)}
          tone={liveTotals.excessRupees > 0 ? 'crit' : null}
        />
        <Kpi label="Excess · 7 days" value={compactInr(historyTotals.excessRupees)} tone="crit" />
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
      </div>
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
                    <strong>{compactInr(s.rupees)}</strong>
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

/* ─── Unexplained stops ──────────────────────────────────────────────────── */

export function StopsPanel({ loading, error, groups, siteOf, selectedId, onPick }) {
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

/* ─── Fuel risk ──────────────────────────────────────────────────────────── */

export function FuelPanel({
  loading,
  view,
  onView,
  hotspots,
  cells,
  totals,
  disclaimer,
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
          value={compactInr(totals.drainRupees)}
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
                      {h.lastIncidentAt ? ` · ${dayjs(h.lastIncidentAt).fromNow()}` : ''}
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
                    <strong>{compactInr(c.rupees)}</strong>
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
