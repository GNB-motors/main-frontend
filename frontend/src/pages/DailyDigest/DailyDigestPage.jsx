import { Link } from 'react-router-dom';
import { ShieldAlert, FileWarning, Bell, Wrench, Fuel, ArrowRight, CalendarClock } from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import EmptyState from '../../components/cluster/EmptyState';
import { formatINR, formatInrCompact, formatNum, formatLitres } from '../../utils/formatters';
import { formatDateLongIST } from '../../utils/dateUtils';

// Start of today in IST, as an ISO instant for backend windows.
const startOfTodayIST = () => {
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istNow.setHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - 5.5 * 3600 * 1000).toISOString();
};

function DigestLine({ to, tone = 'var(--cluster-text)', icon: IconProp, children }) {
  const Icon = IconProp;
  return (
    <Link
      to={to}
      className="cluster-inset group flex items-center gap-3 px-4 py-3 transition-transform hover:-translate-y-0.5"
    >
      <Icon size={15} style={{ color: tone, flex: '0 0 auto' }} />
      <span className="flex-1 text-sm leading-snug" style={{ color: 'var(--cluster-text)' }}>
        {children}
      </span>
      <ArrowRight size={14} className="opacity-30 transition-opacity group-hover:opacity-80" />
    </Link>
  );
}

