import React, { useState, useEffect } from "react";
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
  Truck,
  Map,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Star,
  TrendingDown,
  Users,
  Activity,
  Fuel,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OverviewService } from "./OverviewService.jsx";
import StatCard from "./components/StatCard.jsx";
import FleetMap from "./components/FleetMap.jsx";
import ExceptionsRail from "./components/ExceptionsRail.jsx";

// --- Palette (mirrors index.css console tokens) ---
const C = {
  ink: "#0e1726",
  accent: "#0e8c8c",
  amber: "#f2a413",
  red: "#e5484d",
  slate: "#94a3b8",
  grid: "#e8ecf3",
};

// --- Helpers ---
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);

const getDateLabel = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// --- Section eyebrow ---
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-4 pt-2 pb-1">
    <h2 className="console-eyebrow shrink-0">{children}</h2>
    <Separator className="flex-1 bg-slate-200/70" />
  </div>
);

// --- Chart tooltip ---
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="num mb-1.5 text-xs font-bold text-slate-500">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium text-slate-600">{entry.name}:</span>
          <span className="num font-bold text-slate-900">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const chartAxis = {
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  stroke: C.slate,
};

// --- Fuel variance chart ---
const FuelVarianceChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader className="p-4 pb-1.5">
        <CardTitle className="text-[15px]">Fuel Efficiency Variance</CardTitle>
        <CardDescription>Daily km/l vs expected baseline</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-2 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
              <XAxis dataKey="date" {...chartAxis} tickFormatter={getDateLabel} />
              <YAxis {...chartAxis} />
              <Tooltip
                content={<CustomTooltip formatter={(v) => v.toFixed(2) + " km/l"} labelFormatter={getDateLabel} />}
              />
              <Line
                type="monotone"
                dataKey="averageVariance"
                name="Avg variance"
                stroke={C.accent}
                strokeWidth={2.5}
                dot={{ r: 3, fill: C.accent, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Outlier chart ---
const OutlierChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader className="p-4 pb-1.5">
        <CardTitle className="text-[15px]">Daily Outliers</CardTitle>
        <CardDescription>Abnormal fuel-consumption days</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-2 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
              <XAxis dataKey="date" {...chartAxis} tickFormatter={getDateLabel} />
              <YAxis {...chartAxis} />
              <Tooltip content={<CustomTooltip labelFormatter={getDateLabel} />} />
              <Bar dataKey="outlierCount" name="Outliers" fill={C.red} radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Financial chart ---
const FinancialChart = ({ data }) => {
  if (!data?.dailyTrend?.length) return null;
  return (
    <div className="mt-2 h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.dailyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
          <XAxis dataKey="date" {...chartAxis} tickFormatter={getDateLabel} />
          <YAxis {...chartAxis} />
          <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} labelFormatter={getDateLabel} />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569" }} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke={C.red} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke={C.amber} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Driver card ---
const DriverCard = ({ driver, label, variant = "top" }) => {
  if (!driver) return null;
  const isTop = variant === "top";
  const ratingColor = driver.rating >= 4 ? C.accent : driver.rating >= 3 ? C.amber : C.red;
  return (
    <Card>
      <CardHeader className="p-4 pb-1.5">
        <div className="flex items-center gap-2">
          {isTop ? <Trophy size={17} style={{ color: C.amber }} /> : <TrendingDown size={17} style={{ color: C.red }} />}
          <CardTitle className="text-[15px]">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-1 flex items-center gap-4">
          <Avatar size="lg" className="border-2 border-white shadow-sm">
            <AvatarFallback
              className="font-bold"
              style={{
                background: `color-mix(in srgb, ${isTop ? C.accent : C.red} 14%, transparent)`,
                color: isTop ? C.accent : C.red,
              }}
            >
              {getInitials(driver.driverName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold" style={{ color: C.ink }}>
              {driver.driverName}
            </p>
            {driver.mobileNumber && <p className="num text-[11px] font-medium text-slate-500">{driver.mobileNumber}</p>}
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Badge variant="secondary" className="num bg-slate-100 text-[10px] font-bold text-slate-600">
                {driver.tripCount || 0} trips
              </Badge>
              <Badge variant="secondary" className="num bg-slate-100 text-[10px] font-bold text-slate-600">
                {formatNumber(driver.totalFuelLitres || 0)} L
              </Badge>
            </div>
          </div>
          <div className="num flex items-center gap-1 text-lg font-extrabold" style={{ color: ratingColor }}>
            <Star size={18} fill="currentColor" />
            {(driver.rating || 0).toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Underperforming drivers ---
const UnderperformingList = ({ drivers }) => {
  if (!drivers?.length || !drivers[0]?.driverName) return null;
  return (
    <Card>
      <CardHeader className="p-4 pb-1.5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={17} style={{ color: C.red }} />
          <CardTitle className="text-[15px]">Underperforming Drivers</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-1 space-y-2">
          {drivers.map((driver) => (
            <div
              key={driver.driverId || driver.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 transition-colors hover:bg-slate-100"
            >
              <Avatar className="h-9 w-9 shadow-sm">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: `color-mix(in srgb, ${C.red} 14%, transparent)`, color: C.red }}
                >
                  {getInitials(driver.driverName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: C.ink }}>
                  {driver.driverName}
                </p>
                {driver.mobileNumber && <p className="num text-[11px] font-medium text-slate-500">{driver.mobileNumber}</p>}
              </div>
              <div
                className="num flex items-center gap-1 text-sm font-extrabold"
                style={{ color: driver.rating >= 3 ? C.amber : C.red }}
              >
                <Star size={14} fill="currentColor" />
                {(driver.rating || 0).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Skeleton ---
const DashboardSkeleton = () => (
  <div className="min-h-screen w-full space-y-6 p-3 sm:p-5">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-56 bg-slate-200" />
        <Skeleton className="mt-2 h-4 w-72 bg-slate-200" />
      </div>
      <Skeleton className="h-9 w-64 rounded-xl bg-slate-200" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skeleton className="h-[520px] rounded-2xl bg-slate-200 lg:col-span-2" />
      <Skeleton className="h-[520px] rounded-2xl bg-slate-200" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl bg-slate-200" />
      ))}
    </div>
  </div>
);

// --- Main ---
const OverviewPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [driverLocations, setDriverLocations] = useState([]);
  const [exceptions, setExceptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [customDateRange, setCustomDateRange] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedOnce = React.useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!hasLoadedOnce.current) setIsLoading(true);
      else setIsFetching(true);
      setError(null);
      try {
        let params = {};
        if (customDateRange?.start && customDateRange?.end) {
          params.startDate = new Date(customDateRange.start).toISOString();
          params.endDate = new Date(customDateRange.end).toISOString();
        } else {
          params.days = selectedDays;
        }

        const [summary, fuel, drivers, fin, liveLocations, exc] = await Promise.all([
          OverviewService.getDashboardSummary(params),
          OverviewService.getFuelAnalytics(params),
          OverviewService.getDriverPerformance(params),
          OverviewService.getFinancials(params),
          OverviewService.getDriverLocations().catch(() => []),
          OverviewService.getExceptions(params).catch(() => null),
        ]);

        setSummaryData(summary?.summaryCards);
        setFuelAnalytics(fuel);
        setDriverPerformance(drivers);
        setFinancials(fin);
        setDriverLocations(liveLocations);
        setExceptions(exc);
        setLastUpdated(new Date());
        hasLoadedOnce.current = true;
      } catch (err) {
        setError(err.detail || "Could not load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    };
    fetchData();
  }, [selectedDays, customDateRange]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 text-center font-sans">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 shadow-sm">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <p className="text-xl font-bold" style={{ color: C.ink }}>
          Something went wrong
        </p>
        <p className="max-w-md text-sm font-medium text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: C.accent }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const vehicles = summaryData?.vehicles;
  const drivers = summaryData?.drivers;
  const trips = summaryData?.trips;
  const kilometers = summaryData?.kilometers;
  const fuel = summaryData?.fuel;
  const fuelSummary = fuelAnalytics?.summary;
  const finSummary = financials?.summary;

  return (
    <div
      className={`min-h-screen w-full space-y-6 p-3 font-sans antialiased text-slate-900 transition-opacity duration-300 sm:p-5 ${
        isFetching ? "pointer-events-none opacity-60" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Fleet Operations</h1>
          <p>
            Live positions and the refuel-log exceptions that need you
            {lastUpdated && (
              <>
                {" · "}
                <span className="num" style={{ color: C.accent }}>
                  as of {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Day-range segmented control */}
        {(() => {
          const OPTIONS = [
            { value: 7, label: "7D" },
            { value: 14, label: "14D" },
            { value: 30, label: "30D" },
            { value: 90, label: "90D" },
          ];
          const idx = OPTIONS.findIndex((o) => o.value === selectedDays);
          const pillWidth = 100 / OPTIONS.length;
          return (
            <div className="flex items-center gap-2.5">
              <CalendarDays size={16} strokeWidth={2.5} className="shrink-0 text-slate-400" />
              <div
                className="relative flex items-center rounded-xl border border-slate-200 bg-slate-200/60 p-[3px] shadow-inner"
                style={{ minWidth: 240 }}
              >
                <span
                  aria-hidden="true"
                  className="absolute bottom-[3px] top-[3px] rounded-[9px] border border-slate-200/60 bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.26,0.64,1)]"
                  style={{
                    width: `calc(${pillWidth}% - 1.5px)`,
                    transform: `translateX(calc(${idx * 100}% + ${idx * 1.5}px))`,
                  }}
                />
                {OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedDays(option.value);
                      setCustomDateRange(null);
                    }}
                    className="num relative z-10 flex-1 select-none rounded-[9px] py-1.5 text-xs font-bold transition-colors duration-200"
                    style={{ color: selectedDays === option.value ? C.accent : "#64748b" }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 1. Hero: Live map + Exceptions rail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FleetMap locations={driverLocations} />
        </div>
        <div>
          <ExceptionsRail data={exceptions} loading={false} error={exceptions === null} />
        </div>
      </div>

      {/* 2. Fleet KPIs */}
      {vehicles && (
        <>
          <SectionLabel>Fleet Overview</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Vehicles"
              value={formatNumber(vehicles.total || 0)}
              sub={`${formatNumber(vehicles.active || 0)} active · ${formatNumber(vehicles.onTrip || 0)} on trip`}
              icon={<Truck size={18} />}
            />
            <StatCard
              label="Drivers"
              value={formatNumber(drivers?.total || 0)}
              sub={`${formatNumber(drivers?.active || 0)} active`}
              icon={<Users size={18} />}
            />
            <StatCard
              label="Trips"
              value={formatNumber(trips?.total || 0)}
              sub={`${formatNumber(trips?.completed || 0)} done · ${formatNumber(trips?.ongoing || 0)} ongoing`}
              icon={<Activity size={18} />}
            />
            <StatCard
              label="Distance"
              value={`${formatNumber(kilometers?.total || 0)} km`}
              icon={<Map size={18} />}
            />
          </div>
        </>
      )}

      {/* 3. Fuel analytics */}
      {fuel && (fuel.totalLitres > 0 || fuel.totalCost > 0) && (
        <>
          <SectionLabel>Fuel Analytics</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Fuel Consumed"
              value={`${formatNumber(fuel.totalLitres || 0)} L`}
              sub={`Cost ${formatCurrency(fuel.totalCost || 0)}`}
              icon={<Fuel size={18} />}
            />
            <StatCard
              label="Avg Efficiency"
              value={`${(fuel.avgKmpl || 0).toFixed(2)} km/l`}
              sub="Fleet-wide"
              icon={<TrendingUp size={18} />}
            />
            {fuelSummary && (
              <>
                <StatCard
                  label="Avg Variance"
                  value={`${(fuelSummary.averageVariance || 0).toFixed(2)} km/l`}
                  sub={`Fleet ${(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)}`}
                  icon={<TrendingUp size={18} />}
                />
                <StatCard
                  label="Outliers"
                  value={formatNumber(fuelSummary.outlierCount || 0)}
                  sub={`of ${formatNumber(fuelSummary.totalTrips || 0)} trips`}
                  icon={<AlertTriangle size={18} />}
                />
              </>
            )}
          </div>
          {(fuelAnalytics?.dailyVariance?.length > 0 || fuelAnalytics?.dailyOutliers?.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FuelVarianceChart data={fuelAnalytics.dailyVariance} />
              <OutlierChart data={fuelAnalytics.dailyOutliers} />
            </div>
          )}
        </>
      )}

      {/* 4. Financial overview */}
      {finSummary && (finSummary.totalRevenue > 0 || finSummary.totalExpenses > 0) && (
        <>
          <SectionLabel>Financial Overview</SectionLabel>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="console-eyebrow">Revenue</p>
                  <p className="num mt-2 text-2xl font-semibold" style={{ color: C.accent }}>
                    {formatCurrency(finSummary.totalRevenue || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="console-eyebrow">Expenses</p>
                  <p className="num mt-2 text-2xl font-semibold" style={{ color: C.red }}>
                    {formatCurrency(finSummary.totalExpenses || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="console-eyebrow">Net Profit</p>
                  <p
                    className="num mt-2 text-2xl font-semibold"
                    style={{ color: (finSummary.netProfit || 0) >= 0 ? C.accent : C.red }}
                  >
                    {formatCurrency(finSummary.netProfit || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="console-eyebrow">Margin</p>
                  <p className="num mt-2 text-2xl font-semibold" style={{ color: C.amber }}>
                    {(finSummary.profitMargin || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              {financials?.dailyTrend?.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="font-display mb-2 text-sm font-semibold" style={{ color: C.ink }}>
                    Daily Revenue Trend
                  </h3>
                  <FinancialChart data={financials} />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 5. Driver performance */}
      {driverPerformance && (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating !== undefined) && (
        <>
          <SectionLabel>Driver Performance</SectionLabel>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {driverPerformance.topPerformingDriver ? (
              <DriverCard driver={driverPerformance.topPerformingDriver} label="Top Performing Driver" variant="top" />
            ) : (
              <Card>
                <CardHeader className="p-4 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Trophy size={17} style={{ color: C.amber }} />
                    <CardTitle className="text-[15px]">Top Performing Driver</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
                    >
                      <Trophy size={22} />
                    </span>
                    <p className="text-sm font-semibold" style={{ color: C.ink }}>
                      Awaiting data
                    </p>
                    <p className="max-w-[200px] text-xs font-medium text-slate-400">
                      Driver rankings appear once trips are completed in this period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {driverPerformance.averageDriverRating !== undefined && (
              <Card>
                <CardHeader className="p-4 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Star size={17} style={{ color: C.accent }} />
                    <CardTitle className="text-[15px]">Average Rating</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span
                      className="num text-6xl font-extrabold tracking-tighter"
                      style={{
                        color:
                          driverPerformance.averageDriverRating >= 4
                            ? C.accent
                            : driverPerformance.averageDriverRating >= 3
                            ? C.amber
                            : C.red,
                      }}
                    >
                      {(driverPerformance.averageDriverRating || 0).toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={20}
                          fill={s <= Math.round(driverPerformance.averageDriverRating) ? "currentColor" : "none"}
                          style={{ color: s <= Math.round(driverPerformance.averageDriverRating) ? C.amber : "#e2e8f0" }}
                        />
                      ))}
                    </div>
                    <p className="console-eyebrow mt-1">
                      out of 5 · {formatNumber(driverPerformance.totalDrivers || 0)} drivers
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {driverPerformance.underperformingDrivers?.length > 0 && driverPerformance.underperformingDrivers[0]?.driverName ? (
              <UnderperformingList drivers={driverPerformance.underperformingDrivers} />
            ) : (
              <Card>
                <CardHeader className="p-4 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Users size={17} style={{ color: C.accent }} />
                    <CardTitle className="text-[15px]">Total Drivers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="num text-6xl font-extrabold tracking-tighter" style={{ color: C.accent }}>
                      {formatNumber(driverPerformance.totalDrivers || 0)}
                    </span>
                    <p className="console-eyebrow mt-1">active drivers in fleet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewPage;
