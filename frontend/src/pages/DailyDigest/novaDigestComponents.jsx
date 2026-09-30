import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Check,
  Loader2,
  X as XIcon,
  Wrench,
  Route as RouteIcon,
  Fuel as FuelIcon,
  Clock,
  FileWarning,
  FileText,
  TrendingDown,
  Info,
  Gauge,
  Calendar as CalendarIcon,
  Truck,
} from 'lucide-react';
import { formatINR, formatKm, formatLitres, formatNum } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import FleetDataService from '../../services/FleetDataService';
import { SEV } from './dailyDigestLogic';
import Leaderboard from '../../components/ui/Leaderboard.jsx';

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

// A <tr> can't become a <button>, so clickable rows (role="button") need this
// to be keyboard-reachable — Enter/Space activate it like a real button would.
function onRowKeyDown(activate) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };
}

// Nova's attention cards only carry 3 tones; CRITICAL and HIGH share the
// red "high" tone (still told apart by the SEV badge text). Colors are
// derived from dailyDigestLogic's SEV (theme CSS vars), not a second
// hardcoded palette, so this card respects theme/dark-mode like the rest
// of the page.
const NOVA_SEV = {
  CRITICAL: {
    c: SEV.CRITICAL.color,
    tint: `color-mix(in srgb, ${SEV.CRITICAL.color} 14%, transparent)`,
  },
  HIGH: { c: SEV.HIGH.color, tint: `color-mix(in srgb, ${SEV.HIGH.color} 14%, transparent)` },
  MEDIUM: { c: SEV.MEDIUM.color, tint: `color-mix(in srgb, ${SEV.MEDIUM.color} 16%, transparent)` },
  LOW: { c: SEV.LOW.color, tint: `color-mix(in srgb, ${SEV.LOW.color} 12%, transparent)` },
};

// "insp" (inspection) intentionally omitted — no inspection/roadworthiness
// scheduling exists anywhere in the backend, so getFleetCalendar can never
// emit that event type.
const EVT_COLOR = {
  trip: 'var(--nova-rage-400)',
  service: '#C56200',
  doc: '#C2323A',
};

const EVT_ICON = {
  trip: RouteIcon,
  service: Wrench,
  doc: FileWarning,
};

/* =============================== Skeletons =============================== */

/**
 * A loading card keeps its own frame — border, heading, static hint — and
 * shimmers only the parts still waiting on a response. Replacing the whole
 * card hid WHAT was loading and moved the layout twice: once when the
 * skeleton mounted, again when the real card took its place.
 */

