import { useEffect, useState } from 'react';
import { Bell, Fuel, Wrench, CalendarClock, RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import { formatInrCompact, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateLongIST } from '../../utils/dateUtils';
import {
  startOfTodayIST,
  buildActionItems,
  buildActivityItems,
  buildUpcomingItems,
  summarizeActionSeverity,
} from './dailyDigestLogic';
import {
  SectionHeader,
  KpiCard,
  ActionCard,
  ActivityCard,
  UpcomingRow,
  SectionEmpty,
} from './dailyDigestCards';

/**
 * DailyDigest — "Here is the current state of my fleet, what needs my attention,
 * and what to do next." Composed entirely from existing endpoints; every item
 * links to its evidence. Priority: Needs attention → Overview → Activity → Upcoming.
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

  const loading =
    money$.loading || compliance$.loading || downtime$.loading || alerts$.loading || fuel$.loading;

  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!loading) setLastUpdated(Date.now());
  }, [loading]);
  // Re-render every 30s purely so the "Updated Xm ago" text stays current.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    [money$, compliance$, downtime$, alerts$, fuel$, fleetAlerts$].forEach((h) => h.refetch?.());
  };

  const m = money?.money;
  const documents = compliance?.documents || [];
  const serviceVehicles = downtime?.vehicles || [];
  const overdueCount = serviceVehicles.filter((v) => v.risk === 'OVERDUE').length;

  const actions = buildActionItems({
    totals: fuelSummary?.totals,
    m,
    alerts,
    fleetAlertSummary,
    documents,
    serviceVehicles,
  });
  const activity = buildActivityItems(m);
  const upcoming = buildUpcomingItems({ serviceVehicles, documents });

  return (
    <PageShell
      title="Daily Digest"
      subtitle={`${formatDateLongIST(todayIST)} · Your fleet at a glance`}
      actions={
        <button
          className="text-dim flex items-center gap-1.5 self-start text-xs sm:self-auto"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Updated {timeAgo(lastUpdated)}
        </button>
      }
    >
      <div className="mx-auto space-y-8" style={{ maxWidth: 1160 }}>
        {loading && !money ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="ov-inset h-20 animate-pulse rounded-2xl" />
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ov-inset h-24 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <PanelErrorBoundary name="digest">
            <section>
              <SectionHeader label="Today at a glance" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiCard
                  icon={Fuel}
                  label="Fuel spend"
                  value={formatInrCompact(m?.fuelCostInr || 0)}
                  sub="Today"
                  to="/fuel-spend"
                  accent="var(--gnb-400)"
                />
                <KpiCard
                  icon={Bell}
                  label="Needs attention"
                  value={formatNum(actions.length)}
                  sub={summarizeActionSeverity(actions)}
                  to="/owner-alerts"
                  accent="var(--critical)"
                  emphasis={actions.length > 0}
                />
                <KpiCard
                  icon={CalendarClock}
                  label="Upcoming"
                  value={formatNum(upcoming.length)}
                  sub="Next 14 days"
                  accent="var(--caution)"
                  emphasis={upcoming.length > 0}
                />
                <KpiCard
                  icon={Wrench}
                  label="Overdue service"
                  value={formatNum(overdueCount)}
                  sub={overdueCount > 0 ? 'Needs immediate action' : 'None overdue'}
                  to="/vehicles/service-intelligence"
                  accent="var(--critical)"
                  emphasis={overdueCount > 0}
                />
              </div>
            </section>

            <section className="mt-8">
              <SectionHeader
                label="Needs your attention"
                count={actions.length}
                countTone={actions.length ? 'var(--critical)' : undefined}
              />
              {actions.length === 0 ? (
                <SectionEmpty
                  title="You're all caught up"
                  hint="No critical issues need your attention today — everything is operating normally."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {actions.map((item) => (
                    <ActionCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <SectionHeader label="Today's operations" />
              {activity.length === 0 ? (
                <SectionEmpty
                  icon={Fuel}
                  title="No activity recorded today"
                  hint="Fuel spend and other daily figures appear here as telemetry arrives."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {activity.map((item) => (
                    <ActivityCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <SectionHeader label="Upcoming" count={upcoming.length || null} />
              {upcoming.length === 0 ? (
                <SectionEmpty
                  title="No upcoming service items"
                  hint="Service and document reminders will surface here as due dates approach."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((item) => (
                    <UpcomingRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            {money?.disclaimer && (
              <p
                className="text-dim mt-8 border-t pt-4 text-[11px] leading-relaxed"
                style={{ borderColor: 'var(--hairline)' }}
              >
                {money.disclaimer}
              </p>
            )}
          </PanelErrorBoundary>
        )}
      </div>
    </PageShell>
  );
}
