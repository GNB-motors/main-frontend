import { useEffect, useRef, useState } from 'react';
import { Search, MapPinPlus, ShieldAlert, Truck, X, MapPin } from 'lucide-react';
import { num } from '../../../utils/formatMoney.js';
import { PLACE_GROUPS, placeTypeLabel } from '../model/placeGroups.js';
import { radiusLabel, hoursLabel } from '../model/placeLabels.js';
import { fromWarehouse, fromZone } from '../model/mergePlaces.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import Empty from './Empty.jsx';
import LayerError from './LayerError.jsx';
import ListSkeleton from './ListSkeleton.jsx';
import PlaceHubService from '../PlaceHubService.js';

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
  vehicleLabel,
  vehicleHalts = [],
  onVehiclePick,
  onVehicleClear,
  onPickVehicleHalt,
  selectedId,
  onPick,
  errors,
  canEdit,
  onAdd,
  reviewNote,
}) {
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [vehicleSugActive, setVehicleSugActive] = useState(-1);
  const [searchResults, setSearchResults] = useState(null);
  const ctrlRef = useRef(null);
  const placeCtrlRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setVehicleSuggestions([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (vehicleLabel) {
      setVehicleSuggestions([]);
      setSearchResults(null);
      return undefined;
    }
    const q = query.trim();
    if (q.length < 2) {
      setVehicleSuggestions([]);
      setSearchResults(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      if (ctrlRef.current) ctrlRef.current.abort();
      ctrlRef.current = new AbortController();
      if (placeCtrlRef.current) placeCtrlRef.current.abort();
      placeCtrlRef.current = new AbortController();
      try {
        const [vehicleRows, placeRows] = await Promise.all([
          PlaceHubService.searchVehicles(q, { limit: 5, signal: ctrlRef.current.signal }),
          PlaceHubService.searchPlaces(q, { limit: 20, signal: placeCtrlRef.current.signal }),
        ]);
        setVehicleSuggestions(vehicleRows);
        setVehicleSugActive(-1);
        setSearchResults(
          placeRows.map((r) => (r._type === 'warehouse' ? fromWarehouse(r) : fromZone(r))),
        );
      } catch {
        // aborted or network — ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, vehicleLabel]);

  const pickVehicle = (row) => {
    setVehicleSuggestions([]);
    onQuery('');
    onVehiclePick(row);
  };

  const onKeyDown = (e) => {
    if (!vehicleSuggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setVehicleSugActive((i) => Math.min(i + 1, vehicleSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setVehicleSugActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && vehicleSuggestions[Math.max(vehicleSugActive, 0)]) {
      e.preventDefault();
      pickVehicle(vehicleSuggestions[Math.max(vehicleSugActive, 0)]);
    } else if (e.key === 'Escape') {
      setVehicleSuggestions([]);
    }
  };

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
        <div className="ph-input-wrap" ref={wrapRef}>
          <label className="ph-input">
            <Search size={14} aria-hidden="true" />
            <input
              value={vehicleLabel ? vehicleLabel : query}
              readOnly={Boolean(vehicleLabel)}
              onChange={(e) => !vehicleLabel && onQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search places or vehicle reg"
              aria-label="Search places or vehicle"
            />
            {vehicleLabel && (
              <button
                type="button"
                className="ph-input-clear"
                onClick={onVehicleClear}
                aria-label="Clear vehicle"
              >
                <X size={13} />
              </button>
            )}
          </label>

          {vehicleSuggestions.length > 0 && !vehicleLabel && (
            <ul className="ph-vehicle-suggestions">
              {vehicleSuggestions.map((s, i) => (
                <li key={s._id || s.registrationNumber}>
                  <button
                    type="button"
                    className={`ph-vehicle-sug-row${i === vehicleSugActive ? ' is-active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickVehicle(s)}
                  >
                    <Truck size={13} />
                    <span>
                      <strong>{s.registrationNumber}</strong>
                      {(s.model || s.manufacturer) && (
                        <small>{[s.manufacturer, s.model].filter(Boolean).join(' ')}</small>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ph-chip-rows" role="tablist" aria-label="Which places">
          <div className="ph-chips">{chips.filter((g) => !STATUS_CHIPS.has(g.id)).map(chip)}</div>
          {chips.some((g) => STATUS_CHIPS.has(g.id)) && (
            <div className="ph-chips">{chips.filter((g) => STATUS_CHIPS.has(g.id)).map(chip)}</div>
          )}
        </div>
      </div>

      <LayerError errors={errors} />
      {reviewNote && !vehicleLabel && <p className="ph-note">{reviewNote}</p>}

      {vehicleLabel && (
        <>
          {vehicleHalts.length > 0 ? (
            <>
              <p className="ph-vehicle-halt-label">
                {vehicleLabel} · {vehicleHalts.length} habitual stop
                {vehicleHalts.length !== 1 ? 's' : ''}
              </p>
              <ul className="ph-list">
                {vehicleHalts.map((h, i) => (
                  <li key={i}>
                    <button type="button" className="ph-row" onClick={() => onPickVehicleHalt(h)}>
                      <span className="ph-halt-dot" aria-hidden="true" />
                      <span className="ph-row-main">
                        <span className="ph-row-title">Stop {i + 1}</span>
                        <span className="ph-row-sub">
                          {h.occurrences} visit{h.occurrences !== 1 ? 's' : ''}
                          {h.medianDwellMs
                            ? ` · ${hoursLabel(h.medianDwellMs / 3600000)} median dwell`
                            : ''}
                        </span>
                        <span className="ph-row-sub">
                          {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                        </span>
                      </span>
                      <MapPin size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty
              icon={Truck}
              title="No habitual stops found"
              body="This vehicle has no recorded recurring stops in the last 30 days."
            />
          )}
          {places.length > 0 && (
            <p className="ph-vehicle-halt-label ph-vehicle-halt-label--places">All places</p>
          )}
        </>
      )}

      {loading && !places.length && !vehicleLabel && searchResults === null ? (
        <ListSkeleton />
      ) : (searchResults ?? places).length ? (
        <ul className="ph-list">
          {(searchResults ?? places).map((p) => (
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
      ) : searchResults !== null || (query && !vehicleLabel) || group !== 'all' ? (
        <Empty icon={Search} title="No places match" body="Try another search or type." />
      ) : !vehicleLabel ? (
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
      ) : null}
    </>
  );
}
