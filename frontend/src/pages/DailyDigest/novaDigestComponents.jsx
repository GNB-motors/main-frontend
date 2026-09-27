import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Check,
  X as XIcon,
  Wrench,
  Route as RouteIcon,
  Fuel as FuelIcon,
  Clock,
} from 'lucide-react';
import { formatINR, formatKm, formatLitres, formatNum } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';

/**
 * "Nova Edge Pro" presentational layer — a pixel-level port of
 * Design/Daily Digest (standalone).html into React, wired to real data
 * instead of the mockup's random generator. Every class name here is
 * `nd-*`, scoped in novaDigest.css under `.nova-digest` so these otherwise
 * very generic names (.card, .item, .tab…) never leak into the rest of the
 * app's CSS.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function dayOffset(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / DAY_MS);
}

// Nova's attention cards only carry 3 tones; CRITICAL and HIGH share the
// red "high" tone (still told apart by the SEV badge text), MEDIUM is
// amber, LOW is the AI/nebula purple — matches EVT/SEV in the mockup.
const NOVA_SEV = {
  CRITICAL: { c: '#C2323A', tint: 'rgba(229,104,107,.14)' },
  HIGH: { c: '#C2323A', tint: 'rgba(229,104,107,.14)' },
  MEDIUM: { c: '#C56200', tint: 'rgba(240,170,72,.16)' },
  LOW: { c: '#6A43D8', tint: 'rgba(106,67,216,.12)' },
};

const EVT_COLOR = {
  trip: 'var(--nova-rage-400)',
  service: '#C56200',
  doc: '#C2323A',
  insp: '#6A43D8',
};

/* =============================== Skeletons =============================== */

