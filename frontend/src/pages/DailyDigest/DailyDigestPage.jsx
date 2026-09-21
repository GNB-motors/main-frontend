import { useEffect, useMemo, useState } from 'react';
import { Bell, Fuel, Wrench, CalendarClock, RefreshCw, Truck, Package } from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import { getToken } from '../../utils/session.js';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import { DailyBriefService } from '../DailyBrief/DailyBriefService';
import { TotalImpactTile, BriefSectionCard } from '../DailyBrief/dailyBriefCards';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import { formatInrCompact, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateLongIST } from '../../utils/dateUtils';
import {
  startOfTodayIST,
  buildActionItems,
  buildCalendarDays,
  buildDocumentAlerts,
  buildUpcomingItems,
  groupUpcomingByDays,
  summarizeActionSeverity,
} from './dailyDigestLogic';
import {
  SectionHeader,
  KpiCard,
  ActionCard,
  SeverityTabs,
  ImpactBars,
  FuelEfficiencyPanel,
  RefuelPanel,
  WasteTable,
  CalendarSection,
  UpcomingDayGroup,
  SectionEmpty,
} from './dailyDigestCards';

/**
 * DailyDigest — "Here is the current state of my fleet, what needs my attention,
 * and what to do next." Composed entirely from existing endpoints; every item
 * links to its evidence. Priority: Needs attention → Upcoming → Operations.
 */
