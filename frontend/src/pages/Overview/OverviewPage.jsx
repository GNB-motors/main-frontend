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
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Navigation,
  WifiOff,
} from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OverviewService } from "./OverviewService.jsx";

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
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

const getDateLabel = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// --- Shared Card Style ---
const cardHoverClass = "bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 rounded-xl";

// --- KPI Stat Card ---
const StatCard = ({ title, value, subtext, icon, trend, iconBg, iconColor }) => (
  <Card className={`relative overflow-hidden hover:-translate-y-1 ${cardHoverClass}`}>
    <CardContent className="flex items-center gap-4 p-3">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105"
        style={{ backgroundColor: iconBg || "#EFF6FF", color: iconColor || "#3B82F6" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        {subtext && <p className="mt-0.5 text-xs font-medium text-slate-400">{subtext}</p>}
      </div>
      {trend && (
        <div className={`flex flex-col items-center gap-0.5 text-xs font-bold ${trend.direction === "up" ? "text-emerald-600" : "text-red-500"}`}>
          {trend.direction === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{trend.value}%</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// --- Chart Tooltip ---
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-100 bg-white/95 backdrop-blur-sm p-3 shadow-xl">
      <p className="mb-1.5 text-xs font-bold text-slate-500">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 font-medium">{entry.name}:</span>
          <span className="font-bold text-slate-900">{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Fuel Variance Chart ---
const FuelVarianceChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Card className={cardHoverClass}>
      <CardHeader className="p-3 pb-1.5">
        <CardTitle className="text-[15px] font-bold text-slate-800">Fuel Consumption Variance</CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500">Daily fuel efficiency variance (km/l)</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-[300px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="#94a3b8" />
              <YAxis fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip formatter={(v) => v.toFixed(2) + " km/l"} labelFormatter={getDateLabel} />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }} />
              <Line type="monotone" dataKey="averageVariance" name="Avg. Variance" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Outlier Chart ---
const OutlierChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Card className={cardHoverClass}>
      <CardHeader className="p-3 pb-1.5">
        <CardTitle className="text-[15px] font-bold text-slate-800">Daily Outliers</CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500">Abnormal fuel consumption days</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-[300px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="#94a3b8" />
              <YAxis fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip labelFormatter={getDateLabel} />} />
              <Bar dataKey="outlierCount" name="Outlier Count" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Financial Chart ---
const FinancialChart = ({ data }) => {
  if (!data?.dailyTrend?.length) return null;
  return (
    <div className="h-[280px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.dailyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={getDateLabel} stroke="#94a3b8" />
          <YAxis fontSize={11} fontWeight={500} tickLine={false} axisLine={false} stroke="#94a3b8" />
          <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} labelFormatter={getDateLabel} />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke="#F59E0B" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
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
    <Card className={cardHoverClass}>
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-center gap-2">
          {isTop ? <Trophy size={18} className="text-amber-500" /> : <TrendingDown size={18} className="text-red-500" />}
          <CardTitle className="text-[15px] font-bold text-slate-800">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-4 mt-1">
          <Avatar size="lg" className="border-2 border-white shadow-sm">
            <AvatarFallback className={isTop ? "bg-blue-100 text-blue-700 font-bold" : "bg-red-100 text-red-700 font-bold"}>
              {getInitials(driver.driverName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-slate-900 truncate">{driver.driverName}</p>
            {driver.mobileNumber && <p className="text-[11px] font-medium text-slate-500">{driver.mobileNumber}</p>}
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                {driver.tripCount || 0} trips
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                {formatNumber(driver.totalFuelLitres || 0)} L
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-lg font-extrabold" style={{ color: driver.rating >= 4 ? "#10B981" : driver.rating >= 3 ? "#F59E0B" : "#EF4444" }}>
            <Star size={18} fill="currentColor" />
            {(driver.rating || 0).toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Underperforming Drivers ---
const UnderperformingList = ({ drivers }) => {
  if (!drivers?.length || !drivers[0]?.driverName) return null;
  return (
    <Card className={cardHoverClass}>
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <CardTitle className="text-[15px] font-bold text-slate-800">Underperforming Drivers</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2 mt-1">
          {drivers.map((driver) => (
            <div key={driver.driverId || driver.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-100">
              <Avatar className="h-9 w-9 shadow-sm">
                <AvatarFallback className="bg-red-100 text-red-700 text-xs font-bold">
                  {getInitials(driver.driverName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{driver.driverName}</p>
                {driver.mobileNumber && <p className="text-[11px] font-medium text-slate-500">{driver.mobileNumber}</p>}
              </div>
              <div className="flex items-center gap-1 text-sm font-extrabold" style={{ color: driver.rating >= 3 ? "#F59E0B" : "#EF4444" }}>
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

// --- Driver Live Location Map ---
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "450px", borderRadius: "0.75rem" };
const STALE_THRESHOLD_MS = 15 * 60 * 1000;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const isStale = (updatedAt) => Date.now() - new Date(updatedAt).getTime() > STALE_THRESHOLD_MS;

const getDriverName = (loc) => {
  const d = loc.driverId;
  if (!d) return "Unknown Driver";
  if (typeof d === "string") return d;
  return [d.firstName, d.lastName].filter(Boolean).join(" ") || "Unknown Driver";
};

const DriverLiveMap = ({ locations }) => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const activeLocations = (locations || []).filter((loc) => loc.locationPermission && loc.latitude != null && loc.longitude != null);
  const offlineCount = (locations || []).filter((l) => !l.locationPermission || l.latitude == null).length;
  const onlineCount = activeLocations.filter((l) => !isStale(l.updatedAt)).length;
  const staleCount = activeLocations.filter((l) => isStale(l.updatedAt)).length;

  return (
    <Card className={cardHoverClass}>
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Navigation size={18} className="text-blue-500" />
            <CardTitle className="text-[15px] font-bold text-slate-800">Driver Live Locations</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-sm" /> Online ({onlineCount})</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400 shadow-sm" /> Stale ({staleCount})</span>
            <span className="flex items-center gap-1"><WifiOff size={12} /> Offline ({offlineCount})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {!isLoaded ? (
          <Skeleton className="h-[450px] w-full rounded-xl bg-slate-200/50" />
        ) : activeLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Navigation size={48} className="opacity-40" />
            <p className="text-sm font-medium">No drivers are sharing their location right now</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner">
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={activeLocations.length === 1 ? { lat: activeLocations[0].latitude, lng: activeLocations[0].longitude } : INDIA_CENTER}
              zoom={activeLocations.length === 1 ? 12 : 5}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
            >
              {activeLocations.map((loc) => {
                const stale = isStale(loc.updatedAt);
                const name = getDriverName(loc);
                const driverId = loc.driverId?._id || loc.driverId || loc._id;
                return (
                  <MarkerF
                    key={driverId}
                    position={{ lat: loc.latitude, lng: loc.longitude }}
                    title={name}
                    icon={{
                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                            <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${stale ? '#F59E0B' : '#10B981'}"/>
                            <circle cx="16" cy="14" r="6" fill="white"/>
                          </svg>`
                      )}`,
                      scaledSize: typeof window !== "undefined" && window.google ? new window.google.maps.Size(32, 40) : undefined,
                    }}
                    onClick={() => setSelectedDriver(loc)}
                  />
                );
              })}
              {selectedDriver && (
                <InfoWindowF
                  position={{ lat: selectedDriver.latitude, lng: selectedDriver.longitude }}
                  onCloseClick={() => setSelectedDriver(null)}
                >
                  <div style={{ padding: "4px 2px", minWidth: 160, fontFamily: "system-ui, sans-serif" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, margin: 0, color: "#0f172a" }}>
                      {getDriverName(selectedDriver)}
                    </p>
                    {selectedDriver.driverId?.mobileNumber && (
                      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, margin: "4px 0", fontWeight: 500 }}>
                        {selectedDriver.driverId.mobileNumber}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0", fontWeight: 500 }}>
                      {"🕐 "}{new Date(selectedDriver.updatedAt).toLocaleString("en-IN")}
                    </p>
                    {isStale(selectedDriver.updatedAt) && (
                      <p style={{ fontSize: 11, color: "#d97706", margin: "4px 0 0 0", fontWeight: 600 }}>
                        ⚠ Location may be stale
                      </p>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Skeleton Loader ---
const DashboardSkeleton = () => (
  <div className="w-full min-h-screen bg-slate-50 p-3 sm:p-5 space-y-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <Skeleton className="h-8 w-52 bg-slate-200" />
        <Skeleton className="mt-2 h-4 w-72 bg-slate-200" />
      </div>
      <Skeleton className="h-9 w-64 rounded-lg bg-slate-200" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-slate-100 shadow-sm rounded-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20 bg-slate-200" />
              <Skeleton className="h-7 w-24 bg-slate-200" />
              <Skeleton className="h-3 w-32 bg-slate-200" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border-slate-100 shadow-sm rounded-xl"><CardContent className="p-4"><Skeleton className="h-[300px] w-full rounded-xl bg-slate-200" /></CardContent></Card>
      <Card className="border-slate-100 shadow-sm rounded-xl"><CardContent className="p-4"><Skeleton className="h-[300px] w-full rounded-xl bg-slate-200" /></CardContent></Card>
    </div>
  </div>
);

// --- Main Component ---
const OverviewPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [driverLocations, setDriverLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [customDateRange, setCustomDateRange] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let params = {};
        if (customDateRange?.start && customDateRange?.end) {
          params.startDate = new Date(customDateRange.start).toISOString();
          params.endDate = new Date(customDateRange.end).toISOString();
        } else {
          params.days = selectedDays;
        }

        const [summary, fuel, drivers, fin, liveLocations] = await Promise.all([
          OverviewService.getDashboardSummary(params),
          OverviewService.getFuelAnalytics(params),
          OverviewService.getDriverPerformance(params),
          OverviewService.getFinancials(params),
          OverviewService.getDriverLocations().catch(() => []),
        ]);

        setSummaryData(summary?.summaryCards);
        setFuelAnalytics(fuel);
        setDriverPerformance(drivers);
        setFinancials(fin);
        setDriverLocations(liveLocations);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.detail || "Could not load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDays, customDateRange]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 text-center bg-slate-50 font-sans">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 shadow-sm">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <p className="text-xl font-bold text-slate-800">Something went wrong</p>
        <p className="max-w-md text-sm font-medium text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
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
    /* The magic wrapper that makes the background unified and typography crisp */
    <div className="min-h-screen w-full bg-slate-50 p-3 sm:p-5 space-y-6 font-sans antialiased text-slate-900">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Complete fleet analytics and performance metrics</p>
        </div>

        {/* Modern SaaS-style Segmented Timeframe Selector */}
        <div className="flex items-center p-1 bg-slate-200/50 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-center px-3 text-slate-400 border-r border-slate-300/50">
            <CalendarDays size={18} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1 pl-1">
            {[
              { value: 7, label: "7 Days" },
              { value: 14, label: "14 Days" },
              { value: 30, label: "30 Days" },
              { value: 90, label: "90 Days" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedDays(option.value);
                  setCustomDateRange(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${selectedDays === option.value
                    ? "bg-white text-indigo-600 shadow-md border border-slate-200/50 scale-105"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-300/40"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Fleet KPI Cards */}
      {vehicles && (
        <>
          <div className="flex items-center gap-4 pt-4 pb-1">
            <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Fleet Overview</h2>
            <Separator className="flex-1 bg-slate-200/60" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Vehicles" value={formatNumber(vehicles.total || 0)} subtext={`${formatNumber(vehicles.active || 0)} active · ${formatNumber(vehicles.onTrip || 0)} on trip`} icon={<Truck size={22} />} iconBg="#DBEAFE" iconColor="#2563EB" />
            <StatCard title="Total Drivers" value={formatNumber(drivers?.total || 0)} subtext={`${formatNumber(drivers?.active || 0)} active`} icon={<Users size={22} />} iconBg="#D1FAE5" iconColor="#059669" />
            <StatCard title="Total Trips" value={formatNumber(trips?.total || 0)} subtext={`${formatNumber(trips?.completed || 0)} completed · ${formatNumber(trips?.ongoing || 0)} ongoing`} icon={<Activity size={22} />} iconBg="#FEF3C7" iconColor="#D97706" />
            <StatCard title="Distance Covered" value={`${formatNumber(kilometers?.total || 0)} km`} icon={<Map size={22} />} iconBg="#FCE7F3" iconColor="#DB2777" />
          </div>
        </>
      )}

      {/* 2. Fuel Analytics */}
      {fuel && (fuel.totalLitres > 0 || fuel.totalCost > 0) && (
        <>
          <div className="flex items-center gap-4 pt-6 pb-1">
            <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Fuel Analytics</h2>
            <Separator className="flex-1 bg-slate-200/60" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Fuel Consumed" value={`${formatNumber(fuel.totalLitres || 0)} L`} subtext={`Cost: ${formatCurrency(fuel.totalCost || 0)}`} icon={<Fuel size={22} />} iconBg="#DBEAFE" iconColor="#2563EB" />
            <StatCard title="Fleet Avg Efficiency" value={`${(fuel.avgKmpl || 0).toFixed(2)} km/l`} subtext="Overall fuel efficiency" icon={<TrendingUp size={22} />} iconBg="#D1FAE5" iconColor="#059669" />
            {fuelSummary && (
              <>
                <StatCard title="Avg Variance" value={`${(fuelSummary.averageVariance || 0).toFixed(2)} km/l`} subtext={`Fleet avg: ${(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)}`} icon={<TrendingUp size={22} />} iconBg="#FEF3C7" iconColor="#D97706" />
                <StatCard title="Outliers Detected" value={formatNumber(fuelSummary.outlierCount || 0)} subtext={`Out of ${formatNumber(fuelSummary.totalTrips || 0)} trips`} icon={<AlertTriangle size={22} />} iconBg="#FEE2E2" iconColor="#DC2626" />
              </>
            )}
          </div>
          {(fuelAnalytics?.dailyVariance?.length > 0 || fuelAnalytics?.dailyOutliers?.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-2">
              <FuelVarianceChart data={fuelAnalytics.dailyVariance} />
              <OutlierChart data={fuelAnalytics.dailyOutliers} />
            </div>
          )}
        </>
      )}

      {/* 3. Financial Overview */}
      {finSummary && (finSummary.totalRevenue > 0 || finSummary.totalExpenses > 0) && (
        <>
          <div className="flex items-center gap-4 pt-6 pb-1">
            <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Financial Overview</h2>
            <Separator className="flex-1 bg-slate-200/60" />
          </div>
          <Card className={cardHoverClass}>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600/70">Total Revenue</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600">{formatCurrency(finSummary.totalRevenue || 0)}</p>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm transition-all hover:bg-red-50 hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-600/70">Total Expenses</p>
                  <p className="mt-1 text-2xl font-extrabold text-red-600">{formatCurrency(finSummary.totalExpenses || 0)}</p>
                </div>
                <div className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${(finSummary.netProfit || 0) >= 0 ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50" : "border-red-100 bg-red-50/50 hover:bg-red-50"}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${(finSummary.netProfit || 0) >= 0 ? "text-emerald-600/70" : "text-red-600/70"}`}>Net Profit</p>
                  <p className={`mt-1 text-2xl font-extrabold ${(finSummary.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(finSummary.netProfit || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm transition-all hover:bg-amber-50 hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600/70">Profit Margin</p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-600">{(finSummary.profitMargin || 0).toFixed(2)}%</p>
                </div>
              </div>
              {financials?.dailyTrend?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h3 className="mb-4 text-sm font-bold text-slate-800">Daily Revenue Trend</h3>
                  <FinancialChart data={financials} />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 4. Driver Live Tracking Map */}
      <div className="flex items-center gap-4 pt-6 pb-1">
        <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Driver Live Tracking</h2>
        <Separator className="flex-1 bg-slate-200/60" />
      </div>
      <DriverLiveMap locations={driverLocations} />

      {/* 5. Driver Performance */}
      {driverPerformance && (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating !== undefined) && (
        <>
          <div className="flex items-center gap-4 pt-6 pb-1">
            <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Driver Performance</h2>
            <Separator className="flex-1 bg-slate-200/60" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {driverPerformance.topPerformingDriver && <DriverCard driver={driverPerformance.topPerformingDriver} label="Top Performing Driver" variant="top" />}

            {driverPerformance.averageDriverRating !== undefined && (
              <Card className={cardHoverClass}>
                <CardHeader className="p-3 pb-1.5 border-b border-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-blue-500" />
                    <CardTitle className="text-[15px] font-bold text-slate-800">Average Rating</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-6xl font-extrabold tracking-tighter" style={{ color: driverPerformance.averageDriverRating >= 4 ? "#10B981" : driverPerformance.averageDriverRating >= 3 ? "#F59E0B" : "#EF4444" }}>
                      {(driverPerformance.averageDriverRating || 0).toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={20} fill={s <= Math.round(driverPerformance.averageDriverRating) ? "currentColor" : "none"} className={s <= Math.round(driverPerformance.averageDriverRating) ? "text-amber-400 drop-shadow-sm" : "text-slate-200"} />
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">out of 5 ({formatNumber(driverPerformance.totalDrivers || 0)} drivers)</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {driverPerformance.underperformingDrivers?.length > 0 && driverPerformance.underperformingDrivers[0]?.driverName ? (
              <UnderperformingList drivers={driverPerformance.underperformingDrivers} />
            ) : (
              <Card className={cardHoverClass}>
                <CardHeader className="p-3 pb-1.5 border-b border-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    <CardTitle className="text-[15px] font-bold text-slate-800">Total Drivers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-6xl font-extrabold tracking-tighter text-emerald-500">{formatNumber(driverPerformance.totalDrivers || 0)}</span>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">active drivers in fleet</p>
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