// The real tiles, with their icon and label already in place; only the value
// and its footnote come from a request.
export function NdKpiStripSkeleton({ items = [] }) {
  const tiles = items.length ? items : [...Array(6)].map((_, i) => ({ id: `sk-${i}` }));
  return (
    <div className="nd-kpis">
      {tiles.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.id} className={`nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim()}>
            <div className="nd-kpi-top">
              <span className="nd-kpi-label">
                {Icon ? <Icon size={15} /> : null}
                {k.label ? (
                  <span>{k.label}</span>
                ) : (
                  <span className="nd-sk" style={{ width: 84, height: 11 }} />
                )}
              </span>
              {k.to ? (
                <span className="nd-kpi-go">
                  <ArrowUpRight size={14} />
                </span>
              ) : null}
            </div>
            <div className="nd-kpi-val">
              <span className="nd-sk" style={{ width: '45%', height: 24, marginTop: 4 }} />
            </div>
            <div className="nd-kpi-foot">
              <span className="nd-sk" style={{ width: '75%', height: 10 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Per-card skeleton. `title` and `hint` are static copy, so they render as
 * themselves; `pill` and `tabs` stand in for the header bits whose content is
 * a count, which is the one thing the header cannot know yet.
 */
export function NdCardSkeleton({
  title = null,
  hint = null,
  pill = false,
  tabs = 0,
  rows = 4,
  rowHeight = 44,
  big = false,
}) {
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        {title ? <h2>{title}</h2> : <span className="nd-sk" style={{ width: 140, height: 14 }} />}
        {pill ? (
          <span className="nd-sk" style={{ width: 26, height: 18, borderRadius: 999 }} />
        ) : null}
        <span className="nd-sp" />
        {tabs ? (
          <div className="nd-tabs">
            {[...Array(tabs)].map((_, i) => (
              <span key={i} className="nd-sk" style={{ width: 56, height: 24, borderRadius: 8 }} />
            ))}
          </div>
        ) : hint ? (
          <span className="nd-hint">{hint}</span>
        ) : null}
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

// Same three cards NdOpsRow renders, including their accent colour, so the
// row does not change width or tint when the numbers arrive.
const OPS_SKELETON_CARDS = [
  { title: 'Idling waste', c: '#C56200' },
  { title: 'Detour waste', c: '#2F58EE' },
  { title: 'Fuel efficiency', c: '#187A32' },
];

export function NdOpsRowSkeleton() {
  return (
    <section className="nd-ops">
      {OPS_SKELETON_CARDS.map((card) => (
        <div key={card.title} className="nd-card nd-opcard" style={{ '--c': card.c }}>
          <div className="nd-card-head">
            <h2>{card.title}</h2>
            <span className="nd-sp" />
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

// Smooth-scrolls to an in-page section instead of relying on react-router's
// hash Link, which only rewrites the URL and never actually scrolls on a
// client-side navigation (that's browser-native behaviour, not SPA routing).
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
              {k.to ? (
                <span className="nd-kpi-go">
                  <ArrowUpRight size={14} />
                </span>
              ) : null}
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
        const className = `nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim();
        // In-page anchors ("#nd-attn") scroll to the section instead of
        // routing — a hash-only <Link> would silently do nothing.
        if (k.to?.startsWith('#')) {
          return (
            <button
              key={k.id}
              type="button"
              className={className}
              onClick={() => scrollToSection(k.to.slice(1))}
            >
              {body}
            </button>
          );
        }
        return k.to ? (
          <Link key={k.id} to={k.to} className={className}>
            {body}
          </Link>
        ) : (
          <div key={k.id} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ========================= Needs your attention ========================= */

// ackId alone isn't a safe Set key across item types — ackIds now come from
// three different Mongo collections (UserError, MaintenancePrediction,
// Vehicle.documents), so a real (if astronomically unlikely) collision would
// hide the wrong row.
const resolveKey = (ackType, ackId) => `${ackType || 'ownerAlert'}:${ackId}`;

export function NdAttentionCard({ actions, onResolved }) {
  const [filter, setFilter] = useState('all');
  // Resolved keys are hidden immediately (optimistic) without waiting for the
  // parent's refetch, so the row doesn't sit there until the next data pass.
  const [resolvedKeys, setResolvedKeys] = useState(() => new Set());
  const [ackingId, setAckingId] = useState(null);
  const visibleActions = actions.filter(
    (a) => !a.ackId || !resolvedKeys.has(resolveKey(a.ackType, a.ackId)),
  );

  const handleResolve = async (action) => {
    const { ackId, ackType, ackVehicleId } = action;
    setAckingId(ackId);
    try {
      if (ackType === 'maintenance') {
        await FleetDataService.acknowledgePrediction(ackId);
      } else if (ackType === 'docExpiry') {
        await VehicleService.acknowledgeVehicleDocument(ackVehicleId, ackId);
      } else {
        await OwnerAlertsService.acknowledgeAlert(ackId);
      }
      setResolvedKeys((prev) => new Set(prev).add(resolveKey(ackType, ackId)));
      onResolved?.(ackType);
    } catch {
      // The service call already logs the failure; leave the row visible.
    } finally {
      setAckingId(null);
    }
  };

  const tabs = [
    { k: 'all', l: 'All', n: visibleActions.length },
    {
      k: 'high',
      l: 'High',
      n: visibleActions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH').length,
    },
    { k: 'medium', l: 'Medium', n: visibleActions.filter((a) => a.sev === 'MEDIUM').length },
  ];
  const rows =
    filter === 'all'
      ? visibleActions
      : filter === 'high'
        ? visibleActions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH')
        : visibleActions.filter((a) => a.sev === 'MEDIUM');

  return (
    <div className="nd-card" id="nd-card-attn">
      <div className="nd-card-head">
        <h2>Needs your attention</h2>
        <span className="nd-count-pill">{rows.length}</span>
        <span className="nd-sp" />
        <div className="nd-ios-tabs" role="tablist" aria-label="Filter attention items">
          {tabs.map((t) => {
            const isSelected = filter === t.k;
            return (
              <button
                key={t.k}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`nd-ios-tab ${isSelected ? 'nd-ios-tab--active' : ''}`}
                onClick={() => setFilter(t.k)}
              >
                {isSelected && (
                  <Motion.span
                    layoutId="ndAttnTabIndicator"
                    className="nd-ios-tab-indicator"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <span className="nd-ios-tab-text">{t.l}</span>
                <span
                  className={`nd-ios-tab-badge ${
                    t.k === 'high' && t.n > 0
                      ? 'nd-ios-tab-badge--high'
                      : isSelected
                        ? 'nd-ios-tab-badge--active'
                        : ''
                  }`}
                >
                  {t.n}
                </span>
              </button>
            );
          })}
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
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.ackId ? (
                      <button
                        type="button"
                        className="nd-btn nd-btn--sm"
                        disabled={ackingId === a.ackId}
                        onClick={() => handleResolve(a)}
                      >
                        {ackingId === a.ackId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Resolve
                      </button>
                    ) : null}
                    <Link to={a.to} className="nd-btn nd-btn--sm">
                      {a.cta || 'Review'}
                    </Link>
                  </div>
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

export function NdImpactCard({ money, utilization }) {
  const rows = [
    {
      key: 'idling',
      label: 'Idling cost',
      v: money?.idlingWasteInr || 0,
      c: '#C56200',
      tint: 'rgba(197, 98, 0, 0.12)',
      icon: Clock,
    },
    {
      key: 'detour',
      label: 'Detour cost',
      v: money?.detourWasteInr || 0,
      c: '#2F58EE',
      tint: 'rgba(47, 88, 238, 0.12)',
      icon: RouteIcon,
    },
    {
      key: 'siphon',
      label: 'Fuel siphon loss',
      v: money?.theftLossInr || 0,
      c: '#C2323A',
      tint: 'rgba(194, 50, 58, 0.12)',
      icon: FuelIcon,
    },
    {
      key: 'mismatch',
      label: 'Bill mismatch',
      v: money?.billFraudSuspectInr || 0,
      c: '#6A43D8',
      tint: 'rgba(106, 67, 216, 0.12)',
      icon: FileWarning,
    },
    {
      key: 'empty',
      label: 'Empty-running waste',
      v: utilization?.fleet?.emptyKmWasteInr || 0,
      c: '#0D9488',
      tint: 'rgba(13, 148, 136, 0.12)',
      icon: Gauge,
    },
  ];
  const total = rows.reduce((s, r) => s + r.v, 0);
  const activeCount = rows.filter((r) => r.v > 0).length;

  return (
    <div className="nd-card" id="nd-impact">
      <div className="nd-card-head">
        <h2>Today&apos;s ₹ impact</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Estimated</span>
      </div>

      <div className="nd-impact-total">
        <div className="nd-impact-hero-top">
          <span className="nd-impact-tag">
            <TrendingDown size={13} />
            <span>Total loss today</span>
          </span>
          <span className="nd-impact-count-badge">
            {activeCount > 0 ? `${activeCount} active categories` : 'All nominal'}
          </span>
        </div>
        <div className="nd-v">{formatINR(total)}</div>
        <div className="nd-n">Across 5 telemetry &amp; fuel audit channels today</div>
      </div>

      <div className="nd-impact-list">
        {rows.map((r) => {
          const Icon = r.icon;
          const pct = total > 0 && r.v > 0 ? Math.round((r.v / total) * 100) : 0;
          return (
            <div key={r.key} className="nd-impact-item" style={{ '--c': r.c, '--tint': r.tint }}>
              <div className="nd-impact-item-header">
                <div className="nd-impact-item-meta">
                  <span className="nd-impact-ico">
                    <Icon size={13} />
                  </span>
                  <span className="nd-impact-item-name">{r.label}</span>
                  {pct > 0 && <span className="nd-impact-pct-pill">{pct}%</span>}
                </div>
                <span className={`nd-impact-item-amount ${r.v === 0 ? 'nd-zero' : ''}`}>
                  {formatINR(r.v)}
                </span>
              </div>
              <div className="nd-impact-bar-track">
                <span className="nd-impact-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="nd-impact-footer">
        <Info size={12} className="nd-impact-footer-ico" />
        <span>
          {money?.disclaimer ||
            'Calculated from live FleetEdge telemetry & configured fuel pricing.'}
        </span>
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
  const rangeLabel = `${formatDateIST(today)} – ${formatDateIST(rangeEnd)}`;

  // Summary counts for badges and legend
  const totalEvents = veh.reduce((acc, v) => acc + (v.events?.length || 0), 0);
  const tripCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'trip')?.length || 0),
    0,
  );
  const serviceCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'service')?.length || 0),
    0,
  );
  const docCount = veh.reduce(
    (acc, v) => acc + (v.events?.filter((e) => e.type === 'doc')?.length || 0),
    0,
  );

  return (
    <section className="nd-card" id="nd-calendar">
      <div className="nd-card-head nd-cal-head">
        <div className="nd-cal-title-block">
          <div className="nd-cal-title-row">
            <span className="nd-cal-title-ico">
              <CalendarIcon size={16} />
            </span>
            <h2>Fleet calendar</h2>
            <span className="nd-cal-count-pill">{veh.length} vehicles</span>
            <span className="nd-cal-count-pill nd-cal-count-pill--events">
              {totalEvents} events
            </span>
          </div>
          <span className="nd-cal-range-pill">
            <Clock size={12} />
            {rangeLabel} · planned trips
          </span>
        </div>
        <span className="nd-sp" />
        <div className="nd-ios-tabs" role="tablist" aria-label="Fleet calendar view mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gantt'}
            className={`nd-ios-tab ${view === 'gantt' ? 'nd-ios-tab--active' : ''}`}
            onClick={() => setView('gantt')}
          >
            {view === 'gantt' && (
              <Motion.span
                layoutId="ndCalViewIndicator"
                className="nd-ios-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="nd-ios-tab-text">{days} days</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'month'}
            className={`nd-ios-tab ${view === 'month' ? 'nd-ios-tab--active' : ''}`}
            onClick={() => setView('month')}
          >
            {view === 'month' && (
              <Motion.span
                layoutId="ndCalViewIndicator"
                className="nd-ios-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="nd-ios-tab-text">Month</span>
          </button>
        </div>
      </div>

      <div className="nd-legend nd-cal-legend">
        <span className="nd-legend-chip">
          <i style={{ background: '#3b82f6' }} />
          <span>Planned trip</span>
          {tripCount > 0 && <b>{tripCount}</b>}
        </span>
        <span className="nd-legend-chip">
          <i style={{ background: '#f59e0b' }} />
          <span>Service due/overdue</span>
          {serviceCount > 0 && <b>{serviceCount}</b>}
        </span>
        <span className="nd-legend-chip">
          <i style={{ background: '#ef4444' }} />
          <span>Document expiry</span>
          {docCount > 0 && <b>{docCount}</b>}
        </span>
        <span className="nd-legend-chip nd-legend-chip--muted">
          <i
            style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)' }}
          />
          <span>Weekend</span>
        </span>
        <span className="nd-legend-hint">Click any vehicle or event for full detail</span>
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

// Packs vehicle events into non-overlapping vertical lanes so overlapping
// events (e.g. planned trip + service due on the same day) never clash.
function packEventLanes(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.len - a.len);
  const laneEndTimes = [];

  const packed = sorted.map((e) => {
    let lane = -1;
    for (let i = 0; i < laneEndTimes.length; i++) {
      if (laneEndTimes[i] <= e.start) {
        lane = i;
        laneEndTimes[i] = e.start + e.len;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(e.start + e.len);
    }
    return { ...e, lane };
  });

  return {
    events: packed,
    totalLanes: Math.max(1, laneEndTimes.length),
  };
}

function NdGantt({ vehicles, days, onOpenVehicle, selectedVehicleId }) {
  const heads = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const we = [0, 6].includes(d.getDay());
    const isToday = i === 0;
    return (
      <div key={i} className={`nd-gcell ${isToday ? 'nd-today' : ''} ${we ? 'nd-we' : ''}`.trim()}>
        <div className="nd-d">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
        <div className="nd-n-badge">
          <span>{d.getDate()}</span>
          {isToday && <span className="nd-today-dot" title="Current Day" />}
        </div>
      </div>
    );
  });
  const nowPct = (new Date().getHours() * 60 + new Date().getMinutes()) / 1440;

  return (
    <div className="nd-gantt">
      <div className="nd-grow" style={{ '--days': days }}>
        <div className="nd-ghead nd-gsticky">
          <span className="nd-vcol-title">
            <Truck size={13} />
            <span>VEHICLE</span>
            <span className="nd-vcol-badge">{vehicles.length}</span>
          </span>
        </div>
        <div
          className="nd-ghead"
          style={{
            gridColumn: '2 / -1',
            display: 'grid',
            gridTemplateColumns: `repeat(${days}, minmax(64px, 1fr))`,
          }}
        >
          {heads}
        </div>
        {vehicles.map((v) => {
          const rawEvents = (v.events || []).filter((e) => e.start + e.len > 0 && e.start < days);
          const { events: packedEvents, totalLanes } = packEventLanes(rawEvents);
          const laneHeight = 26;
          const laneGap = 8;
          const lanePitch = laneHeight + laneGap; // 34px
          const rowPad = 14;
          const rowHeight = totalLanes === 1 ? 64 : rowPad * 2 + totalLanes * lanePitch - laneGap;

          const bars = packedEvents.map((e, i) => {
            const s = Math.max(0, e.start);
            const end = Math.min(days, e.start + e.len);
            const span = Math.max(1, end - s);
            const isOngoing = e.state === 'ONGOING';
            // An event that covers today or future is not past/done
            const isDone = e.type === 'trip' && e.start + e.len < 0;
            const EvIcon = EVT_ICON[e.type] || RouteIcon;

            // Intelligent label that always renders cleanly without overflow
            let labelText = e.label || '';
            if (span >= 3) {
              labelText = `${e.label}${e.tons ? ` · ${e.tons}t` : ''}`;
            } else if (span === 2) {
              labelText = e.label;
            } else if (span === 1) {
              if (e.type === 'service') labelText = e.overdue ? 'Overdue' : 'Service';
              else if (e.type === 'doc') labelText = 'Doc Due';
              else if (isOngoing) labelText = 'Trip';
              else labelText = e.label?.split('→')[0]?.trim() || 'Trip';
            }

            const lane = e.lane || 0;
            const topOffset = totalLanes === 1 ? 18 : rowPad + lane * lanePitch;
            const barHeight = totalLanes === 1 ? 28 : laneHeight;

            return (
              <button
                key={i}
                type="button"
                className={`nd-ev nd-ev--${e.type} ${isDone ? 'nd-ev--done' : ''} ${span === 1 ? 'nd-ev--compact' : ''}`.trim()}
                style={{
                  left: `calc(${s} * (100% / ${days}) + 4px)`,
                  width: `calc(${span} * (100% / ${days}) - 8px)`,
                  minWidth: '38px',
                  top: `${topOffset}px`,
                  height: `${barHeight}px`,
                }}
                title={`${v.registrationNumber}: ${e.label}${e.tons ? ` · ${e.tons}t` : ''} (${e.len} day${e.len > 1 ? 's' : ''})`}
                onClick={() => onOpenVehicle(v.vehicleId)}
              >
                <span className="nd-ev-ico">
                  <EvIcon size={totalLanes === 1 ? 12 : 11} />
                </span>
                <span className="nd-ev-label">{labelText}</span>
                {e.tons && span >= 3 && <span className="nd-ev-tons">{e.tons}t</span>}
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
                className="nd-gsticky nd-vcard"
                style={{ minHeight: `${rowHeight}px` }}
                onClick={() => onOpenVehicle(v.vehicleId)}
                title={`View ${v.registrationNumber} details`}
              >
                <div className="nd-vcard-ico">
                  <Truck size={13} />
                </div>
                <div className="nd-vcard-info">
                  <div className="nd-vcard-plate">{v.registrationNumber}</div>
                  <div className="nd-vcard-model">{v.model || 'Commercial'}</div>
                </div>
              </button>
              <div className="nd-gtrackrow" style={{ height: `${rowHeight}px` }}>
                {cells}
                {bars}
              </div>
            </div>
          );
        })}
        <div
          className="nd-nowline"
          style={{ left: `calc(220px + (100% - 220px) / ${days} * ${nowPct.toFixed(3)})` }}
        >
          <span className="nd-nowline-tag">NOW</span>
          <span className="nd-nowline-beam" />
        </div>
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
    const isToday = dkey(d) === dkey(today);
    const evs = [];
    vehicles.forEach((v) =>
      (v.events || []).forEach((e) => {
        const ed = new Date(today);
        ed.setDate(ed.getDate() + e.start);
        if (dkey(ed) === dkey(d)) evs.push({ v, e });
      }),
    );
    return (
      <button
        key={i}
        type="button"
        className={`nd-mday ${off ? 'nd-out' : ''} ${isToday ? 'nd-today' : ''}`.trim()}
        onClick={() => evs[0] && onOpenVehicle(evs[0].v.vehicleId)}
      >
        <div className="nd-mday-top">
          <span className={`nd-dnum ${isToday ? 'nd-dnum--today' : ''}`}>{d.getDate()}</span>
          {evs.length > 0 && <span className="nd-mday-count">{evs.length}</span>}
        </div>
        <div className="nd-mday-chips">
          {evs.slice(0, 3).map((x, i2) => {
            const EvIcon = EVT_ICON[x.e.type] || RouteIcon;
            return (
              <span
                key={i2}
                className={`nd-mchip nd-mchip--${x.e.type}`}
                title={`${x.v.registrationNumber} — ${x.e.label}`}
              >
                <EvIcon size={10} className="nd-mchip-ico" />
                <span className="nd-mchip-reg">{x.v.registrationNumber.slice(-4)}</span>
                <span className="nd-mchip-lbl">{x.e.label}</span>
              </span>
            );
          })}
          {evs.length > 3 ? <span className="nd-mmore">+{evs.length - 3} more</span> : null}
        </div>
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
                <tr
                  key={`${f.vehicleId}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenVehicle(f.vehicleId)}
                  onKeyDown={onRowKeyDown(() => onOpenVehicle(f.vehicleId))}
                >
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
              <tr
                key={r.registrationNumber}
                role="button"
                tabIndex={0}
                onClick={() => onOpenVehicle(r.registrationNumber)}
                onKeyDown={onRowKeyDown(() => onOpenVehicle(r.registrationNumber))}
              >
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

const UPCOMING_BUCKETS = [
  { key: 'today', l: 'Today', s: 0, e: 0, range: 'Due today' },
  { key: 'tomorrow', l: 'Tomorrow', s: 1, e: 1, range: 'Due tomorrow' },
  { key: 'this-week', l: 'This week', s: 2, e: 7, range: 'In 2–7 days' },
  { key: 'next-week', l: 'Next week', s: 8, e: 14, range: 'In 8–14 days' },
];

export function NdUpcomingCard({ upcoming, onOpenVehicle }) {
  const activeBuckets = useMemo(() => {
    return UPCOMING_BUCKETS.map((b) => ({
      ...b,
      rows: (upcoming || []).filter((u) => u.days >= b.s && u.days <= b.e),
    })).filter((b) => b.rows.length > 0);
  }, [upcoming]);

  const serviceCount = (upcoming || []).filter((u) => u.kind === 'Service').length;
  const docCount = (upcoming || []).filter((u) => u.kind !== 'Service').length;

  return (
    <div className="nd-card" id="nd-upcoming-card">
      <div className="nd-card-head nd-up-head">
        <div className="nd-up-title-block">
          <div className="nd-up-title-row">
            <span className="nd-up-title-ico">
              <CalendarIcon size={16} />
            </span>
            <h2>Upcoming</h2>
            <span className="nd-count-pill">{upcoming.length}</span>
            {serviceCount > 0 && (
              <span className="nd-up-metric-pill nd-up-metric-pill--service">
                <Wrench size={11} />
                <span>{serviceCount} service</span>
              </span>
            )}
            {docCount > 0 && (
              <span className="nd-up-metric-pill nd-up-metric-pill--doc">
                <FileWarning size={11} />
                <span>{docCount} documents</span>
              </span>
            )}
          </div>
          <span className="nd-hint">
            Next 14 days · scheduled maintenance &amp; document expiries
          </span>
        </div>
        <span className="nd-sp" />
        <span className="nd-up-range-pill">
          <Clock size={12} />
          <span>Next 14 days</span>
        </span>
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
        <div
          className={`nd-upgrid ${activeBuckets.length === 1 ? 'nd-upgrid--single' : ''}`}
          style={{ '--up-cols': activeBuckets.length }}
        >
          {activeBuckets.map((b) => (
            <div key={b.key} className="nd-daygroup">
              <div className="nd-dghead">
                <div className="nd-dghead-left">
                  <span className="nd-dg-dot" />
                  <span className="nd-t">{b.l}</span>
                  <span className="nd-dg-count">
                    {b.rows.length} item{b.rows.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="nd-dg-range">{b.range}</span>
              </div>
              <div className="nd-daygroup-list">
                {b.rows.map((u) => {
                  const isService = u.kind === 'Service';
                  const Icon = isService ? Wrench : u.icon || FileText;
                  let riskLabel = null;
                  let riskClass = 'upcoming';
                  if (u.risk === 'DUE_SOON') {
                    riskLabel = 'Due soon';
                    riskClass = 'due-soon';
                  } else if (u.risk === 'OVERDUE') {
                    riskLabel = 'Overdue';
                    riskClass = 'overdue';
                  } else if (u.risk) {
                    riskLabel = u.risk.toLowerCase().replace(/_/g, ' ');
                    riskClass = u.risk.toLowerCase().replace(/_/g, '-');
                  } else if (!isService && u.days <= 7) {
                    riskLabel = 'Expiring';
                    riskClass = 'due-soon';
                  }

                  const when =
                    u.days === 0
                      ? 'Today'
                      : u.days === 1
                        ? 'Tomorrow'
                        : formatDateIST(new Date(Date.now() + u.days * DAY_MS).toISOString());

                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="nd-upcard"
                      onClick={() => onOpenVehicle(u.registrationNumber)}
                      title={`View ${u.registrationNumber} details`}
                    >
                      <div className="nd-upcard-top">
                        <div className="nd-upcard-veh">
                          <span
                            className={`nd-upcard-ico nd-upcard-ico--${isService ? 'service' : 'doc'}`}
                          >
                            <Icon size={13} />
                          </span>
                          <span className="nd-upcard-plate">{u.registrationNumber}</span>
                          <span className="nd-upcard-kind">{u.kind}</span>
                        </div>
                        {riskLabel && (
                          <div className="nd-upcard-badges">
                            <span className={`nd-upcard-risk nd-upcard-risk--${riskClass}`}>
                              <i className="nd-upcard-risk-dot" />
                              {riskLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="nd-upcard-bot">
                        <div className="nd-upcard-metric">
                          {u.kmUntilDue != null ? (
                            <>
                              <span className="nd-upcard-metric-val">{formatKm(u.kmUntilDue)}</span>
                              <span className="nd-upcard-metric-lbl">remaining</span>
                            </>
                          ) : u.projectedServiceDueOdometer != null ? (
                            <>
                              <span className="nd-upcard-metric-lbl">due at</span>
                              <span className="nd-upcard-metric-val">
                                {formatKm(u.projectedServiceDueOdometer)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="nd-upcard-metric-lbl">expires in</span>
                              <span className="nd-upcard-metric-val">
                                {u.days} day{u.days === 1 ? '' : 's'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="nd-upcard-date">
                          <Clock size={11} />
                          <span>{when}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
        {money?.idlingWasteInr ? (
          <div className="nd-big">
            <span className="nd-v" style={{ color: '#C56200' }}>
              {formatINR(money.idlingWasteInr)}
            </span>
            <span className="nd-u">
              {idleMinutesTotal} min outside known loading and customer zones
            </span>
          </div>
        ) : (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>No idling waste today</b>
            <span>Vehicles idling over 30 min outside known zones appear here.</span>
          </div>
        )}
      </div>
      <div className="nd-card nd-opcard" style={{ '--c': '#2F58EE' }}>
        <div className="nd-card-head">
          <h2>Detour waste</h2>
          <span className="nd-sp" />
        </div>
        {money?.detourWasteInr ? (
          <div className="nd-big">
            <span className="nd-v" style={{ color: '#2F58EE' }}>
              {formatINR(money.detourWasteInr)}
            </span>
            <span className="nd-u">{detourKmTotal.toFixed(0)} km driven off the planned route</span>
          </div>
        ) : (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>No detour waste today</b>
            <span>Vehicles driving off the planned route appear here.</span>
          </div>
        )}
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

/* ============================ Driver leaderboard =========================== */

export function NdLeaderboardCard({ leaderboard }) {
  const drivers = leaderboard?.drivers || [];
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Driver fuel efficiency</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Last computed window · km/L</span>
      </div>
      <Leaderboard
        title="Driver fuel efficiency (km/L)"
        unit="number"
        metricKey="kmPerL"
        rows={drivers}
        rowLabel={(r) => r.driverName || 'Unknown driver'}
        rowSub={(r) => `${formatKm(r.distanceKm)} · ${formatLitres(r.fuelUsedL)}`}
      />
    </div>
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
                <span className="nd-eyebrow">Live status</span>
                {vehicle.profileLoading ? (
                  <div className="nd-vd-line">
                    <span className="nd-when">Loading…</span>
                  </div>
                ) : vehicle.profile?.health ? (
                  <div className="nd-vd-grid">
                    <div className="nd-vd-stat">
                      <div className="nd-k">Fuel</div>
                      <div className="nd-v">
                        {vehicle.profile.health.primaryFuelLevel != null
                          ? `${vehicle.profile.health.primaryFuelLevel}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">DEF</div>
                      <div className="nd-v">
                        {vehicle.profile.health.defLevel != null
                          ? `${vehicle.profile.health.defLevel}%`
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">Odometer</div>
                      <div className="nd-v">
                        {vehicle.profile.health.canOdo != null
                          ? formatKm(vehicle.profile.health.canOdo)
                          : '—'}
                      </div>
                    </div>
                    <div className="nd-vd-stat">
                      <div className="nd-k">Engine hrs</div>
                      <div className="nd-v">
                        {vehicle.profile.health.engineRunHour != null
                          ? formatNum(vehicle.profile.health.engineRunHour)
                          : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="nd-vd-line">
                    <span className="nd-when">No live telemetry available.</span>
                  </div>
                )}
                {vehicle.profile?.assignedDriver ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span className="nd-evdot" style={{ background: 'var(--nova-rage-400)' }} />
                    <span>
                      {vehicle.profile.assignedDriver.name || 'Driver assigned'}
                      {vehicle.profile.assignedDriver.group
                        ? ` · ${vehicle.profile.assignedDriver.group}`
                        : ''}
                    </span>
                  </div>
                ) : vehicle.profile ? (
                  <div className="nd-vd-line" style={{ marginTop: 10 }}>
                    <span className="nd-when">No driver assigned.</span>
                  </div>
                ) : null}
                {vehicle.profile?.prediction ? (
                  <div className="nd-vd-line" style={{ marginTop: 6 }}>
                    <span className="nd-evdot" style={{ background: EVT_COLOR.service }} />
                    <span>
                      Next service:{' '}
                      {vehicle.profile.prediction.risk
                        ? vehicle.profile.prediction.risk.toLowerCase().replace('_', ' ')
                        : '—'}
                      {vehicle.profile.prediction.daysUntilDue != null
                        ? ` · ${formatNum(vehicle.profile.prediction.daysUntilDue)} days`
                        : ''}
                      {vehicle.profile.prediction.kmUntilDue != null
                        ? ` · ${formatKm(vehicle.profile.prediction.kmUntilDue)} left`
                        : ''}
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
