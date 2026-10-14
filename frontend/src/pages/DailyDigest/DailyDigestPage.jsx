import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import ExportButton from '../../components/ui/ExportButton';
import OwnerValueService from '../../services/OwnerValueService';
import FleetDataService from '../../services/FleetDataService';
import { VehicleService } from '../Profile/VehicleService.js';
import { OwnerAlertsService } from '../OwnerAlerts/OwnerAlertsService';
import { FuelIntegrityService } from '../FuelIntegrity/FuelIntegrityService';
import { morningBriefSchema } from '../../schemas/morningBrief.schema';

import { formatDateLongIST } from '../../utils/dateUtils';
import {
  startOfTodayIST,
  buildActionItems,
  buildDocumentAlerts,
  buildUpcomingItems,
} from './dailyDigestLogic';
import { buildDigestKpis } from './digestKpis';
import { buildDigestExportRows } from './digestExportRows';
import NdKpiStrip from './sections/NdKpiStrip.jsx';
import NdKpiStripSkeleton from './sections/NdKpiStripSkeleton.jsx';
import NdAttentionCard from './sections/NdAttentionCard.jsx';
import NdImpactCard from './sections/NdImpactCard.jsx';
import NdCalendarCard from './sections/NdCalendarCard.jsx';
import NdRefuelCard from './sections/NdRefuelCard.jsx';
import NdWasteTable from './sections/NdWasteTable.jsx';
import NdUpcomingCard from './sections/NdUpcomingCard.jsx';
import NdOpsRow from './sections/NdOpsRow.jsx';
import NdOpsRowSkeleton from './sections/NdOpsRowSkeleton.jsx';
import NdLeaderboardCard from './sections/NdLeaderboardCard.jsx';
import NdMorningBrief from './sections/NdMorningBrief.jsx';
import NdMorningBriefSkeleton from './sections/NdMorningBriefSkeleton.jsx';
import NdCardSkeleton from './sections/NdCardSkeleton.jsx';
import NdVehicleDrawer from './sections/NdVehicleDrawer.jsx';
import '../../styles/nova/novaDesignSystem.css';

/**
 * DailyDigest — ported pixel-for-pixel from Design/Daily Digest (standalone).html
 * ("Nova Edge Pro"), wired to real endpoints instead of the mockup's random
 * data generator. See novaDigest.css / sections/.
 *
 * Every class name in sections/ is `nd-*`, scoped in novaDigest.css under
 * `.nova-digest` so these otherwise very generic names (.card, .item, .tab…)
 * never leak into the rest of the app's CSS.
 */
export default function DailyDigestPage() {
  const from = startOfTodayIST();

  // The eight owner-value sections arrive in one request (FRONTEND_AUDIT B1);
  // each section below reads its slice and shares the request's loading state.
  const digest$ = useApi(
    (s) => OwnerValueService.getDigest({ from, efficiencyDays: 7, calendarDays: 14 }, s),
    [from],
  );
  const section = (key, parse = (d) => d) => ({
    data: digest$.data?.[key] != null ? parse(digest$.data[key]) : null,
    loading: digest$.loading,
    refetch: digest$.refetch,
  });
  const money$ = section('money');
  const downtime$ = section('downtimeRisk');
  const fuelEfficiency$ = section('fuelEfficiency');
  const refuelling$ = section('refuellingToday');
  const calendar$ = section('fleetCalendar');
  const utilization$ = section('utilization');
  const healthScore$ = section('healthScore');
  // An unexpected brief shape hides the brief, as a failed request did before.
  const morningBrief$ = section('morningBrief', (d) => {
    const parsed = morningBriefSchema.safeParse(d);
    return parsed.success ? parsed.data : null;
  });
  const fleetDashboard$ = useApi((signal) => VehicleService.getFleetDashboard({ signal }), []);
  const alerts$ = useApi((s) => OwnerAlertsService.getAlerts({ from, limit: 10 }, s), [from]);
  const fuel$ = useApi((s) => FuelIntegrityService.getSummary({ from }, s), [from]);
  const fleetAlerts$ = useApi((s) => FleetDataService.getFleetAlertSummary({ from }, s), [from]);
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
  const { data: morningBrief } = morningBrief$;

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
  const briefLoading = morningBrief$.loading && !morningBrief;

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
    [digest$, fleetDashboard$, alerts$, fuel$, fleetAlerts$, driverLeaderboard$].forEach((h) =>
      h.refetch(),
    );
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

  const kpis = buildDigestKpis({ fleetDashboard, m, calendar, healthScore });

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

  const digestExportRows = useMemo(
    () => buildDigestExportRows({ actions, money, morningBrief, upcoming }),
    [actions, money, morningBrief, upcoming],
  );

  const digestExportColumns = [
    { key: 'section', label: 'Section' },
    { key: 'vehicle', label: 'Vehicle / Item' },
    { key: 'detail', label: 'Details' },
    { key: 'amount', label: 'Amount (₹)' },
  ];

  return (
    <div className="nova-digest">
      <div className="nd-page">
        <header className="nd-head">
          <div>
            <h1>Daily Digest</h1>
            <div className="nd-sub">{formatDateLongIST(new Date())} · Your fleet at a glance</div>
          </div>
          <div className="nd-headtools">
            <ExportButton
              rows={digestExportRows}
              columns={digestExportColumns}
              filename={`daily-digest-${new Date().toISOString().slice(0, 10)}`}
              disabled={loading || !digestExportRows.length}
            />
            <button
              type="button"
              className="nd-btn nd-btn--refresh"
              onClick={handleRefresh}
              disabled={loading}
              title={
                lastUpdated
                  ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`
                  : 'Refresh'
              }
            >
              <span className={loading ? 'nd-spin' : ''}>
                <RefreshCw size={15} />
              </span>
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
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

        {briefLoading ? (
          <NdMorningBriefSkeleton />
        ) : (
          <NdMorningBrief
            brief={morningBrief}
            onOpenVehicle={openVehicle}
            onRetry={morningBrief$.refetch}
          />
        )}

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
