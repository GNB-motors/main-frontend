import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  Sun,
  Moon,
  Truck,
  Fuel,
  Calendar,
  Activity,
  Droplet,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import { getToken } from '../../utils/session.js';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import { useTheme } from '../../hooks/useTheme.js';
import { formatNum } from '../../utils/formatters';
import { formatDateLongIST } from '../../utils/dateUtils';
import {
  startOfTodayIST,
  buildActionItems,
  buildDocumentAlerts,
  buildUpcomingItems,
} from './dailyDigestLogic';
import {
  NdKpiStrip,
  NdKpiStripSkeleton,
  NdAttentionCard,
  NdImpactCard,
  NdCalendarCard,
  NdRefuelCard,
  NdWasteTable,
  NdUpcomingCard,
  NdOpsRow,
  NdOpsRowSkeleton,
  NdLeaderboardCard,
  NdCardSkeleton,
  NdVehicleDrawer,
} from './novaDigestComponents.jsx';
import '../../styles/nova/novaDesignSystem.css';

/**
 * DailyDigest — ported pixel-for-pixel from Design/Daily Digest (standalone).html
 * ("Nova Edge Pro"), wired to real endpoints instead of the mockup's random
 * data generator. See novaDigest.css / novaDigestComponents.jsx.
 */
export default function DailyDigestPage() {
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const from = startOfTodayIST();
  const { isDark, toggleTheme } = useTheme();

  const money$ = useApi((s) => OwnerValueService.getMoney({ from }, s), [from]);
  const fleetDashboard$ = useApi(() => VehicleService.getFleetDashboard(getToken()), []);
  const downtime$ = useApi((s) => OwnerValueService.getDowntimeRisk(s), []);
  const alerts$ = useApi((s) => OwnerAlertsService.getAlerts({ from, limit: 10 }, s), [from]);
  const fuel$ = useApi((s) => FuelIntegrityService.getSummary({ from }, s), [from]);
  const fleetAlerts$ = useApi((s) => FleetDataService.getFleetAlertSummary({ from }, s), [from]);
  const fuelEfficiency$ = useApi((s) => OwnerValueService.getFuelEfficiency({ days: 7 }, s), []);
  const refuelling$ = useApi(() => OwnerValueService.getRefuellingToday(), []);
  const calendar$ = useApi((s) => OwnerValueService.getFleetCalendar({ days: 14 }, s), []);
  const utilization$ = useApi((s) => OwnerValueService.getUtilization({ from }, s), [from]);
  const healthScore$ = useApi((s) => OwnerValueService.getHealthScore(s), []);
  const driverLeaderboard$ = useApi((s) => FleetDataService.getDriverLeaderboard({}, s), []);

  const { data: money } = money$;
  const { data: fleetDashboard } = fleetDashboard$;
  const { data: downtime } = downtime$;
  const { data: alerts } = alerts$;
  const { data: fuelSummary } = fuel$;
  const { data: fleetAlertSummary } = fleetAlerts$;
  const { data: fuelEfficiency } = fuelEfficiency$;
  const { data: refuelling } = refuelling$;
  const { data: calendar } = calendar$;
  const { data: utilization } = utilization$;
  const { data: healthScore } = healthScore$;
  const { data: driverLeaderboard } = driverLeaderboard$;

  const loading =
    money$.loading ||
    fleetDashboard$.loading ||
    downtime$.loading ||
    alerts$.loading ||
    fuel$.loading ||
    healthScore$.loading ||
    calendar$.loading;

  // Per-section gates so each card shows its own skeleton only until its
  // own source data has loaded once — mirrors useApi's "no flash on
  // refetch" behaviour instead of hiding the whole page behind one flag.
  const attnLoading = (loading || fleetAlerts$.loading) && !money;
  const impactLoading =
    (money$.loading && !money) ||
    (utilization$.loading && !utilization) ||
    (downtime$.loading && !downtime);
  const calendarLoading = calendar$.loading && !calendar;
  const refuelLoading = refuelling$.loading && !refuelling;
  const wasteLoading = money$.loading && !money;
  const upcomingLoading =
    (downtime$.loading && !downtime) || (fleetDashboard$.loading && !fleetDashboard);
  const opsLoading = (money$.loading && !money) || (fuelEfficiency$.loading && !fuelEfficiency);
  const leaderboardLoading = driverLeaderboard$.loading && !driverLeaderboard;

  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [, forceTick] = useState(0);
  const [selectedReg, setSelectedReg] = useState(null);
  useEffect(() => {
    if (!loading) setLastUpdated(Date.now());
  }, [loading]);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
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
      utilization$,
      healthScore$,
      driverLeaderboard$,
    ].forEach((h) => h.refetch?.());
    setLastUpdated(Date.now());
  };

  const m = money?.money;
  const documents = buildDocumentAlerts(fleetDashboard, 15);
  const serviceVehicles = downtime?.vehicles || [];

  const actions = buildActionItems({
    totals: fuelSummary?.totals,
    m,
    alerts,
    fleetAlertSummary,
    documents,
    serviceVehicles,
  });
  const upcoming = buildUpcomingItems({ serviceVehicles, documents });

  // Counts fleet-calendar "trip" events that cover today — both ErpTrip rows
  // (single-day, dated to tripDate) and ONGOING VehicleMileageInterval rows
  // (telemetry-detected trips with no ERP record, "automatic" trips; dated to
  // when they started, with `len` spanning through today). A same-day equality
  // check on `date` alone would miss a multi-day automatic trip that started
  // before today and is still running — this checks today falls inside
  // [date, date + len) instead, same span math the Gantt bars use.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const dayOffset = (d) => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((day.getTime() - t.getTime()) / DAY_MS);
  };
  const tripsToday = (calendar?.vehicles || []).reduce(
    (n, v) =>
      n +
      (v.events || []).filter((e) => {
        if (e.type !== 'trip') return false;
        const start = dayOffset(e.date);
        return start <= 0 && start + (e.len || 1) > 0;
      }).length,
    0,
  );

  const vehicleCount = fleetDashboard?.length || 0;
  const activeVehicleCount = (fleetDashboard || []).filter(
    (v) => v.status !== 'MAINTENANCE',
  ).length;

  const kpis = [
    {
      id: 'active',
      icon: Truck,
      label: 'Vehicles active',
      value: formatNum(activeVehicleCount),
      unit: `/ ${formatNum(vehicleCount)}`,
      note: 'not in maintenance',
      to: '/vehicles/dashboard',
      accent: true,
    },
    {
      id: 'fuel',
      icon: Fuel,
      label: 'Fuel spend',
      value: `₹${formatNum(m?.fuelCostInr || 0)}`,
      note: 'today',
      to: '/fuel-spend',
    },
    {
      id: 'trips',
      icon: Calendar,
      label: 'Trips today',
      value: formatNum(tripsToday),
      note: 'scheduled today',
      to: '#nd-calendar',
    },
    {
      id: 'def',
      icon: Droplet,
      label: 'AdBlue/DEF spend',
      value: `₹${formatNum(m?.defCostInr || 0)}`,
      note: 'today',
    },
    {
      id: 'health',
      icon: Activity,
      label: 'Fleet health',
      value: healthScore ? `Grade ${healthScore.grade}` : '—',
      note: healthScore ? `${formatNum(healthScore.score)}/100 this week` : 'this week',
    },
  ];

  // Fetched only while the drawer is open for a given plate — the digest's
  // own already-loaded datasets below are still used for today-scoped figures
  // (idling/detour/kmpl/fuel-in-tank/events) that have no equivalent in the
  // vehicle-profile aggregate, since those are today's-digest-window specific.
  const vehicleProfile$ = useApi(
    (s) => FleetDataService.getVehicleProfile(selectedReg, s),
    [selectedReg],
    { enabled: Boolean(selectedReg) },
  );
  const { data: vehicleProfile, loading: vehicleProfileLoading } = vehicleProfile$;

  const selectedVehicle = useMemo(() => {
    if (!selectedReg) return null;
    const idlingRow = money?.idlingTop5?.find((r) => r.registrationNumber === selectedReg);
    const detourRow = money?.detourTop5?.find((r) => r.registrationNumber === selectedReg);
    const effRow = fuelEfficiency?.worst?.find((r) => r.registrationNumber === selectedReg);
    const fill = refuelling?.fills?.find((f) => f.registrationNumber === selectedReg);
    const calVeh = calendar?.vehicles?.find((v) => v.registrationNumber === selectedReg);
    const lowTank = refuelling?.lowTankBeforeTrip?.find(
      (v) => v.registrationNumber === selectedReg,
    );
    const profile = vehicleProfile?.registrationNumber === selectedReg ? vehicleProfile : null;
    return {
      registrationNumber: selectedReg,
      model:
        profile?.fleetMaster?.model ||
        profile?.fleetEdge?.vehicleModel ||
        calVeh?.model ||
        effRow?.model ||
        null,
      idleMinutes: idlingRow?.idleMinutes ?? null,
      detourKm: detourRow?.detourKm ?? null,
      kmpl: effRow?.kmpl ?? null,
      fuelLevelL: lowTank?.fuelLevelL ?? null,
      fill,
      events: calVeh?.events || [],
      profile,
      profileLoading: vehicleProfileLoading && !profile,
    };
  }, [
    selectedReg,
    money,
    fuelEfficiency,
    refuelling,
    calendar,
    vehicleProfile,
    vehicleProfileLoading,
  ]);

  const openVehicle = (regOrId) => {
    // Table rows key by registrationNumber already; calendar/gantt rows key
    // by vehicleId — resolve the id case against the calendar list once.
    const byId = calendar?.vehicles?.find((v) => v.vehicleId === regOrId);
    setSelectedReg(byId ? byId.registrationNumber : regOrId);
  };

  const handleExport = () => {
    const rows = ['section,vehicle,detail,amount_inr']
      .concat(
        actions.map(
          (a) => `attention,${a.title},"${a.desc}",${(a.amt || '').replace(/[₹,]/g, '')}`,
        ),
      )
      .concat(
        (money?.idlingTop5 || []).map(
          (r) => `idling,${r.registrationNumber},${r.idleMinutes} min,${r.idleCostInr}`,
        ),
      )
      .concat(upcoming.map((u) => `upcoming,${u.registrationNumber},${u.kind},`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-digest-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="nova-digest">
      <div className="nd-page">
        <header className="nd-head">
          <div>
            <h1>Daily Digest</h1>
            <div className="nd-sub">{formatDateLongIST(todayIST)} · Your fleet at a glance</div>
          </div>
          <div className="nd-headtools">
            <button type="button" className="nd-btn" onClick={handleExport}>
              <Download size={15} />
              Export
            </button>
            <button type="button" className="nd-btn" onClick={handleRefresh} disabled={loading}>
              <span className={loading ? 'nd-spin' : ''}>
                <RefreshCw size={15} />
              </span>
              {loading ? 'Refreshing…' : lastUpdated ? 'Updated' : ''}
            </button>
            <button
              type="button"
              className="nd-btn nd-btn--icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <section>
          <div className="nd-eyebrow" style={{ marginBottom: 10 }}>
            Today at a glance
          </div>
          {loading && !money ? <NdKpiStripSkeleton items={kpis} /> : <NdKpiStrip items={kpis} />}
        </section>

        <section className="nd-cols" id="nd-attn">
          {attnLoading ? (
            <NdCardSkeleton title="Needs your attention" pill tabs={3} rows={4} rowHeight={64} />
          ) : (
            <NdAttentionCard
              actions={actions}
              onOpenVehicle={openVehicle}
              onResolved={(ackType) => {
                if (ackType === 'maintenance') downtime$.refetch?.();
                else if (ackType === 'docExpiry') fleetDashboard$.refetch?.();
                else alerts$.refetch?.();
              }}
            />
          )}
          <div className="nd-rightcol">
            {impactLoading ? (
              <NdCardSkeleton
                title={'Today\u2019s \u20b9 impact'}
                hint="Estimated"
                rows={11}
                rowHeight={40}
                big
              />
            ) : (
              <NdImpactCard
                money={m}
                atRisk={money?.atRisk}
                utilization={utilization}
                downtime={downtime}
              />
            )}
          </div>
        </section>

        {calendarLoading ? (
          <NdCardSkeleton title="Fleet calendar" tabs={2} rows={6} rowHeight={40} />
        ) : (
          <NdCalendarCard
            vehicles={calendar?.vehicles}
            days={14}
            onOpenVehicle={openVehicle}
            selectedVehicleId={
              calendar?.vehicles?.find((v) => v.registrationNumber === selectedReg)?.vehicleId
            }
          />
        )}

        <section className="nd-cols nd-cols--half">
          {refuelLoading ? (
            <NdCardSkeleton title="Refuelling today" pill rows={4} rowHeight={44} />
          ) : (
            <NdRefuelCard data={refuelling} onOpenVehicle={openVehicle} />
          )}
          {wasteLoading ? (
            <NdCardSkeleton
              title={'Idling & detour waste'}
              hint={'Today \u00b7 top 5 vehicles'}
              rows={5}
              rowHeight={40}
            />
          ) : (
            <NdWasteTable
              idlingTop5={m?.idlingTop5}
              detourTop5={m?.detourTop5}
              onOpenVehicle={openVehicle}
            />
          )}
        </section>

        <section
          className="nd-cols"
          id="nd-upcoming"
          style={{ gridTemplateColumns: 'minmax(0,1fr)' }}
        >
          {upcomingLoading ? (
            <NdCardSkeleton
              title="Upcoming"
              pill
              hint={'Next 14 days \u00b7 service and documents'}
              rows={4}
              rowHeight={36}
            />
          ) : (
            <NdUpcomingCard upcoming={upcoming} onOpenVehicle={openVehicle} />
          )}
        </section>

        {opsLoading ? (
          <NdOpsRowSkeleton />
        ) : (
          <NdOpsRow money={m} fuelEfficiency={fuelEfficiency} onOpenVehicle={openVehicle} />
        )}

        {leaderboardLoading ? (
          <NdCardSkeleton
            title="Driver fuel efficiency"
            hint="Last computed window · km/L"
            rows={5}
            rowHeight={36}
          />
        ) : (
          <NdLeaderboardCard leaderboard={driverLeaderboard} />
        )}

        <p className="nd-foot">
          {m?.disclaimer ||
            'Money figures are estimates generated from FleetEdge telemetry and the fuel, AdBlue and labour prices configured for your account. Idling, detour and siphoning values assume the configured price per litre at the time of the event. Treat them as directional, not as accounting entries.'}
        </p>
      </div>

      <NdVehicleDrawer vehicle={selectedVehicle} onClose={() => setSelectedReg(null)} />
    </div>
  );
}