export function NdKpiStripSkeleton() {
  return (
    <div className="nd-kpis">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="nd-kpi">
          <div className="nd-kpi-top">
            <span className="nd-sk" style={{ width: 16, height: 16, borderRadius: 4 }} />
            <span className="nd-sk" style={{ width: '55%', height: 11 }} />
          </div>
          <span className="nd-sk" style={{ width: '45%', height: 24, marginTop: 14 }} />
          <span className="nd-sk" style={{ width: '75%', height: 10, marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

// Generic per-card skeleton: mirrors .nd-card / .nd-card-head, with `rows`
// shimmer bars standing in for whatever list/table content the real card
// renders. `big` adds one taller block for cards that lead with a stat
// (e.g. impact card's total, ops row's headline number).
export function NdCardSkeleton({ rows = 4, rowHeight = 44, big = false }) {
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <span className="nd-sk" style={{ width: 140, height: 14 }} />
        <span className="nd-sp" />
        <span className="nd-sk" style={{ width: 70, height: 12 }} />
      </div>
      {big ? (
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <span className="nd-sk" style={{ width: '40%', height: 32 }} />
        </div>
      ) : null}
      <div className="nd-sk-rows">
        {[...Array(rows)].map((_, i) => (
          <span key={i} className="nd-sk" style={{ height: rowHeight, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

export function NdOpsRowSkeleton() {
  return (
    <section className="nd-ops">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="nd-card nd-opcard">
          <div className="nd-card-head">
            <span className="nd-sk" style={{ width: 110, height: 14 }} />
          </div>
          <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
            <span className="nd-sk" style={{ width: '50%', height: 30 }} />
            <span className="nd-sk" style={{ width: '70%', height: 11, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </section>
  );
}

/* ============================== KPI strip ============================== */

export function NdKpiStrip({ items }) {
  return (
    <div className="nd-kpis">
      {items.map((k) => {
        const Icon = k.icon;
        const body = (
          <>
            <div className="nd-kpi-top">
              <span className="nd-kpi-label">
                <Icon size={15} />
                <span>{k.label}</span>
              </span>
              <span className="nd-kpi-go">
                <ArrowUpRight size={14} />
              </span>
            </div>
            <div className="nd-kpi-val">
              {k.value}
              {k.unit ? <small> {k.unit}</small> : null}
            </div>
            <div className="nd-kpi-foot">
              {k.delta ? (
                <span className={`nd-delta nd-delta--${k.dir || 'flat'}`}>
                  {k.dir === 'up' ? (
                    <ArrowUp size={10} />
                  ) : k.dir === 'down' ? (
                    <ArrowDown size={10} />
                  ) : null}
                  {k.delta}
                </span>
              ) : null}
              <span>{k.note}</span>
            </div>
          </>
        );
        return k.to ? (
          <Link
            key={k.id}
            to={k.to}
            className={`nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim()}
          >
            {body}
          </Link>
        ) : (
          <div key={k.id} className={`nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim()}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ========================= Needs your attention ========================= */

export function NdAttentionCard({ actions }) {
  const [filter, setFilter] = useState('all');
  const tabs = [
    { k: 'all', l: 'All', n: actions.length },
    {
      k: 'high',
      l: 'High',
      n: actions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH').length,
    },
    { k: 'medium', l: 'Medium', n: actions.filter((a) => a.sev === 'MEDIUM').length },
  ];
  const rows =
    filter === 'all'
      ? actions
      : filter === 'high'
        ? actions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH')
        : actions.filter((a) => a.sev === 'MEDIUM');

  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Needs your attention</h2>
        <span className="nd-count-pill">{rows.length}</span>
        <span className="nd-sp" />
        <div className="nd-tabs">
          {tabs.map((t) => (
            <button
              key={t.k}
              type="button"
              className="nd-tab"
              aria-pressed={filter === t.k}
              onClick={() => setFilter(t.k)}
            >
              {t.l}
              <b>{t.n}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="nd-attn">
        {rows.length === 0 ? (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>You&apos;re all caught up</b>
            <span>No open items in this filter.</span>
          </div>
        ) : (
          rows.map((a) => {
            const s = NOVA_SEV[a.sev] || NOVA_SEV.MEDIUM;
            const Icon = a.icon;
            return (
              <article key={a.id} className="nd-item" style={{ '--c': s.c, '--tint': s.tint }}>
                <span className="nd-item-ico">
                  <Icon size={18} />
                </span>
                <div className="nd-item-body">
                  <div className="nd-item-title">
                    <b>{a.title}</b>
                    <span className="nd-sev">
                      <i />
                      {a.sev === 'CRITICAL' || a.sev === 'HIGH' ? 'high' : a.sev.toLowerCase()}
                    </span>
                  </div>
                  <p className="nd-item-text">{a.desc}</p>
                  {a.meta ? (
                    <div className="nd-item-meta">
                      <span>
                        <Clock size={13} />
                        {a.meta}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="nd-item-side">
                  {a.amt ? <span className="nd-item-amt">{a.amt}</span> : null}
                  <Link to={a.to} className="nd-btn nd-btn--sm">
                    {a.cta || 'Review'}
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

/* =============================== ₹ impact =============================== */

export function NdImpactCard({ money }) {
  const rows = [
    { key: 'idling', label: 'Idling cost', v: money?.idlingWasteInr || 0, c: '#C56200' },
    { key: 'detour', label: 'Detour cost', v: money?.detourWasteInr || 0, c: '#2F58EE' },
    { key: 'siphon', label: 'Fuel siphon loss', v: money?.theftLossInr || 0, c: '#C2323A' },
    { key: 'mismatch', label: 'Bill mismatch', v: money?.billFraudSuspectInr || 0, c: '#6A43D8' },
  ];
  const total = rows.reduce((s, r) => s + r.v, 0);

  return (
    <div className="nd-card" id="nd-impact">
      <div className="nd-card-head">
        <h2>Today&apos;s ₹ impact</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Estimated</span>
      </div>
      <div className="nd-impact-total">
        <div className="nd-eyebrow">Total ₹ impact today</div>
        <div className="nd-v">{formatINR(total)}</div>
        <div className="nd-n">Across sections reporting a number today</div>
      </div>
      <div className="nd-bars">
        {rows.map((r) => (
          <div key={r.key} className="nd-bar-row" style={{ '--c': r.c }}>
            <span className="nd-n">{r.label}</span>
            <span className="nd-a">{formatINR(r.v)}</span>
            <span className="nd-t">
              <span className="nd-f" style={{ width: `${total ? (r.v / total) * 100 : 0}%` }} />
            </span>
          </div>
        ))}
        <div className="nd-bar-row">
          <span className="nd-n" style={{ color: 'var(--fg-tertiary)' }}>
            {money?.disclaimer || 'Estimated from FleetEdge telemetry and configured prices.'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================ Fleet calendar ============================ */

// Flattens getFleetCalendar()'s per-vehicle events into the {start, len}
// day-offset shape the Gantt/month grid render, same model the mockup uses.
function useCalendarEvents(vehicles) {
  return useMemo(() => {
    return (vehicles || []).map((v) => ({
      ...v,
      events: (v.events || []).map((e) => ({
        ...e,
        start: dayOffset(e.date),
        len: e.len || 1,
      })),
    }));
  }, [vehicles]);
}

export function NdCalendarCard({ vehicles, days = 14, onOpenVehicle, selectedVehicleId }) {
  const [view, setView] = useState('gantt');
  const veh = useCalendarEvents(vehicles);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today.getTime() + (days - 1) * DAY_MS);
  const rangeLabel = `${formatDateIST(today)} – ${formatDateIST(rangeEnd)} · planned trips`;

  return (
    <section className="nd-card">
      <div className="nd-card-head">
        <h2>Fleet calendar</h2>
        <span className="nd-hint">{rangeLabel}</span>
        <span className="nd-sp" />
        <div className="nd-tabs" style={{ marginLeft: 8 }}>
          <button
            type="button"
            className="nd-tab"
            aria-pressed={view === 'gantt'}
            onClick={() => setView('gantt')}
          >
            {days} days
          </button>
          <button
            type="button"
            className="nd-tab"
            aria-pressed={view === 'month'}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>
      <div className="nd-legend">
        <span>
          <i style={{ background: 'var(--nova-rage-400)' }} />
          Planned trip
        </span>
        <span>
          <i
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
          />
          Weekend
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--fg-tertiary)' }}>
          Click any vehicle or trip bar for detail
        </span>
      </div>
      {veh.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>Nothing scheduled</b>
          <span>Trips, service and document due-dates appear here as they&apos;re planned.</span>
        </div>
      ) : view === 'gantt' ? (
        <NdGantt
          vehicles={veh}
          days={days}
          onOpenVehicle={onOpenVehicle}
          selectedVehicleId={selectedVehicleId}
        />
      ) : (
        <NdMonth vehicles={veh} onOpenVehicle={onOpenVehicle} />
      )}
    </section>
  );
}

function NdGantt({ vehicles, days, onOpenVehicle, selectedVehicleId }) {
  const heads = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const we = [0, 6].includes(d.getDay());
    return (
      <div key={i} className={`nd-gcell ${i === 0 ? 'nd-today' : ''} ${we ? 'nd-we' : ''}`.trim()}>
        <div className="nd-d">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
        <div className="nd-n">{d.getDate()}</div>
      </div>
    );
  });
  const nowPct = (new Date().getHours() * 60 + new Date().getMinutes()) / 1440;

  return (
    <div className="nd-gantt">
      <div className="nd-grow" style={{ '--days': days }}>
        <div className="nd-ghead nd-gsticky">
          <span className="nd-eyebrow">Vehicle</span>
        </div>
        <div
          className="nd-ghead"
          style={{
            gridColumn: '2 / -1',
            display: 'grid',
            gridTemplateColumns: `repeat(${days}, minmax(56px, 1fr))`,
          }}
        >
          {heads}
        </div>
        {vehicles.map((v) => {
          const bars = (v.events || [])
            .filter((e) => e.type === 'trip' && e.start + e.len > 0 && e.start < days)
            .map((e, i) => {
              const s = Math.max(0, e.start);
              const end = Math.min(days, e.start + e.len);
              const span = end - s;
              const past = e.start + e.len <= 0;
              const label =
                span >= 3
                  ? `${e.label}${e.tons ? ` · ${e.tons}t` : ''}`
                  : span === 2
                    ? e.label
                    : '';
              return (
                <button
                  key={i}
                  type="button"
                  className={`nd-ev ${past ? 'nd-ev--done' : 'nd-ev--trip'} ${span < 2 ? 'nd-narrow' : ''}`.trim()}
                  style={{
                    left: `calc(${s} * (100% / ${days}) + 3px)`,
                    width: `calc(${span} * (100% / ${days}) - 6px)`,
                  }}
                  title={`${e.label}${e.tons ? ` · ${e.tons} t` : ''} · ${e.len} day${e.len > 1 ? 's' : ''}`}
                  onClick={() => onOpenVehicle(v.vehicleId)}
                >
                  <RouteIcon size={11} />
                  {label}
                </button>
              );
            });
          const cells = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + i);
            const we = [0, 6].includes(d.getDay());
            return (
              <div
                key={i}
                className={`nd-gtrack ${i === 0 ? 'nd-today' : ''} ${we ? 'nd-we' : ''}`.trim()}
              />
            );
          });
          return (
            <div
              key={v.vehicleId}
              className={`nd-vrow ${v.vehicleId === selectedVehicleId ? 'nd-is-sel' : ''}`.trim()}
            >
              <button
                type="button"
                className="nd-gsticky"
                onClick={() => onOpenVehicle(v.vehicleId)}
              >
                <div className="nd-vname">
                  <span className="nd-dot" style={{ background: 'var(--morning-fog-500)' }} />
                  <span className="nd-p">{v.registrationNumber}</span>
                </div>
                <div className="nd-vsub">{v.model || '—'}</div>
              </button>
              <div className="nd-gtrackrow">
                {cells}
                {bars}
              </div>
            </div>
          );
        })}
        <span
          className="nd-nowline"
          style={{ left: `calc(208px + (100% - 208px) / ${days} * ${nowPct.toFixed(3)})` }}
        />
      </div>
    </div>
  );
}

function NdMonth({ vehicles, onOpenVehicle }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7;
  const dkey = (d) => d.toISOString().slice(0, 10);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + (i - startPad));
    const off = d.getMonth() !== today.getMonth();
    const evs = [];
    vehicles.forEach((v) =>
      (v.events || []).forEach((e) => {
        if (e.type !== 'trip') return;
        const ed = new Date(today);
        ed.setDate(ed.getDate() + e.start);
        if (dkey(ed) === dkey(d)) evs.push({ v, e });
      }),
    );
    return (
      <button
        key={i}
        type="button"
        className={`nd-mday ${off ? 'nd-out' : ''} ${dkey(d) === dkey(today) ? 'nd-today' : ''}`.trim()}
        onClick={() => evs[0] && onOpenVehicle(evs[0].v.vehicleId)}
      >
        <span className="nd-dnum">{d.getDate()}</span>
        {evs.slice(0, 3).map((x, i2) => (
          <span key={i2} className="nd-mchip" style={{ background: EVT_COLOR[x.e.type] }}>
            {x.v.registrationNumber.slice(-4)} {x.e.label}
          </span>
        ))}
        {evs.length > 3 ? <span className="nd-mmore">+{evs.length - 3} more</span> : null}
      </button>
    );
  });

  return (
    <div className="nd-mgrid">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="nd-mdow">
          {d}
        </div>
      ))}
      {cells}
    </div>
  );
}

/* =========================== Refuelling today =========================== */

export function NdRefuelCard({ data, onOpenVehicle }) {
  const fills = data?.fills || [];
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Refuelling today</h2>
        <span className="nd-count-pill">{data?.totalCount || 0}</span>
        <span className="nd-sp" />
        {data?.litresFilled ? (
          <span className="nd-hint">
            ₹
            {data.spendInr && data.litresFilled
              ? Math.round(data.spendInr / data.litresFilled)
              : '—'}
            /L avg
          </span>
        ) : null}
      </div>
      {fills.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <FuelIcon size={22} />
          </span>
          <b>No fills recorded today</b>
          <span>Refuel logs appear here as drivers capture them.</span>
        </div>
      ) : (
        <>
          <div className="nd-ministats">
            <div className="nd-ministat">
              <div className="nd-k">Litres filled</div>
              <div className="nd-v">{formatLitres(data.litresFilled)}</div>
            </div>
            <div className="nd-ministat">
              <div className="nd-k">Spend</div>
              <div className="nd-v">{formatINR(data.spendInr)}</div>
            </div>
            <div className="nd-ministat">
              <div className="nd-k">Tank-verified</div>
              <div className="nd-v">
                {data.verifiedCount}/{data.totalCount}
              </div>
            </div>
          </div>
          <table className="nd-tbl">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Litres</th>
                <th className="nd-num">Amount</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((f, i) => (
                <tr key={`${f.vehicleId}-${i}`} onClick={() => onOpenVehicle(f.vehicleId)}>
                  <td>
                    <span className="nd-plate">{f.registrationNumber}</span>
                    <div className="nd-muted" style={{ fontSize: 11 }}>
                      {[f.station, f.refuelTime ? formatDateTimeIST(f.refuelTime) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </td>
                  <td className="nd-muted">{formatLitres(f.litres)}</td>
                  <td className="nd-num">{formatINR(f.amountInr)}</td>
                  <td>
                    <span
                      className="nd-state"
                      style={{ color: f.tankVerified === false ? '#C2323A' : '#187A32' }}
                    >
                      <i />
                      {f.tankVerified === false
                        ? f.billVarianceL != null
                          ? `${formatNum(f.billVarianceL)} L`
                          : 'Mismatch'
                        : f.tankVerified === true
                          ? 'Verified'
                          : 'Unmatched'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {data?.lowTankBeforeTrip?.length ? (
        <div className="nd-band">
          <span className="nd-ic">
            <FuelIcon size={16} />
          </span>
          <span>
            <b>{data.lowTankBeforeTrip.length}</b> vehicle
            {data.lowTankBeforeTrip.length === 1 ? '' : 's'} start a trip within 24h under{' '}
            {formatLitres(data.lowFuelThresholdL)}
          </span>
        </div>
      ) : fills.length > 0 ? (
        <div className="nd-band" style={{ background: 'rgba(37,186,76,.12)' }}>
          <span className="nd-ic" style={{ color: '#187A32' }}>
            <Check size={16} />
          </span>
          <span>Every vehicle with a trip in the next 24h has fuel for the leg.</span>
        </div>
      ) : null}
    </div>
  );
}

/* ======================= Idling & detour waste table ====================== */

export function NdWasteTable({ idlingTop5, detourTop5, onOpenVehicle }) {
  const byVehicle = new Map();
  (idlingTop5 || []).forEach((r) =>
    byVehicle.set(r.registrationNumber, { ...r, detourKm: 0, detourCostInr: 0 }),
  );
  (detourTop5 || []).forEach((r) => {
    const row = byVehicle.get(r.registrationNumber) || {
      registrationNumber: r.registrationNumber,
      idleMinutes: 0,
      idleCostInr: 0,
    };
    row.detourKm = r.detourKm;
    row.detourCostInr = r.detourCostInr;
    byVehicle.set(r.registrationNumber, row);
  });
  const rows = [...byVehicle.values()].sort(
    (a, b) => b.idleCostInr + b.detourCostInr - (a.idleCostInr + a.detourCostInr),
  );

  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Idling &amp; detour waste</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Today · top 5 vehicles</span>
      </div>
      {rows.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>No idling or detour waste today</b>
          <span>Vehicles idling over 30 min or driving off-route appear here.</span>
        </div>
      ) : (
        <table className="nd-tbl">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Idling</th>
              <th>Detour</th>
              <th className="nd-num">Cost today</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registrationNumber} onClick={() => onOpenVehicle(r.registrationNumber)}>
                <td>
                  <span className="nd-plate">{r.registrationNumber}</span>
                </td>
                <td className="nd-muted">
                  {r.idleMinutes ? `${formatNum(r.idleMinutes)} min` : '—'}
                </td>
                <td className="nd-muted">{r.detourKm ? formatKm(r.detourKm) : '—'}</td>
                <td className="nd-num" style={{ color: '#C2323A' }}>
                  {formatINR(r.idleCostInr + r.detourCostInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ================================ Upcoming =============================== */

export function NdUpcomingCard({ upcoming, onOpenVehicle }) {
  const buckets = [
    { l: 'Today', s: 0, e: 0 },
    { l: 'Tomorrow', s: 1, e: 1 },
    { l: 'This week', s: 2, e: 7 },
    { l: 'Next week', s: 8, e: 14 },
  ];
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Upcoming</h2>
        <span className="nd-count-pill">{upcoming.length}</span>
        <span className="nd-sp" />
        <span className="nd-hint">Next 14 days · service and documents</span>
      </div>
      {upcoming.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>No upcoming service items</b>
          <span>Service and document reminders will surface here as due dates approach.</span>
        </div>
      ) : (
        <div className="nd-upgrid">
          {buckets.map((b) => {
            const rows = upcoming.filter((u) => u.days >= b.s && u.days <= b.e);
            if (!rows.length) return null;
            return (
              <div key={b.l} className="nd-daygroup">
                <div className="nd-dghead">
                  <span className="nd-t">{b.l}</span>
                  <span className="nd-s">
                    {rows.length} item{rows.length > 1 ? 's' : ''}
                  </span>
                </div>
                {rows.map((u) => {
                  const when =
                    u.days === 0
                      ? 'Today'
                      : formatDateIST(new Date(Date.now() + u.days * DAY_MS).toISOString());
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="nd-urow"
                      onClick={() => onOpenVehicle(u.registrationNumber)}
                    >
                      <span className="nd-evdot" style={{ background: '#C56200' }} />
                      <span className="nd-plate">{u.registrationNumber}</span>
                      <span className="nd-what">{u.kind}</span>
                      <span className="nd-sp" />
                      <span className="nd-when">{when}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ Operations row ============================ */

export function NdOpsRow({ money, fuelEfficiency, onOpenVehicle }) {
  const idlingTop5 = money?.idlingTop5 || [];
  const detourTop5 = money?.detourTop5 || [];
  const idleMinutesTotal = idlingTop5.reduce((s, r) => s + (r.idleMinutes || 0), 0);
  const detourKmTotal = detourTop5.reduce((s, r) => s + (r.detourKm || 0), 0);
  const worst = fuelEfficiency?.worst || [];
  const best = Math.max(1, ...worst.map((v) => v.kmpl));

  return (
    <section className="nd-ops">
      <div className="nd-card nd-opcard" style={{ '--c': '#C56200' }}>
        <div className="nd-card-head">
          <h2>Idling waste</h2>
          <span className="nd-sp" />
        </div>
        <div className="nd-big">
          <span className="nd-v" style={{ color: '#C56200' }}>
            {formatINR(money?.idlingWasteInr || 0)}
          </span>
          <span className="nd-u">
            {idleMinutesTotal} min outside known loading and customer zones
          </span>
        </div>
      </div>
      <div className="nd-card nd-opcard" style={{ '--c': '#2F58EE' }}>
        <div className="nd-card-head">
          <h2>Detour waste</h2>
          <span className="nd-sp" />
        </div>
        <div className="nd-big">
          <span className="nd-v" style={{ color: '#2F58EE' }}>
            {formatINR(money?.detourWasteInr || 0)}
          </span>
          <span className="nd-u">{detourKmTotal.toFixed(0)} km driven off the planned route</span>
        </div>
      </div>
      <div className="nd-card nd-opcard" style={{ '--c': '#187A32' }}>
        <div className="nd-card-head">
          <h2>Fuel efficiency</h2>
          <span className="nd-sp" />
          <span className="nd-hint">Worst {worst.length} vs fleet</span>
        </div>
        {worst.length === 0 ? (
          <div className="nd-empty">
            <span className="nd-ok">
              <FuelIcon size={22} />
            </span>
            <b>No fuel efficiency data yet</b>
            <span>Appears once a full-tank-to-full-tank refuel cycle completes.</span>
          </div>
        ) : (
          <>
            <div className="nd-big">
              <span className="nd-v">
                {fuelEfficiency.fleetKmpl ?? '—'}{' '}
                <span
                  style={{
                    fontSize: 'var(--type-s)',
                    color: 'var(--fg-secondary)',
                    fontWeight: 500,
                  }}
                >
                  km/L
                </span>
              </span>
              <span className="nd-u">fleet average this week</span>
            </div>
            <div className="nd-bars" style={{ paddingTop: 0 }}>
              {worst.map((v) => (
                <button
                  key={v.vehicleId}
                  type="button"
                  className="nd-bar-row"
                  style={{
                    '--c':
                      fuelEfficiency.fleetKmpl && v.kmpl < fuelEfficiency.fleetKmpl * 0.85
                        ? '#C2323A'
                        : '#C56200',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={() => onOpenVehicle(v.registrationNumber)}
                >
                  <span className="nd-n">{v.registrationNumber}</span>
                  <span className="nd-a">{v.kmpl} km/L</span>
                  <span className="nd-t">
                    <span className="nd-f" style={{ width: `${(v.kmpl / best) * 100}%` }} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ============================== Vehicle drawer ============================ */

export function NdVehicleDrawer({ vehicle, onClose }) {
  const navigate = useNavigate();
  const open = Boolean(vehicle);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`nd-scrim ${open ? 'nd-on' : ''}`.trim()} onClick={onClose} />
      <aside className={`nd-vdrawer ${open ? 'nd-open' : ''}`.trim()} aria-hidden={!open}>
        {vehicle ? (
          <>
            <div className="nd-vd-head">
              <span className="nd-vd-tile">
                <RouteIcon size={24} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nd-plate">{vehicle.registrationNumber}</div>
                <div className="nd-model">{vehicle.model || '—'}</div>
              </div>
              <button
                type="button"
                className="nd-btn nd-btn--icon nd-btn--sm"
                aria-label="Close"
                onClick={onClose}
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="nd-vd-body">
              <div className="nd-vd-sec">
                <span className="nd-eyebrow">Today</span>
                <div className="nd-vd-grid">
                  <div className="nd-vd-stat">
                    <div className="nd-k">Idling</div>
                    <div className="nd-v">
                      {vehicle.idleMinutes != null ? `${vehicle.idleMinutes} min` : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Detour</div>
                    <div className="nd-v">
                      {vehicle.detourKm != null ? formatKm(vehicle.detourKm) : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Fuel in tank</div>
                    <div className="nd-v">
                      {vehicle.fuelLevelL != null ? `${vehicle.fuelLevelL} L` : '—'}
                    </div>
                  </div>
                  <div className="nd-vd-stat">
                    <div className="nd-k">Efficiency</div>
                    <div className="nd-v">
                      {vehicle.kmpl != null ? `${vehicle.kmpl} km/L` : '—'}
                    </div>
                  </div>
                </div>
                {vehicle.fill ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span
                      className="nd-evdot"
                      style={{
                        background: vehicle.fill.tankVerified === false ? '#C2323A' : '#187A32',
                      }}
                    />
                    <span>
                      Refuelled {formatLitres(vehicle.fill.litres)} · {vehicle.fill.station || '—'}
                    </span>
                    <span className="nd-sp" />
                    <span className="nd-when">
                      {vehicle.fill.refuelTime ? formatDateTimeIST(vehicle.fill.refuelTime) : ''}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="nd-vd-sec">
                <span className="nd-eyebrow">Trips &amp; events</span>
                {vehicle.events?.length ? (
                  vehicle.events.map((e, i) => (
                    <div key={i} className="nd-vd-line">
                      <span className="nd-evdot" style={{ background: EVT_COLOR[e.type] }} />
                      <span>
                        {e.label}
                        {e.tons ? ` · ${e.tons} t` : ''}
                      </span>
                      <span className="nd-sp" />
                      <span className="nd-when">{formatDateIST(e.date)}</span>
                    </div>
                  ))
                ) : (
                  <div className="nd-vd-line">
                    <span className="nd-when">No scheduled events.</span>
                  </div>
                )}
              </div>
              <div className="nd-vd-sec" style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="nd-btn nd-btn--sm nd-btn--primary"
                  style={{ flex: 1 }}
                  onClick={() =>
                    navigate(`/vehicles/${encodeURIComponent(vehicle.registrationNumber)}`)
                  }
                >
                  <RouteIcon size={14} />
                  View vehicle
                </button>
                <button
                  type="button"
                  className="nd-btn nd-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/vehicles/service-intelligence')}
                >
                  <Wrench size={14} />
                  Log service
                </button>
              </div>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
