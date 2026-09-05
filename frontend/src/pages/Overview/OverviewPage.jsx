import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Map,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Star,
  TrendingDown,
  Users,
  Fuel,
  Navigation,
  WifiOff,
  Maximize2,
} from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewService } from "./OverviewService.jsx";
import { useOwnerValueDigest } from "./OwnerValueDigest.jsx";
import DashboardHeader from "./components/DashboardHeader.jsx";
import KpiRail from "./components/KpiRail.jsx";
import FleetHealthPanel from "./components/FleetHealthPanel.jsx";
import FinancialImpactPanel from "./components/FinancialImpactPanel.jsx";
import ActionCenter from "./components/ActionCenter.jsx";
import VehicleAttentionTable from "./components/VehicleAttentionTable.jsx";
import UtilizationPanel from "./components/UtilizationPanel.jsx";
import DowntimePanel from "./components/DowntimePanel.jsx";
import { Panel, SectionHeader } from "./components/overview.primitives.jsx";
import PanelErrorBoundary from "../../components/cluster/PanelErrorBoundary";
import { useHealthScore, useMoney, useUtilization, useDowntimeRisk } from "../../hooks/useOwnerValue";
import { LiveTrackingService } from "../LiveTracking/LiveTrackingService.jsx";
import {
  INDIA_CENTER,
  POLL_INTERVAL_MS,
  STATE_META,
  getStateMeta,
  formatIST,
  pinIcon,
  withCoordinates,
  fitMapToPositions,
} from "../LiveTracking/liveTracking.shared.js";
import { formatINR, formatNum } from "../../utils/formatters";

// --- Helpers ---
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDateLabel = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// --- Chart Tooltip ---
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg" style={{ borderColor: "var(--hairline)", background: "var(--cluster-panel)" }}>
      <p className="mb-1.5 text-xs font-medium text-dim">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-dim">{entry.name}:</span>
          <span className="num font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Fuel Variance Chart ---
const FuelVarianceChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Panel eyebrow="Fuel efficiency variance" question="Daily km/l deviation from baseline">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="var(--cluster-text-dim)" />
            <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--cluster-text-dim)" />
            <Tooltip content={<CustomTooltip formatter={(v) => v.toFixed(2) + " km/l"} labelFormatter={getDateLabel} />} />
            <Line
              type="monotone"
              dataKey="averageVariance"
              name="Avg. variance"
              stroke="var(--gnb-400)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--gnb-400)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};

// --- Outlier Chart ---
const OutlierChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Panel eyebrow="Daily outliers" question="Abnormal fuel-consumption days">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="var(--cluster-text-dim)" />
            <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--cluster-text-dim)" />
            <Tooltip content={<CustomTooltip labelFormatter={getDateLabel} />} />
            <Bar dataKey="outlierCount" name="Outlier count" fill="var(--critical)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};

// --- Financial Trend Chart ---
const FinancialChart = ({ data }) => {
  if (!data?.dailyTrend?.length) return null;
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.dailyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="var(--cluster-text-dim)" />
          <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--cluster-text-dim)" />
          <Tooltip content={<CustomTooltip formatter={(v) => formatINR(v)} labelFormatter={getDateLabel} />} />
          <Legend />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--ok)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--critical)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke="var(--caution)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Driver Card ---
