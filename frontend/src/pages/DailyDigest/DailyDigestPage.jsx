import { Bell, Fuel, Wrench, CalendarClock, RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import { formatInrCompact, formatNum } from '../../utils/formatters';
import { formatDateLongIST } from '../../utils/dateUtils';
import {
  startOfTodayIST,
  buildActionItems,
  buildActivityItems,
  buildUpcomingItems,
  nextServiceLabel,
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

  const loading =
    money$.loading || compliance$.loading || downtime$.loading || alerts$.loading || fuel$.loading;

  const handleRefresh = () => {
    [money$, compliance$, downtime$, alerts$, fuel$, fleetAlerts$].forEach((h) => h.refetch?.());
  };

  const m = money?.money;
  const documents = compliance?.documents || [];
  const serviceVehicles = downtime?.vehicles || [];

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
  const { nextSvc, label: nextSvcLabel } = nextServiceLabel(serviceVehicles);

  return (
    <PageShell
      title="Daily Digest"
      subtitle={`${formatDateLongIST(todayIST)} · Your fleet at a glance`}
      actions={
        <button
          className="ov-btn self-start sm:self-auto"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
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
                  label={actions.length === 1 ? 'Alert' : 'Alerts'}
                  value={formatNum(actions.length)}
                  sub="Needs review"
                  to="/owner-alerts"
                  accent="var(--critical)"
                  emphasis={actions.length > 0}
                />
                <KpiCard
                  icon={CalendarClock}
                  label="Upcoming"
                  value={formatNum(upcoming.length)}
                  sub="Service & docs"
                  accent="var(--caution)"
                  emphasis={upcoming.length > 0}
                />
                <KpiCard
                  icon={Wrench}
                  label="Next service"
                  value={nextSvcLabel}
                  sub={nextSvc != null && nextSvc < 0 ? 'Overdue' : 'Due soon'}
                  accent="var(--caution)"
                  emphasis={nextSvc != null && nextSvc < 3}
                />
              </div>
            </section>

            <section className="mt-8">
              <SectionHeader
                label="Action required"
                count={actions.length}
                countTone={actions.length ? 'var(--critical)' : undefined}
              />
              {actions.length === 0 ? (
                <SectionEmpty
                  title="You're all caught up"
                  hint="No issues require your attention today."
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
              <SectionHeader label="Today" />
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
