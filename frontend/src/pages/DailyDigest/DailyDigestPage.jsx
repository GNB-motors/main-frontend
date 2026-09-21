import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  Sun,
  Moon,
  Truck,
  Package,
  Fuel,
  Bell,
  Calendar,
  Wrench,
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
  summarizeActionSeverity,
} from './dailyDigestLogic';
import {
  NdKpiStrip,
  NdAttentionCard,
  NdImpactCard,
  NdCalendarCard,
  NdRefuelCard,
  NdWasteTable,
  NdUpcomingCard,
  NdOpsRow,
  NdVehicleDrawer,
} from './novaDigestComponents.jsx';
import './novaDigest.css';

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

  const { data: money } = money$;
  const { data: fleetDashboard } = fleetDashboard$;
  const { data: downtime } = downtime$;
  const { data: alerts } = alerts$;
  const { data: fuelSummary } = fuel$;
  const { data: fleetAlertSummary } = fleetAlerts$;
  const { data: fuelEfficiency } = fuelEfficiency$;
  const { data: refuelling } = refuelling$;
  const { data: calendar } = calendar$;

  const loading =
    money$.loading ||
    fleetDashboard$.loading ||
    downtime$.loading ||
    alerts$.loading ||
    fuel$.loading;

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
    ].forEach((h) => h.refetch?.());
    setLastUpdated(Date.now());
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
  const upcoming = buildUpcomingItems({ serviceVehicles, documents });

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
      id: 'load',
      icon: Package,
      label: 'Load moving',
      value: formatNum(m?.loadTonnageInTransit || 0),
      unit: 't',
      note: 'dispatched, not yet unloaded',
      to: '/erp/pipeline',
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
      id: 'attn',
      icon: Bell,
      label: 'Needs attention',
      value: formatNum(actions.length),
      note: summarizeActionSeverity(actions),
      to: '#nd-attn',
    },
    {
      id: 'up',
      icon: Calendar,
      label: 'Upcoming',
      value: formatNum(upcoming.length),
      note: 'next 14 days',
    },
    {
      id: 'svc',
      icon: Wrench,
      label: 'Overdue service',
      value: formatNum(overdueCount),
      note: overdueCount > 0 ? 'needs immediate action' : 'none overdue',
      to: '/vehicles/service-intelligence',
    },
  ];

  // Cross-references the digest's already-fetched datasets by registrationNumber
  // so opening the drawer needs no extra request — fields with no real source
  // in any of these responses (live status, odometer, load on board) show "—"
  // rather than being invented.
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
    return {
      registrationNumber: selectedReg,
      model: calVeh?.model || effRow?.model || null,
      idleMinutes: idlingRow?.idleMinutes ?? null,
      detourKm: detourRow?.detourKm ?? null,
      kmpl: effRow?.kmpl ?? null,
      fuelLevelL: lowTank?.fuelLevelL ?? null,
      fill,
      events: calVeh?.events || [],
    };
  }, [selectedReg, money, fuelEfficiency, refuelling, calendar]);

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

        {loading && !money ? (
          <div className="nd-kpis">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="nd-kpi" style={{ opacity: 0.4 }} />
            ))}
          </div>
        ) : (
          <>
            <section>
              <div className="nd-eyebrow" style={{ marginBottom: 10 }}>
                Today at a glance
              </div>
              <NdKpiStrip items={kpis} />
            </section>

            <section className="nd-cols" id="nd-attn">
              <NdAttentionCard actions={actions} onOpenVehicle={openVehicle} />
              <div className="nd-rightcol">
                <NdImpactCard money={m} />
              </div>
            </section>

            <NdCalendarCard
              vehicles={calendar?.vehicles}
              days={14}
              onOpenVehicle={openVehicle}
              selectedVehicleId={
                calendar?.vehicles?.find((v) => v.registrationNumber === selectedReg)?.vehicleId
              }
            />

            <section className="nd-cols nd-cols--half">
              <NdRefuelCard data={refuelling} onOpenVehicle={openVehicle} />
              <NdWasteTable
                idlingTop5={m?.idlingTop5}
                detourTop5={m?.detourTop5}
                onOpenVehicle={openVehicle}
              />
            </section>

            <section className="nd-cols" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
              <NdUpcomingCard upcoming={upcoming} onOpenVehicle={openVehicle} />
            </section>

            <NdOpsRow money={m} fuelEfficiency={fuelEfficiency} onOpenVehicle={openVehicle} />

            <p className="nd-foot">
              {m?.disclaimer ||
                'Money figures are estimates generated from FleetEdge telemetry and the fuel, AdBlue and labour prices configured for your account. Idling, detour and siphoning values assume the configured price per litre at the time of the event. Treat them as directional, not as accounting entries.'}
            </p>
          </>
        )}
      </div>

      <NdVehicleDrawer vehicle={selectedVehicle} onClose={() => setSelectedReg(null)} />
    </div>
  );
}
