import { Search, MapPinPlus, ShieldAlert } from 'lucide-react';
import { num } from '../../../utils/formatMoney.js';
import { PLACE_GROUPS, placeTypeLabel, radiusLabel } from '../placeHubModel.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import Empty from './Empty.jsx';
import LayerError from './LayerError.jsx';
import ListSkeleton from './ListSkeleton.jsx';

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
export default function PlacesPanel({
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