export default function DailyDigestPage() {
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const from = startOfTodayIST();

  const money$ = useApi((s) => OwnerValueService.getMoney({ from }, s), [from]);
  // Same vehicle-document data Vehicle360's Documents tab shows — no separate
  // "compliance" endpoint.
  const fleetDashboard$ = useApi(() => VehicleService.getFleetDashboard(getToken()), []);
  const downtime$ = useApi((s) => OwnerValueService.getDowntimeRisk(s), []);
  const alerts$ = useApi((s) => OwnerAlertsService.getAlerts({ from, limit: 10 }, s), [from]);
  const fuel$ = useApi((s) => FuelIntegrityService.getSummary({ from }, s), [from]);
  const fleetAlerts$ = useApi((s) => FleetDataService.getFleetAlertSummary({ from }, s), [from]);
  const fuelEfficiency$ = useApi((s) => OwnerValueService.getFuelEfficiency({ days: 7 }, s), []);
  const refuelling$ = useApi(() => OwnerValueService.getRefuellingToday(), []);
  const calendar$ = useApi((s) => OwnerValueService.getFleetCalendar({ days: 14 }, s), []);
  // Dark-launched (feature flag off = 404) — excluded from the primary loading
  // gate and rendered only on success, so an org without it sees no trace.
  const brief$ = useApi((s) => DailyBriefService.getBrief({ date: from }, s), [from]);

  const { data: money } = money$;
  const { data: fleetDashboard } = fleetDashboard$;
  const { data: downtime } = downtime$;
  const { data: alerts } = alerts$;
  const { data: fuelSummary } = fuel$;
  const { data: fleetAlertSummary } = fleetAlerts$;
  const { data: fuelEfficiency } = fuelEfficiency$;
  const { data: refuelling } = refuelling$;
  const { data: calendar } = calendar$;
  const { data: brief } = brief$;

  const loading =
    money$.loading ||
    fleetDashboard$.loading ||
    downtime$.loading ||
    alerts$.loading ||
    fuel$.loading;

  const [severityFilter, setSeverityFilter] = useState('ALL');

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
    [
      money$,
      fleetDashboard$,
      downtime$,
      alerts$,
      fuel$,
      fleetAlerts$,
      fuelEfficiency$,
      refuelling$,
      calendar$,
      brief$,
    ].forEach((h) => h.refetch?.());
  };

  const m = money?.money;
  const documents = buildDocumentAlerts(fleetDashboard, 15);
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
  const filteredActions = useMemo(() => {
    if (severityFilter === 'ALL') return actions;
    if (severityFilter === 'HIGH') {
      return actions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH');
    }
    return actions.filter((a) => a.sev === severityFilter);
  }, [actions, severityFilter]);

  const upcoming = buildUpcomingItems({ serviceVehicles, documents });
  const upcomingByDay = groupUpcomingByDays(upcoming);
  const { overdue: calendarOverdue, days: calendarDays } = buildCalendarDays(
    calendar?.vehicles,
    14,
  );

  const vehicleCount = fleetDashboard?.length || 0;
  const activeVehicleCount = (fleetDashboard || []).filter(
    (v) => v.status !== 'MAINTENANCE',
  ).length;

  return (
    <div className="mx-auto" style={{ maxWidth: 1400 }}>
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
        <div>
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 md:gap-5 mt-4">
                  <KpiCard
                    icon={Truck}
                    label="Vehicles active"
                    value={`${formatNum(activeVehicleCount)}/${formatNum(vehicleCount)}`}
                    sub="Not in maintenance"
                    to="/vehicles/dashboard"
                    accent="var(--gnb-400)"
                  />
                  <KpiCard
                    icon={Package}
                    label="Load moving"
                    value={`${formatNum(m?.loadTonnageInTransit || 0)} t`}
                    sub="Dispatched, not yet unloaded"
                    to="/erp/pipeline"
                    accent="var(--gnb-400)"
                  />
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

              <section className="mt-6 mb-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <SectionHeader
                    label="Needs your attention"
                    count={filteredActions.length}
                    countTone={filteredActions.length ? 'var(--critical)' : undefined}
                  />
                  {actions.length > 0 && (
                    <SeverityTabs
                      actions={actions}
                      active={severityFilter}
                      onChange={setSeverityFilter}
                    />
                  )}
                </div>
                {filteredActions.length === 0 ? (
                  <SectionEmpty
                    title={actions.length === 0 ? "You're all caught up" : 'Nothing in this filter'}
                    hint={
                      actions.length === 0
                        ? 'No critical issues need your attention today — everything is operating normally.'
                        : 'Switch the filter above to see other open items.'
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredActions.map((item) => (
                      <ActionCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8">
                <SectionHeader label="Today's ₹ impact" />
                <div className="mt-4">
                  {brief && !brief$.error ? (
                    <div className="flex flex-col gap-3">
                      <TotalImpactTile totalRupees={brief.totalRupees} />
                      {brief.sections.map((section) => (
                        <BriefSectionCard key={section.key} section={section} />
                      ))}
                    </div>
                  ) : (
                    <ImpactBars money={m} />
                  )}
                </div>
              </section>

              <section className="mt-8">
                <SectionHeader label="Fleet calendar" count={calendarDays.length || null} />
                <div className="mt-4">
                  {calendar$.loading && !calendar ? (
                    <div className="ov-inset h-40 animate-pulse rounded-2xl" />
                  ) : (
                    <CalendarSection overdue={calendarOverdue} days={calendarDays} />
                  )}
                </div>
              </section>

              <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <SectionHeader label="Fuel efficiency" />
                  <div className="mt-4">
                    {fuelEfficiency$.loading && !fuelEfficiency ? (
                      <div className="ov-inset h-40 animate-pulse rounded-2xl" />
                    ) : (
                      <FuelEfficiencyPanel data={fuelEfficiency} />
                    )}
                  </div>
                </div>
                <div>
                  <SectionHeader label="Refuelling today" count={refuelling?.totalCount || null} />
                  <div className="mt-4">
                    {refuelling$.loading && !refuelling ? (
                      <div className="ov-inset h-40 animate-pulse rounded-2xl" />
                    ) : (
                      <RefuelPanel data={refuelling} />
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <SectionHeader label="Idling & detour waste" />
                <div className="mt-4">
                  <WasteTable idlingTop5={m?.idlingTop5} detourTop5={m?.detourTop5} />
                </div>
              </section>

              <section className="mt-8">
                <SectionHeader label="Upcoming" count={upcoming.length || null} />
                {upcoming.length === 0 ? (
                  <SectionEmpty
                    title="No upcoming service items"
                    hint="Service and document reminders will surface here as due dates approach."
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {upcomingByDay.map((group) => (
                      <UpcomingDayGroup key={group.days} days={group.days} items={group.items} />
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
    </div>
  );
}
