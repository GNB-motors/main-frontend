import { Link } from 'react-router-dom';
import {
  ShieldAlert, FileWarning, Bell, Wrench, Fuel, ArrowRight, CalendarClock,
  RefreshCw, Timer, Route, CheckCircle2, ChevronRight,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatINR, formatInrCompact, formatNum, formatLitres } from '../../utils/formatters';
import { formatDateLongIST, formatDateIST } from '../../utils/dateUtils';

// Start of today in IST, as an ISO instant for backend windows.
const startOfTodayIST = () => {
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istNow.setHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - 5.5 * 3600 * 1000).toISOString();
};

// ── Severity model ────────────────────────────────────────────────────────────
const SEV = {
  CRITICAL: { rank: 3, tone: 'critical', color: 'var(--critical)' },
  HIGH: { rank: 2, tone: 'critical', color: 'var(--critical)' },
  MEDIUM: { rank: 1, tone: 'caution', color: 'var(--caution)' },
  LOW: { rank: 0, tone: 'inert', color: 'var(--inert)' },
};

// Owner-alert type → { severity, title, icon }
const ALERT_META = {
  FUEL_SIPHON_SUSPECTED: { sev: 'CRITICAL', title: 'Fuel loss suspected', icon: ShieldAlert },
  FLEETEDGE_ALERT_FUEL_DRAIN: { sev: 'CRITICAL', title: 'Fuel drain', icon: ShieldAlert },
  FLEETEDGE_SUBSCRIPTION_EXPIRED: { sev: 'HIGH', title: 'Plan expired', icon: ShieldAlert },
  FLEETEDGE_REAUTH_REQUIRED: { sev: 'HIGH', title: 'FleetEdge re-auth needed', icon: ShieldAlert },
  FLEETEDGE_SUBSCRIPTION_EXPIRING: { sev: 'MEDIUM', title: 'Plan expiring', icon: Bell },
  ADBLUE_BALANCE_FLAG: { sev: 'MEDIUM', title: 'AdBlue balance flag', icon: Bell },
  IDLING_BURN_HIGH: { sev: 'MEDIUM', title: 'High idling burn', icon: Fuel },
  EV_LOW_SOC: { sev: 'MEDIUM', title: 'EV low charge', icon: Bell },
  FLEETEDGE_ALERT_OVERSPEED: { sev: 'MEDIUM', title: 'Overspeed', icon: Bell },
};

const cleanMsg = (msg) => (msg || '').replace(/^Please review:\s*/i, '');

// ── UI atoms ──────────────────────────────────────────────────────────────────
function SeverityPill({ sev }) {
  const s = SEV[sev] || SEV.MEDIUM;
  return <span className={`ov-pill ov-pill--${s.tone}`}>{sev}</span>;
}