const DriverCard = ({ driver, label, variant = "top" }) => {
  if (!driver) return null;
  const isTop = variant === "top";
  return (
    <Panel eyebrow={label}>
      <div className="flex items-center gap-4">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: isTop ? "color-mix(in srgb, var(--gnb-400) 14%, transparent)" : "color-mix(in srgb, var(--critical) 14%, transparent)",
            color: isTop ? "var(--gnb-400)" : "var(--critical)",
          }}
        >
          {getInitials(driver.driverName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" style={{ color: "var(--cluster-text)" }}>{driver.driverName}</p>
          {driver.mobileNumber && <p className="num text-xs text-dim">{driver.mobileNumber}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="ov-pill ov-pill--inert">{driver.tripCount || 0} trips</span>
            <span className="ov-pill ov-pill--inert">{formatNum(driver.totalFuelLitres || 0)} L</span>
          </div>
        </div>
        <div className="num flex items-center gap-1 text-lg font-bold" style={{ color: driver.rating >= 4 ? "var(--ok)" : driver.rating >= 3 ? "var(--caution)" : "var(--critical)" }}>
          {isTop ? <Trophy size={16} /> : <TrendingDown size={16} />}
          <Star size={16} fill="currentColor" />
          {(driver.rating || 0).toFixed(1)}
        </div>
      </div>
    </Panel>
  );
};

// --- Underperforming Drivers ---
const UnderperformingList = ({ drivers }) => {
  if (!drivers?.length || !drivers[0]?.driverName) return null;
  return (
    <Panel eyebrow="Underperforming drivers">
      <div className="flex flex-col gap-2.5">
        {drivers.map((driver) => (
          <div key={driver.driverId || driver.id} className="ov-inset flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: "color-mix(in srgb, var(--critical) 14%, transparent)", color: "var(--critical)" }}>
              {getInitials(driver.driverName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--cluster-text)" }}>{driver.driverName}</p>
              {driver.mobileNumber && <p className="num text-xs text-dim">{driver.mobileNumber}</p>}
            </div>
            <div className="num flex items-center gap-1 text-sm font-bold" style={{ color: driver.rating >= 3 ? "var(--caution)" : "var(--critical)" }}>
              <Star size={13} fill="currentColor" />
              {(driver.rating || 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// --- Live Vehicle Map ---
const MAP_CONTAINER_STYLE = { width: "100%", height: "420px", borderRadius: "0.75rem" };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const LiveVehicleMap = () => {
  const [positions, setPositions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef(null);
  const fetchInFlightRef = useRef(false);

  const fetchPositions = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    try {
      setPositions(await LiveTrackingService.getPositions());
      setError(null);
    } catch (err) {
      setError(err.detail || "Could not load live positions.");
    } finally {
      fetchInFlightRef.current = false;
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    const intervalId = setInterval(fetchPositions, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchPositions]);

  const located = useMemo(() => withCoordinates(positions), [positions]);

  const activeCount = positions.filter((p) => p.state === "ACTIVE").length;
  const parkedCount = positions.filter((p) => p.state === "PARKED").length;
  const offlineCount = positions.filter((p) => p.state === "OFFLINE").length;

  const selectedVehicle = positions.find((p) => p.registrationNumber === selectedReg) || null;

  const fitToVehicles = useCallback(() => {
    fitMapToPositions(mapRef.current, located);
  }, [located]);

  useEffect(() => {
    fitToVehicles();
  }, [fitToVehicles, isLoaded]);

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATE_META.ACTIVE.color }} /> Active ({activeCount})
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATE_META.PARKED.color }} /> Parked ({parkedCount})
      </span>
      <span className="flex items-center gap-1">
        <WifiOff size={12} /> Offline ({offlineCount})
      </span>
      <Link to="/live-tracking" className="ov-btn px-2.5 py-1" title="Open full live tracking">
        <Maximize2 size={12} /> Expand
      </Link>
    </div>
  );

  return (
    <Panel eyebrow="Live vehicle locations" question="Where is my fleet right now?" action={legend}>
      {!isLoaded || (isFetching && positions.length === 0) ? (
        <Skeleton className="h-[420px] w-full rounded-xl" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-dim">
          <AlertTriangle size={40} className="opacity-30" />
          <p className="text-sm">{error}</p>
        </div>
      ) : located.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-dim">
          <Navigation size={40} className="opacity-30" />
          <p className="text-sm">No vehicles with coordinates right now</p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={INDIA_CENTER}
          zoom={5}
          onLoad={(map) => {
            mapRef.current = map;
            fitToVehicles();
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
        >
          {located.map((v) => {
            const meta = getStateMeta(v.state);
            return (
              <MarkerF
                key={v.registrationNumber || v.vin}
                position={{ lat: v.latitude, lng: v.longitude }}
                title={v.registrationNumber || v.vin}
                icon={pinIcon(meta.color, v.isStale || v.state === "OFFLINE")}
                onClick={() => setSelectedReg(v.registrationNumber)}
              />
            );
          })}
          {selectedVehicle && selectedVehicle.latitude != null && (
            <InfoWindowF
              position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
              onCloseClick={() => setSelectedReg(null)}
            >
              <div style={{ padding: "4px 2px", minWidth: 180, fontFamily: "system-ui, sans-serif" }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                  {selectedVehicle.registrationNumber || selectedVehicle.vin}
                </p>
                <p style={{ fontSize: 12, color: getStateMeta(selectedVehicle.state).color, fontWeight: 600, margin: "4px 0" }}>
                  {getStateMeta(selectedVehicle.state).label}
                  {selectedVehicle.isStale ? " (stale)" : ""}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>
                  Speed: {selectedVehicle.speed != null ? `${Math.round(selectedVehicle.speed)} km/h` : "—"}
                  {" · "}Ignition: {selectedVehicle.ignition ? "On" : "Off"}
                </p>
                {selectedVehicle.primaryFuelLevel != null && (
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>Fuel: {selectedVehicle.primaryFuelLevel} L</p>
                )}
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0" }}>{"🕐 "}{formatIST(selectedVehicle.eventDateTime)}</p>
                <Link to="/live-tracking" style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>
                  Open in Live Tracking →
                </Link>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      )}
    </Panel>
  );
};

// --- Skeleton Loader ---
const DashboardSkeleton = () => (
  <div className="space-y-6 p-1">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  </div>
);

// --- Main Component ---
const OverviewPage = ({ embedded = false }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { money: riskMoney } = useOwnerValueDigest();

  const valueWindow = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - selectedDays * 24 * 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [selectedDays]);

  // Owner-value layer (hoisted here so cross-panel derivations — Action Center,
  // the vehicle attention table — can read all four feeds together).
  const { data: health, loading: healthLoading, error: healthError, refetch: refetchHealth } = useHealthScore();
  const { data: money, loading: moneyLoading, error: moneyError, refetch: refetchMoney } = useMoney(valueWindow);
  const { data: utilization, loading: utilLoading, refetch: refetchUtil } = useUtilization(valueWindow);
  const { data: downtime, loading: downLoading, refetch: refetchDown } = useDowntimeRisk();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { days: selectedDays };
        const [summary, fuel, drivers, fin] = await Promise.all([
          OverviewService.getDashboardSummary(params),
          OverviewService.getFuelAnalytics(params),
          OverviewService.getDriverPerformance(params),
          OverviewService.getFinancials(params),
        ]);
        setSummaryData(summary?.summaryCards);
        setFuelAnalytics(fuel);
        setDriverPerformance(drivers);
        setFinancials(fin);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.detail || "Could not load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDays, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetchHealth?.();
    refetchMoney?.();
    refetchUtil?.();
    refetchDown?.();
  }, [refetchHealth, refetchMoney, refetchUtil, refetchDown]);

  const vehicles = summaryData?.vehicles;
  const drivers = summaryData?.drivers;
  const trips = summaryData?.trips;
  const kilometers = summaryData?.kilometers;
  const fuel = summaryData?.fuel;
  const fuelSummary = fuelAnalytics?.summary;
  const finSummary = financials?.summary;

  const handleExport = useCallback(() => {
    const m = money?.money || {};
    const rows = [
      ["Metric", "Value"],
      ["Date range", `Last ${selectedDays} days`],
      ["Fleet health score", health?.score ?? "—"],
      ["Fleet health grade", health?.grade ?? "—"],
      ["Total vehicles", vehicles?.total ?? 0],
      ["Active vehicles", vehicles?.active ?? 0],
      ["Total drivers", drivers?.total ?? 0],
      ["Total trips", trips?.total ?? 0],
      ["Distance (km)", kilometers?.total ?? 0],
      ["Fuel cost (₹)", m.fuelCostInr ?? 0],
      ["DEF cost (₹)", m.defCostInr ?? 0],
      ["Idling waste (₹)", m.idlingWasteInr ?? 0],
      ["Detour waste (₹)", m.detourWasteInr ?? 0],
      ["Theft loss (₹)", m.theftLossInr ?? 0],
      ["Bill fraud suspect (₹)", m.billFraudSuspectInr ?? 0],
      ["Recoverable waste (₹)", money?.totalWasteInr ?? 0],
      ["Empty running (%)", utilization?.fleet?.emptyKmPct ?? "—"],
      ["Downtime exposure (₹)", downtime?.totalExposureInr ?? 0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Overview");
    XLSX.writeFile(wb, `fleet-overview-${selectedDays}d.xlsx`);
  }, [money, health, vehicles, drivers, trips, kilometers, utilization, downtime, selectedDays]);

  if (isLoading && !summaryData) return <div className="p-2"><DashboardSkeleton /></div>;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--critical) 14%, transparent)" }}>
          <AlertTriangle size={32} style={{ color: "var(--critical)" }} />
        </div>
        <p className="text-lg font-medium" style={{ color: "var(--cluster-text)" }}>Something went wrong</p>
        <p className="max-w-md text-sm text-dim">{error}</p>
        <button onClick={handleRefresh} className="ov-btn ov-btn--primary mt-2">Try again</button>
      </div>
    );
  }

  const hasFuel = fuel && (fuel.totalLitres > 0 || fuel.totalCost > 0);
  const hasFin = finSummary && (finSummary.totalRevenue > 0 || finSummary.totalExpenses > 0);
  const hasDriver = driverPerformance && (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating !== undefined);
  const hasCharts = fuelAnalytics?.dailyVariance?.length > 0 || fuelAnalytics?.dailyOutliers?.length > 0;

  return (
    <div className={embedded ? 'fleet-embedded space-y-6' : 'space-y-6 p-1'}>
      <DashboardHeader
        selectedDays={selectedDays}
        onRangeChange={setSelectedDays}
        onRefresh={handleRefresh}
        onExport={handleExport}
        refreshing={isLoading}
        lastUpdated={lastUpdated}
      />

      {/* Executive summary — the 5-second read */}
      <KpiRail vehicles={vehicles} drivers={drivers} trips={trips} kilometers={kilometers} health={health} riskMoney={riskMoney} />

      {/* Command deck — health & financial exposure */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelErrorBoundary name="health"><FleetHealthPanel health={health} loading={healthLoading} error={healthError} /></PanelErrorBoundary>
        <PanelErrorBoundary name="financial"><FinancialImpactPanel money={money} loading={moneyLoading} error={moneyError} /></PanelErrorBoundary>
      </div>

      {/* Operations — what needs attention & which vehicles */}
      <SectionHeader title="Operations" question="What requires attention right now?" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <PanelErrorBoundary name="action-center">
            <ActionCenter utilization={utilization} downtime={downtime} money={money} loading={moneyLoading || utilLoading || downLoading} />
          </PanelErrorBoundary>
        </div>
        <div className="xl:col-span-7">
          <PanelErrorBoundary name="vehicle-attention">
            <VehicleAttentionTable money={money} downtime={downtime} utilization={utilization} loading={moneyLoading || downLoading} />
          </PanelErrorBoundary>
        </div>
      </div>

      {/* Efficiency — utilization & downtime risk */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelErrorBoundary name="utilization"><UtilizationPanel utilization={utilization} loading={utilLoading} /></PanelErrorBoundary>
        <PanelErrorBoundary name="downtime"><DowntimePanel downtime={downtime} totalVehicles={vehicles?.total || 0} loading={downLoading} /></PanelErrorBoundary>
      </div>

      {/* Live tracking */}
      <SectionHeader title="Live Tracking" question="Real-time positions" />
      <LiveVehicleMap />

      {/* Analytics — secondary detail */}
      {(hasFuel || hasCharts || hasFin || hasDriver) && (
        <SectionHeader title="Analytics" question="Is performance improving or slipping?" />
      )}

      {hasFuel && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel eyebrow="Fuel consumed">
            <div className="num text-2xl font-bold" style={{ color: "var(--cluster-text)" }}>{formatNum(fuel.totalLitres || 0)} L</div>
            <div className="text-dim mt-1 text-xs">Cost {formatINR(fuel.totalCost || 0)}</div>
          </Panel>
          <Panel eyebrow="Fleet efficiency">
            <div className="num text-2xl font-bold" style={{ color: "var(--cluster-text)" }}>{(fuel.avgKmpl || 0).toFixed(2)} km/l</div>
            <div className="text-dim mt-1 text-xs">Overall average</div>
          </Panel>
          {fuelSummary && (
            <>
              <Panel eyebrow="Avg variance">
                <div className="num text-2xl font-bold" style={{ color: "var(--cluster-text)" }}>{(fuelSummary.averageVariance || 0).toFixed(2)}</div>
                <div className="text-dim mt-1 text-xs">Fleet {(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)} km/l</div>
              </Panel>
              <Panel eyebrow="Outliers">
                <div className="num text-2xl font-bold" style={{ color: (fuelSummary.outlierCount || 0) > 0 ? "var(--critical)" : "var(--cluster-text)" }}>{formatNum(fuelSummary.outlierCount || 0)}</div>
                <div className="text-dim mt-1 text-xs">of {formatNum(fuelSummary.totalTrips || 0)} trips</div>
              </Panel>
            </>
          )}
        </div>
      )}

      {hasCharts && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FuelVarianceChart data={fuelAnalytics.dailyVariance} />
          <OutlierChart data={fuelAnalytics.dailyOutliers} />
        </div>
      )}

      {hasFin && (
        <Panel eyebrow="Financial overview" question="Revenue, expenses and margin">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: "var(--ok)" }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Revenue</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: "var(--ok)" }}>{formatINR(finSummary.totalRevenue || 0)}</p>
            </div>
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: "var(--critical)" }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Expenses</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: "var(--critical)" }}>{formatINR(finSummary.totalExpenses || 0)}</p>
            </div>
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: (finSummary.netProfit || 0) >= 0 ? "var(--ok)" : "var(--critical)" }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Net profit</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: (finSummary.netProfit || 0) >= 0 ? "var(--ok)" : "var(--critical)" }}>{formatINR(finSummary.netProfit || 0)}</p>
            </div>
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: "var(--caution)" }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Margin</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: "var(--caution)" }}>{(finSummary.profitMargin || 0).toFixed(2)}%</p>
            </div>
          </div>
          {financials?.dailyTrend?.length > 0 && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--cluster-text)" }}>Daily revenue trend</h3>
              <FinancialChart data={financials} />
            </div>
          )}
        </Panel>
      )}

      {hasDriver && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {driverPerformance.topPerformingDriver && (
            <DriverCard driver={driverPerformance.topPerformingDriver} label="Top performing driver" variant="top" />
          )}
          {driverPerformance.averageDriverRating !== undefined && (
            <Panel eyebrow="Average rating">
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="num text-4xl font-bold" style={{ color: driverPerformance.averageDriverRating >= 4 ? "var(--ok)" : driverPerformance.averageDriverRating >= 3 ? "var(--caution)" : "var(--critical)" }}>
                  {(driverPerformance.averageDriverRating || 0).toFixed(1)}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} fill={s <= Math.round(driverPerformance.averageDriverRating) ? "currentColor" : "none"} style={{ color: s <= Math.round(driverPerformance.averageDriverRating) ? "var(--caution)" : "var(--inert)" }} />
                  ))}
                </div>
                <p className="text-dim text-xs">out of 5 ({formatNum(driverPerformance.totalDrivers || 0)} drivers)</p>
              </div>
            </Panel>
          )}
          {driverPerformance.underperformingDrivers?.length > 0 && driverPerformance.underperformingDrivers[0]?.driverName ? (
            <UnderperformingList drivers={driverPerformance.underperformingDrivers} />
          ) : (
            <Panel eyebrow="Fleet drivers">
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="num text-4xl font-bold" style={{ color: "var(--ok)" }}>{formatNum(driverPerformance.totalDrivers || 0)}</span>
                <p className="text-dim text-xs">active drivers in fleet</p>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
