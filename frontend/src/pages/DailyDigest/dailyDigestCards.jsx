import { Link } from 'react-router-dom';
import {
  Bell,
  Fuel,
  Wrench,
  FileWarning,
  Route as RouteIcon,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatINR, formatKm, formatLitres, formatNum } from '../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';
import { SEV } from './dailyDigestLogic';

/**
 * Presentational atoms for the Daily Digest. Kept separate from
 * dailyDigestLogic.js because that module exports plain functions;
 * react-refresh requires a file to export components OR non-components,
 * never both (rule 15).
 */

// .ov-panel/.ov-kpi already carry a 1px border, but --hairline is only ~10-12%
// opacity — too faint for a scan-heavy digest where an odd card in a grid
// needs to read as its own bounded block. Scoped to these cards only; the
// shared --hairline token stays untouched for the other 48 pages built on it.
const CARD_BORDER = '1px solid color-mix(in srgb, var(--cluster-text) 16%, transparent)';

export function SeverityPill({ sev }) {
  const s = SEV[sev] || SEV.MEDIUM;
  return <span className={`ov-pill ov-pill--${s.tone}`}>{sev}</span>;
}

export function SectionHeader({ label, count, countTone }) {
  return (
    <div className="ov-section mb-3">
      <span className="cluster-eyebrow">{label}</span>
      {count != null && (
        <span
          className="num text-xs font-semibold"
          style={{ color: countTone || 'var(--cluster-text-dim)' }}
        >
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}

export function KpiCard(props) {
  const { icon: Icon, label, value, sub, to, accent, emphasis } = props;
  const body = (
    <>
      <span className="ov-kpi-label">
        <Icon size={13} style={{ color: accent }} />
        {label}
      </span>
      <span className="ov-kpi-value" style={emphasis ? { color: accent } : undefined}>
        {value}
      </span>
      <span className="ov-kpi-sub">{sub}</span>
    </>
  );
  return to ? (
    <Link to={to} className="ov-kpi" style={{ border: CARD_BORDER }}>
      {body}
    </Link>
  ) : (
    <div className="ov-kpi" style={{ border: CARD_BORDER }}>
      {body}
    </div>
  );
}

export function ActionCard({ item }) {
  const s = SEV[item.sev] || SEV.MEDIUM;
  const Icon = item.icon || Bell;
  return (
    <div
      className="ov-panel p-4"
      style={{ border: CARD_BORDER, borderLeft: `3px solid ${s.color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
              color: s.color,
            }}
          >
            <Icon size={16} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: s.color }}>
            {item.title}
          </span>
        </div>
        <SeverityPill sev={item.sev} />
      </div>
      <p className="mt-2.5 text-sm leading-snug" style={{ color: 'var(--cluster-text)' }}>
        {item.desc}
      </p>
      {item.meta && <p className="text-dim mt-1 text-xs">{item.meta}</p>}
      <div className="mt-3 flex justify-end">
        <Link to={item.to} className="ov-btn ov-btn--primary">
          {item.cta || 'Review'} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function ActivityCard({ item }) {
  const Icon = item.icon || Fuel;
  return (
    <Link
      to={item.to}
      className="ov-panel group flex items-center gap-4 p-4"
      style={{ border: CARD_BORDER }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--gnb-400) 10%, transparent)',
          color: 'var(--gnb-400)',
        }}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-dim text-[11px] font-semibold uppercase tracking-wide">
          {item.label}
        </div>
        <div
          className="num text-2xl font-bold leading-tight"
          style={{ color: 'var(--cluster-text)' }}
        >
          {item.value}
        </div>
        {item.sub && <div className="text-dim text-xs">{item.sub}</div>}
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
        style={{ color: 'var(--gnb-400)' }}
      >
        View details{' '}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function UpcomingRow({ item }) {
  const Icon = item.icon || Wrench;
  return (
    <Link
      to={item.to}
      className="ov-panel group flex items-center gap-3 px-4 py-3"
      style={{ border: CARD_BORDER }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'var(--cluster-raised)',
          color: item.tone || 'var(--cluster-text-dim)',
        }}
      >
        <Icon size={15} />
      </span>
      <span
        className="flex flex-1 items-center justify-between gap-3 text-sm"
        style={{ color: 'var(--cluster-text)' }}
      >
        <span className="font-semibold">{item.registrationNumber}</span>
        <span className="text-dim">{item.kind}</span>
      </span>
      <ChevronRight
        size={15}
        className="text-dim transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

// Groups Upcoming rows under a "Due in N days" header so the day count is
// stated once per bucket instead of repeated in every row's sentence.
export function UpcomingDayGroup({ days, items }) {
  const label = days <= 0 ? 'Due today' : days === 1 ? 'Due in 1 day' : `Due in ${days} days`;
  return (
    <div>
      <div className="text-dim mb-2 text-[11px] font-semibold uppercase tracking-wide">{label}</div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <UpcomingRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// Single-select severity filter for "Needs your attention" — All / High / Medium,
// each with a count. Unlike FilterBar's multi-select chips, exactly one is active.
export function SeverityTabs({ actions, active, onChange }) {
  const tabs = [
    { key: 'ALL', label: 'All', n: actions.length },
    {
      key: 'HIGH',
      label: 'High',
      n: actions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH').length,
    },
    { key: 'MEDIUM', label: 'Medium', n: actions.filter((a) => a.sev === 'MEDIUM').length },
  ];
  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className="ov-tab"
          aria-pressed={active === t.key}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          <b>{t.n}</b>
        </button>
      ))}
    </div>
  );
}

// "Today's ₹ impact" bars — idling / detour / fuel siphon / bill mismatch, as
// a share of the combined total. Fallback for when the richer Daily Brief
// breakdown isn't available for this org (dark-launched feature).
export function ImpactBars({ money }) {
  const rows = [
    { key: 'idling', label: 'Idling cost', v: money?.idlingWasteInr || 0, c: 'var(--caution)' },
    { key: 'detour', label: 'Detour cost', v: money?.detourWasteInr || 0, c: 'var(--gnb-400)' },
    { key: 'siphon', label: 'Fuel siphon loss', v: money?.theftLossInr || 0, c: 'var(--critical)' },
    { key: 'mismatch', label: 'Bill mismatch', v: money?.billFraudSuspectInr || 0, c: '#6A43D8' },
  ];
  const total = rows.reduce((s, r) => s + r.v, 0);

  if (total === 0) {
    return (
      <SectionEmpty
        title="No waste recorded today"
        hint="Idling, detour, siphon and bill-mismatch figures appear here as telemetry arrives."
      />
    );
  }

  return (
    <div className="ov-panel p-4" style={{ border: CARD_BORDER }}>
      <div className="mb-1 text-2xl font-bold" style={{ color: 'var(--critical)' }}>
        {formatINR(total)}
      </div>
      <div className="text-dim mb-4 text-xs">Total estimated waste today</div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span style={{ color: 'var(--cluster-text)' }}>{r.label}</span>
              <span className="num font-semibold">{formatINR(r.v)}</span>
            </div>
            <div
              className="h-1.5 rounded-full"
              style={{ background: 'var(--cluster-raised)', overflow: 'hidden' }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${total ? (r.v / total) * 100 : 0}%`, background: r.c }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fleet average km/L plus the worst 4 vehicles over the window, each bar
// scaled against the best-performing of the four. Sourced from completed
// full-tank-to-full-tank mileage intervals, which close days apart — not a
// same-day figure, so the window defaults to a week, not "today".
export function FuelEfficiencyPanel({ data }) {
  const worst = data?.worst || [];
  if (worst.length === 0) {
    return (
      <SectionEmpty
        icon={Fuel}
        title="No fuel efficiency data yet"
        hint="Actual km/L appears here once a full-tank-to-full-tank refuel cycle completes."
      />
    );
  }
  const best = Math.max(...worst.map((v) => v.kmpl));
  return (
    <div className="ov-panel p-4" style={{ border: CARD_BORDER }}>
      <div className="flex items-baseline gap-1.5">
        <span className="num text-2xl font-bold" style={{ color: 'var(--cluster-text)' }}>
          {data.fleetKmpl ?? '—'}
        </span>
        <span className="text-dim text-xs">km/L fleet average this week</span>
      </div>
      <div className="text-dim mb-3 mt-0.5 text-[11px] uppercase tracking-wide">
        Worst {worst.length} of {data.vehicleCount}
      </div>
      <div className="flex flex-col gap-2.5">
        {worst.map((v) => (
          <Link
            key={v.vehicleId}
            to={`/vehicles/${encodeURIComponent(v.registrationNumber)}`}
            className="block"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="reg-plate">{v.registrationNumber}</span>
              <span className="num font-semibold">{v.kmpl} km/L</span>
            </div>
            <div
              className="h-1.5 rounded-full"
              style={{ background: 'var(--cluster-raised)', overflow: 'hidden' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${best ? (v.kmpl / best) * 100 : 0}%`,
                  background:
                    data.fleetKmpl && v.kmpl < data.fleetKmpl * 0.85
                      ? 'var(--critical)'
                      : 'var(--caution)',
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Today's fuel fills — litres, amount, station/time, and tank-verification
// status — plus a low-tank-before-trip callout band.
export function RefuelPanel({ data }) {
  const fills = data?.fills || [];
  return (
    <div className="ov-panel p-4" style={{ border: CARD_BORDER }}>
      {fills.length === 0 ? (
        <SectionEmpty
          icon={Fuel}
          title="No fills recorded today"
          hint="Refuel logs appear here as drivers capture them."
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-4 text-xs">
            <span>
              <b className="num">{formatLitres(data.litresFilled)}</b>{' '}
              <span className="text-dim">filled</span>
            </span>
            <span>
              <b className="num">{formatINR(data.spendInr)}</b>{' '}
              <span className="text-dim">spend</span>
            </span>
            <span>
              <b className="num">
                {data.verifiedCount}/{data.totalCount}
              </b>{' '}
              <span className="text-dim">tank-verified</span>
            </span>
          </div>
          <div className="fi-table-scroll">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th className="text-right">Litres</th>
                  <th className="text-right">Amount</th>
                  <th>Check</th>
                </tr>
              </thead>
              <tbody>
                {fills.map((f, i) => (
                  <tr key={`${f.vehicleId}-${i}`}>
                    <td>
                      <Link
                        to={`/vehicles/${encodeURIComponent(f.registrationNumber)}`}
                        className="reg-plate"
                      >
                        {f.registrationNumber}
                      </Link>
                      <div className="text-dim text-[11px]">
                        {[f.station, f.refuelTime ? formatDateTimeIST(f.refuelTime) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </td>
                    <td className="num text-right">{formatLitres(f.litres)}</td>
                    <td className="num text-right">{formatINR(f.amountInr)}</td>
                    <td>
                      {f.tankVerified === false ? (
                        <StatusPillInline tone="critical">
                          {f.billVarianceL != null ? `${formatNum(f.billVarianceL)} L` : 'Mismatch'}
                        </StatusPillInline>
                      ) : f.tankVerified === true ? (
                        <StatusPillInline tone="ok">Verified</StatusPillInline>
                      ) : (
                        <StatusPillInline tone="inert">Unmatched</StatusPillInline>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data?.lowTankBeforeTrip?.length ? (
        <div
          className="mt-3 flex items-center gap-2.5 rounded-xl p-3 text-xs"
          style={{ background: 'var(--cluster-raised)' }}
        >
          <Fuel size={16} style={{ color: 'var(--caution)' }} />
          <span>
            <b className="num">{data.lowTankBeforeTrip.length}</b> vehicle
            {data.lowTankBeforeTrip.length === 1 ? '' : 's'} start a trip within 24h under{' '}
            {formatLitres(data.lowFuelThresholdL)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function StatusPillInline({ tone, children }) {
  const TONE = {
    critical: { bg: 'color-mix(in srgb, var(--critical) 14%, transparent)', c: 'var(--critical)' },
    ok: { bg: 'color-mix(in srgb, var(--ok) 14%, transparent)', c: 'var(--ok)' },
    inert: { bg: 'var(--cluster-raised)', c: 'var(--cluster-text-dim)' },
  };
  const t = TONE[tone] || TONE.inert;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: t.bg, color: t.c }}
    >
      {children}
    </span>
  );
}

// Idling + detour waste, per vehicle — union of the two top-5 lists (a
// vehicle on both shows both figures in one row instead of two).
export function WasteTable({ idlingTop5, detourTop5 }) {
  const byVehicle = new Map();
  (idlingTop5 || []).forEach((r) =>
    byVehicle.set(r.registrationNumber, {
      registrationNumber: r.registrationNumber,
      idleMinutes: r.idleMinutes,
      idleCostInr: r.idleCostInr,
      detourKm: 0,
      detourCostInr: 0,
    }),
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

  if (rows.length === 0) {
    return (
      <SectionEmpty
        icon={RouteIcon}
        title="No idling or detour waste today"
        hint="Vehicles idling over 30 min or driving off-route appear here."
      />
    );
  }

  return (
    <div className="ov-panel p-4" style={{ border: CARD_BORDER }}>
      <div className="fi-table-scroll">
        <table className="ov-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th className="text-right">Idling</th>
              <th className="text-right">Detour</th>
              <th className="text-right">Cost today</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registrationNumber}>
                <td>
                  <Link
                    to={`/vehicles/${encodeURIComponent(r.registrationNumber)}`}
                    className="reg-plate"
                  >
                    {r.registrationNumber}
                  </Link>
                </td>
                <td className="num text-right text-dim">
                  {r.idleMinutes ? `${formatNum(r.idleMinutes)} min` : '—'}
                </td>
                <td className="num text-right text-dim">
                  {r.detourKm ? `${formatKm(r.detourKm)}` : '—'}
                </td>
                <td className="num text-right font-semibold" style={{ color: 'var(--critical)' }}>
                  {formatINR(r.idleCostInr + r.detourCostInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CAL_ICON = { trip: RouteIcon, service: Wrench, doc: FileWarning };
const CAL_LABEL = { trip: 'Trip', service: 'Service', doc: 'Document' };

// One calendar item row — trip / service / document — inside a day group.
function CalendarItemRow({ item }) {
  const Icon = CAL_ICON[item.type] || Bell;
  const tone = item.overdue || item.expired ? 'var(--critical)' : 'var(--cluster-text-dim)';
  return (
    <Link
      to={`/vehicles/${encodeURIComponent(item.registrationNumber)}`}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-[var(--cluster-raised)]"
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{ background: 'var(--cluster-raised)', color: tone }}
      >
        <Icon size={12} />
      </span>
      <span className="reg-plate">{item.registrationNumber}</span>
      <span className="text-dim">{item.label}</span>
      {item.tons != null ? <span className="num text-dim ml-auto">{item.tons} t</span> : null}
    </Link>
  );
}

// Fleet calendar — an overdue band (past service/document events still open)
// plus the next N days, each showing that day's trips/service/doc events.
export function CalendarSection({ overdue, days }) {
  if ((overdue?.length || 0) === 0 && (days?.length || 0) === 0) {
    return (
      <SectionEmpty
        icon={RouteIcon}
        title="Nothing scheduled"
        hint="Trips, service and document due-dates appear here as they're planned."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {overdue?.length ? (
        <div
          className="ov-panel p-3"
          style={{
            border: '1px solid var(--critical)',
            background: 'color-mix(in srgb, var(--critical) 6%, transparent)',
          }}
        >
          <div
            className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--critical)' }}
          >
            <AlertTriangle size={13} /> Overdue
          </div>
          <div className="flex flex-col gap-0.5">
            {overdue.map((item, i) => (
              <CalendarItemRow key={`${item.vehicleId}-${item.type}-${i}`} item={item} />
            ))}
          </div>
        </div>
      ) : null}
      {(days || []).map((group) => (
        <div key={group.dateKey} className="ov-panel p-3" style={{ border: CARD_BORDER }}>
          <div className="text-dim mb-1.5 text-[11px] font-semibold uppercase tracking-wide">
            {formatDateIST(group.date)} · {group.items.length}{' '}
            {group.items.length === 1 ? 'event' : 'events'}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item, i) => (
              <CalendarItemRow key={`${item.vehicleId}-${item.type}-${i}`} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionEmpty(props) {
  const { icon: Icon = CheckCircle2, title, hint, className = '' } = props;
  return (
    <div
      className={`ov-panel flex items-center gap-3 p-4 ${className}`.trim()}
      style={{ border: CARD_BORDER }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: 'color-mix(in srgb, var(--ok) 12%, transparent)', color: 'var(--ok)' }}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
          {title}
        </div>
        {hint && <div className="text-dim text-xs">{hint}</div>}
      </div>
    </div>
  );
}