function SectionHeader({ label, count, countTone }) {
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

function KpiCard({ icon, label, value, sub, to, accent, emphasis }) {
  const Icon = icon;
  const body = (
    <>
      <span className="ov-kpi-label">
        <Icon size={13} style={{ color: accent }} />
        {label}
      </span>
      <span className="ov-kpi-value" style={emphasis ? { color: accent } : undefined}>{value}</span>
      <span className="ov-kpi-sub">{sub}</span>
    </>
  );
  return to ? <Link to={to} className="ov-kpi">{body}</Link> : <div className="ov-kpi">{body}</div>;
}

function ActionCard({ item }) {
  const s = SEV[item.sev] || SEV.MEDIUM;
  const Icon = item.icon || Bell;
  return (
    <div className="ov-panel p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}
          >
            <Icon size={16} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: s.color }}>
            {item.title}
          </span>
        </div>
        <SeverityPill sev={item.sev} />
      </div>
      <p className="mt-2.5 text-sm leading-snug" style={{ color: 'var(--cluster-text)' }}>{item.desc}</p>
      {item.meta && <p className="text-dim mt-1 text-xs">{item.meta}</p>}
      <div className="mt-3 flex justify-end">
        <Link to={item.to} className="ov-btn ov-btn--primary">
          {item.cta || 'Review'} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function ActivityCard({ item }) {
  const Icon = item.icon || Fuel;
  return (
    <Link to={item.to} className="ov-panel group flex items-center gap-4 p-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'color-mix(in srgb, var(--gnb-400) 10%, transparent)', color: 'var(--gnb-400)' }}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-dim text-[11px] font-semibold uppercase tracking-wide">{item.label}</div>
        <div className="num text-2xl font-bold leading-tight" style={{ color: 'var(--cluster-text)' }}>{item.value}</div>
        {item.sub && <div className="text-dim text-xs">{item.sub}</div>}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold" style={{ color: 'var(--gnb-400)' }}>
        View details <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function UpcomingRow({ item }) {
  const Icon = item.icon || Wrench;
  return (
    <Link to={item.to} className="ov-panel group flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--cluster-raised)', color: item.tone || 'var(--cluster-text-dim)' }}>
        <Icon size={15} />
      </span>
      <span className="flex-1 text-sm" style={{ color: 'var(--cluster-text)' }}>{item.text}</span>
      <ChevronRight size={15} className="text-dim transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SectionEmpty({ icon = CheckCircle2, title, hint }) {
  const Icon = icon;
  return (
    <div className="ov-panel flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--ok) 12%, transparent)', color: 'var(--ok)' }}>
        <Icon size={18} />
      </span>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>{title}</div>
        {hint && <div className="text-dim text-xs">{hint}</div>}
      </div>
    </div>
  );
}

/**
 * DailyDigest — "Here is the current state of my fleet, what needs my attention,
 * and what to do next." Composed entirely from existing endpoints; every item
 * links to its evidence. Priority: Action required → Overview → Activity → Upcoming.
 */
export default function DailyDigestPage() {
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const from = startOfTodayIST();

  const money$ = useApi((s) => OwnerValueService.getMoney({ from }, s), [from]);
  const compliance$ = useApi((s) => OwnerValueService.getComplianceRisk({ days: 15 }, s), []);
  const downtime$ = useApi((s) => OwnerValueService.getDowntimeRisk(s), []);
  const alerts$ = useApi((s) => OwnerAlertsService.getAlerts({ from, limit: 10 }, s), [from]);
  const fuel$ = useApi((s) => FuelIntegrityService.getSummary({ from }, s), [from]);
  const fleetAlerts$ = useApi((s) => FleetDataService.getFleetAlertSummary({ from }, s), [from]);

  const { data: money } = money$;
  const { data: compliance } = compliance$;
  const { data: downtime } = downtime$;
  const { data: alerts } = alerts$;
  const { data: fuelSummary } = fuel$;
  const { data: fleetAlertSummary } = fleetAlerts$;

  const loading = money$.loading || compliance$.loading || downtime$.loading || alerts$.loading || fuel$.loading;

  const handleRefresh = () => {
    [money$, compliance$, downtime$, alerts$, fuel$, fleetAlerts$].forEach((h) => h.refetch?.());
  };

  const m = money?.money;
  const totals = fuelSummary?.totals;
  const documents = compliance?.documents || [];
  const serviceVehicles = downtime?.vehicles || [];

  // ── ACTION REQUIRED ──────────────────────────────────────────────────────────
  const actions = [];

  // Unexplained fuel loss (tank mass-balance)
  if (totals?.siphonSuspectedLossL > 0) {
    actions.push({
      id: 'siphon', sev: 'CRITICAL', icon: ShieldAlert, title: 'Unexplained fuel loss',
      desc: `${formatLitres(totals.siphonSuspectedLossL)} left tanks without explanation today (${formatINR(totals.siphonSuspectedLossInr)}).`,
      to: '/fuel-integrity', cta: 'Investigate',
    });
  } else if (m?.theftLossInr > 0) {
    const top = money.topVehicles?.[0];
    actions.push({
      id: 'theft', sev: 'CRITICAL', icon: ShieldAlert, title: 'Unexplained fuel loss',
      desc: `≈ ${formatINR(m.theftLossInr)} unexplained fuel loss today${top ? ` — most on ${top.registrationNumber}` : ''}.`,
      to: '/fuel-integrity', cta: 'Investigate',
    });
  }
  if (m?.billFraudSuspectInr > 0) {
    actions.push({
      id: 'bill', sev: 'CRITICAL', icon: Fuel, title: 'Bill mismatch',
      desc: `${formatINR(m.billFraudSuspectInr)} of fuel bills don't match the tanks.`,
      to: '/fuel-integrity', cta: 'Review bills',
    });
  }

  // Owner alerts (unacknowledged)
  const unack = alerts?.records?.filter((a) => !a.acknowledged) || [];
  for (const a of unack.slice(0, 6)) {
    const meta = ALERT_META[a.type] || { sev: 'MEDIUM', title: ALERT_TYPE_LABELS[a.type] || a.type, icon: Bell };
    actions.push({
      id: `alert-${a.id}`, sev: meta.sev, icon: meta.icon, title: meta.title,
      desc: cleanMsg(a.message) || meta.title,
      meta: a.at ? `Detected ${formatDateIST(a.at)}` : null,
      to: a.vehicleNumber ? `/vehicles/${encodeURIComponent(a.vehicleNumber)}` : '/owner-alerts',
      cta: a.vehicleNumber ? 'Review vehicle' : 'Review alert',
    });
  }

  // Native FleetEdge critical alerts
  const nativeCount = fleetAlertSummary?.totalAlerts || 0;
  const worst = fleetAlertSummary?.byType?.find((t) => t.severity === 'critical');
  if (worst) {
    actions.push({
      id: 'native', sev: 'HIGH', icon: Bell, title: 'FleetEdge alerts',
      desc: `${formatNum(nativeCount)} native FleetEdge alert${nativeCount === 1 ? '' : 's'} today — including ${worst.count} ${worst.title.toLowerCase()}.`,
      to: '/fleet-alerts', cta: 'Review alerts',
    });
  }

  // Expired documents
  for (const d of documents.filter((x) => x.daysLeft < 0).slice(0, 4)) {
    actions.push({
      id: `doc-${d.registrationNumber}-${d.docType}`, sev: 'HIGH', icon: FileWarning, title: `${d.docType} expired`,
      desc: `${d.registrationNumber} — ${d.docType} expired ${formatNum(-d.daysLeft)} days ago.`,
      to: '/compliance', cta: 'Review document',
    });
  }

  // Overdue service
  for (const v of serviceVehicles.filter((x) => x.risk === 'OVERDUE').slice(0, 3)) {
    actions.push({
      id: `svc-${v.registrationNumber}`, sev: 'HIGH', icon: Wrench, title: 'Service overdue',
      desc: `${v.registrationNumber} is overdue for service by ${formatNum(Math.abs(v.daysUntilDue ?? 0))} days.`,
      to: `/vehicles/${encodeURIComponent(v.registrationNumber)}`, cta: 'Review vehicle',
    });
  }

  actions.sort((a, b) => (SEV[b.sev]?.rank || 0) - (SEV[a.sev]?.rank || 0));

  // ── TODAY'S ACTIVITY (normal money lines) ────────────────────────────────────
  const activity = [];
  if (m?.fuelCostInr > 0) activity.push({ id: 'fuel', icon: Fuel, label: 'Fuel spend', value: formatInrCompact(m.fuelCostInr), sub: 'Fuel spend today', to: '/fuel-spend' });
  if (m?.idlingWasteInr > 0) activity.push({ id: 'idle', icon: Timer, label: 'Idling waste', value: formatInrCompact(m.idlingWasteInr), sub: 'Burned by idling today', to: '/owner-alerts' });
  if (m?.detourWasteInr > 0) activity.push({ id: 'detour', icon: Route, label: 'Detour waste', value: formatInrCompact(m.detourWasteInr), sub: 'Cost of detours today', to: '/route-deviation' });

  // ── UPCOMING ─────────────────────────────────────────────────────────────────
  const upcoming = [];
  for (const v of serviceVehicles.filter((x) => x.risk !== 'OVERDUE').slice(0, 4)) {
    upcoming.push({ id: `up-svc-${v.registrationNumber}`, icon: Wrench, tone: 'var(--caution)', text: `${v.registrationNumber} is due for service in ${formatNum(v.daysUntilDue ?? 0)} days.`, to: `/vehicles/${encodeURIComponent(v.registrationNumber)}` });
  }
  for (const d of documents.filter((x) => x.daysLeft >= 0).slice(0, 4)) {
    upcoming.push({ id: `up-doc-${d.registrationNumber}-${d.docType}`, icon: FileWarning, tone: 'var(--caution)', text: `${d.registrationNumber} — ${d.docType} expires in ${formatNum(d.daysLeft)} days.`, to: '/compliance' });
  }

  // ── OVERVIEW KPIs ────────────────────────────────────────────────────────────
  const nextSvc = serviceVehicles
    .map((v) => v.daysUntilDue)
    .filter((n) => n != null)
    .sort((a, b) => a - b)[0];
  const nextSvcLabel = nextSvc == null ? '—' : nextSvc < 0 ? 'Overdue' : `${formatNum(nextSvc)} days`;

  return (
    <div className="page-white">
    <div className="mx-auto space-y-8" style={{ maxWidth: 1160 }}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="cluster-eyebrow flex items-center gap-1.5"><CalendarClock size={12} /> Daily digest</span>
          <h1 className="cluster-title mt-1 text-2xl">{formatDateLongIST(todayIST)}</h1>
          <p className="text-dim mt-1 text-sm">Your fleet at a glance</p>
        </div>
        <button className="ov-btn self-start sm:self-auto" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && !money ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="ov-inset h-20 animate-pulse rounded-2xl" />)}
          </div>
          {[...Array(3)].map((_, i) => <div key={i} className="ov-inset h-24 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <PanelErrorBoundary name="digest">
          {/* Today at a glance */}
          <section>
            <SectionHeader label="Today at a glance" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard icon={Fuel} label="Fuel spend" value={formatInrCompact(m?.fuelCostInr || 0)} sub="Today" to="/fuel-spend" accent="var(--gnb-400)" />
              <KpiCard icon={Bell} label={actions.length === 1 ? 'Alert' : 'Alerts'} value={formatNum(actions.length)} sub="Needs review" to="/owner-alerts" accent="var(--critical)" emphasis={actions.length > 0} />
              <KpiCard icon={CalendarClock} label="Upcoming" value={formatNum(upcoming.length)} sub="Service & docs" accent="var(--caution)" emphasis={upcoming.length > 0} />
              <KpiCard icon={Wrench} label="Next service" value={nextSvcLabel} sub={nextSvc != null && nextSvc < 0 ? 'Overdue' : 'Due soon'} accent="var(--caution)" emphasis={nextSvc != null && nextSvc < 3} />
            </div>
          </section>

          {/* Action required */}
          <section className="mt-8">
            <SectionHeader label="Action required" count={actions.length} countTone={actions.length ? 'var(--critical)' : undefined} />
            {actions.length === 0 ? (
              <SectionEmpty title="You're all caught up" hint="No issues require your attention today." />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {actions.map((item) => <ActionCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Today's activity */}
          <section className="mt-8">
            <SectionHeader label="Today" />
            {activity.length === 0 ? (
              <SectionEmpty icon={Fuel} title="No activity recorded today" hint="Fuel spend and other daily figures appear here as telemetry arrives." />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activity.map((item) => <ActivityCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Upcoming */}
          <section className="mt-8">
            <SectionHeader label="Upcoming" count={upcoming.length || null} />
            {upcoming.length === 0 ? (
              <SectionEmpty title="No upcoming service items" hint="Service and document reminders will surface here as due dates approach." />
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((item) => <UpcomingRow key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {money?.disclaimer && (
            <p className="text-dim mt-8 border-t pt-4 text-[11px] leading-relaxed" style={{ borderColor: 'var(--hairline)' }}>
              {money.disclaimer}
            </p>
          )}
        </PanelErrorBoundary>
      )}
    </div>
    </div>
  );
}