function Section({ eyebrow, children }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="cluster-eyebrow">{eyebrow}</span>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/**
 * DailyDigest — one screen, one day, in the owner's language.
 * Every line links to its evidence. Composed entirely from existing endpoints.
 */
export default function DailyDigestPage() {
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const from = startOfTodayIST();

  const { data: money, loading: moneyLoading } = useApi(
    (s) => OwnerValueService.getMoney({ from }, s),
    [from],
  );
  const { data: compliance, loading: compLoading } = useApi(
    (s) => OwnerValueService.getComplianceRisk({ days: 15 }, s),
    [],
  );
  const { data: downtime, loading: downLoading } = useApi(
    (s) => OwnerValueService.getDowntimeRisk(s),
    [],
  );
  const { data: alerts, loading: alertsLoading } = useApi(
    (s) => OwnerAlertsService.getAlerts({ from, limit: 10 }, s),
    [from],
  );
  const { data: fuelSummary, loading: fuelLoading } = useApi(
    (s) => FuelIntegrityService.getSummary({ from }, s),
    [from],
  );
  const { data: fleetAlertSummary } = useApi(
    (s) => FleetDataService.getFleetAlertSummary({ from }, s),
    [from],
  );

  const loading = moneyLoading || compLoading || downLoading || alertsLoading || fuelLoading;

  const lines = {
    money: [],
    alerts: [],
    compliance: [],
    service: [],
  };

  const m = money?.money;
  if (m) {
    if (m.theftLossInr > 0) {
      const top = money.topVehicles?.[0];
      lines.money.push({
        to: '/fuel-integrity',
        tone: 'var(--critical)',
        icon: ShieldAlert,
        text: `≈ ${formatINR(m.theftLossInr)} unexplained fuel loss today${top ? ` — most on ${top.registrationNumber}` : ''}. Please review.`,
      });
    }
    if (m.billFraudSuspectInr > 0) {
      lines.money.push({
        to: '/fuel-integrity',
        tone: 'var(--critical)',
        icon: Fuel,
        text: `${formatINR(m.billFraudSuspectInr)} of fuel bills don't match the tanks. Please review.`,
      });
    }
    if (m.idlingWasteInr > 0) {
      lines.money.push({
        to: '/owner-alerts',
        tone: 'var(--caution)',
        icon: Fuel,
        text: `Idling burned about ${formatInrCompact(m.idlingWasteInr)} today.`,
      });
    }
    if (m.detourWasteInr > 0) {
      lines.money.push({
        to: '/route-deviation',
        tone: 'var(--caution)',
        icon: Fuel,
        text: `Detours cost about ${formatInrCompact(m.detourWasteInr)} today.`,
      });
    }
    if (m.fuelCostInr > 0) {
      lines.money.push({
        to: '/fuel-spend',
        tone: 'var(--cluster-text-dim)',
        icon: Fuel,
        text: `Fuel spend today: ${formatInrCompact(m.fuelCostInr)}.`,
      });
    }
  }

  const totals = fuelSummary?.totals;
  if (totals?.siphonSuspectedLossL > 0) {
    lines.money.unshift({
      to: '/fuel-integrity',
      tone: 'var(--critical)',
      icon: ShieldAlert,
      text: `${formatLitres(totals.siphonSuspectedLossL)} left tanks without explanation (${formatINR(totals.siphonSuspectedLossInr)}).`,
    });
  }

  const unack = alerts?.records?.filter((a) => !a.acknowledged) || [];
  for (const a of unack.slice(0, 4)) {
    lines.alerts.push({
      to: '/owner-alerts',
      tone: 'var(--caution)',
      icon: Bell,
      text: `${a.message?.replace(/^Please review: /, '') || a.type}`,
    });
  }
  const nativeCount = fleetAlertSummary?.totalAlerts || 0;
  if (nativeCount > 0) {
    const worst = fleetAlertSummary.byType?.find((t) => t.severity === 'critical');
    lines.alerts.push({
      to: '/fleet-alerts',
      tone: worst ? 'var(--critical)' : 'var(--cluster-text-dim)',
      icon: Bell,
      text: `${formatNum(nativeCount)} native FleetEdge alert${nativeCount === 1 ? '' : 's'} today${worst ? ` — including ${worst.count} ${worst.title.toLowerCase()}` : ''}.`,
    });
  }

  for (const d of (compliance?.documents || []).slice(0, 4)) {
    lines.compliance.push({
      to: '/compliance',
      tone: d.status === 'EXPIRED' || d.daysLeft < 0 ? 'var(--critical)' : 'var(--caution)',
      icon: FileWarning,
      text:
        d.daysLeft < 0
          ? `${d.registrationNumber} — ${d.docType} expired ${formatNum(-d.daysLeft)} days ago.`
          : `${d.registrationNumber} — ${d.docType} expires in ${formatNum(d.daysLeft)} days.`,
    });
  }

  for (const v of (downtime?.vehicles || []).slice(0, 3)) {
    lines.service.push({
      to: `/vehicles/${encodeURIComponent(v.registrationNumber)}`,
      tone: v.risk === 'OVERDUE' ? 'var(--critical)' : 'var(--caution)',
      icon: Wrench,
      text:
        v.risk === 'OVERDUE'
          ? `${v.registrationNumber} is overdue for service by ${formatNum(Math.abs(v.daysUntilDue ?? 0))} days.`
          : `${v.registrationNumber} is due for service in ${formatNum(v.daysUntilDue ?? 0)} days.`,
    });
  }

  const totalLines = lines.money.length + lines.alerts.length + lines.compliance.length + lines.service.length;
  const quiet = !loading && totalLines === 0;

  return (
    <div className="cluster-page mx-auto max-w-3xl space-y-6">
      <div>
        <span className="cluster-eyebrow flex items-center gap-1.5">
          <CalendarClock size={12} /> Daily digest
        </span>
        <h1 className="cluster-title mt-1 text-2xl">{formatDateLongIST(todayIST)}</h1>
        <p className="text-dim mt-1 text-sm">One screen, one day. Every line links to its evidence.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="cluster-inset h-12 animate-pulse" />
          ))}
        </div>
      ) : quiet ? (
        <EmptyState
          title="Nothing needs you today"
          hint="No unexplained fuel loss, no expiring documents, no unreviewed alerts, no service risk. The digest fills itself the moment something needs a decision."
        />
      ) : (
        <PanelErrorBoundary name="digest">
          <div className="flex flex-col gap-6">
            {lines.money.length ? <Section eyebrow="Money">{lines.money.map((l, i) => <DigestLine key={i} {...l}>{l.text}</DigestLine>)}</Section> : null}
            {lines.alerts.length ? <Section eyebrow="Alerts to review">{lines.alerts.map((l, i) => <DigestLine key={i} {...l}>{l.text}</DigestLine>)}</Section> : null}
            {lines.compliance.length ? (
              <Section eyebrow="Documents">{lines.compliance.map((l, i) => <DigestLine key={i} {...l}>{l.text}</DigestLine>)}</Section>
            ) : null}
            {lines.service.length ? <Section eyebrow="Service">{lines.service.map((l, i) => <DigestLine key={i} {...l}>{l.text}</DigestLine>)}</Section> : null}
          </div>
          {money?.disclaimer ? <p className="text-dim mt-6 text-[11px]">{money.disclaimer}</p> : null}
        </PanelErrorBoundary>
      )}
    </div>
  );
}
