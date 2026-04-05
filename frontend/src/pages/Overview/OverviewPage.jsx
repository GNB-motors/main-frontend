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
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// --- KPI Stat Card ---
const StatCard = ({ title, value, subtext, icon, trend, iconBg, iconColor }) => (
  <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
    <CardContent className="flex items-center gap-4 p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg || "#EFF6FF", color: iconColor || "#3B82F6" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {subtext && <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>}
      </div>
      {trend && (
        <div className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${trend.direction === "up" ? "text-emerald-600" : "text-red-500"}`}>
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
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Fuel Variance Chart ---
const FuelVarianceChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Consumption Variance</CardTitle>
        <CardDescription>Daily fuel efficiency variance (km/l)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                content={<CustomTooltip formatter={(v) => v.toFixed(2) + " km/l"} labelFormatter={getDateLabel} />}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageVariance"
                name="Avg. Variance"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3B82F6" }}
                activeDot={{ r: 5 }}
              />
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
    <Card>
      <CardHeader>
        <CardTitle>Daily Outliers</CardTitle>
        <CardDescription>Abnormal fuel consumption days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                content={<CustomTooltip labelFormatter={getDateLabel} />}
              />
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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.dailyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getDateLabel} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            content={<CustomTooltip formatter={(v) => formatCurrency(v)} labelFormatter={getDateLabel} />}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke="#F59E0B" strokeWidth={2} dot={false} />
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isTop ? (
            <Trophy size={18} className="text-amber-500" />
          ) : (
            <TrendingDown size={18} className="text-red-500" />
          )}
          <CardTitle>{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback className={isTop ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
              {getInitials(driver.driverName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{driver.driverName}</p>
            {driver.mobileNumber && (
              <p className="text-xs text-muted-foreground">{driver.mobileNumber}</p>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {driver.tripCount || 0} trips
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatNumber(driver.totalFuelLitres || 0)} L
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-lg font-bold" style={{ color: driver.rating >= 4 ? "#10B981" : driver.rating >= 3 ? "#F59E0B" : "#EF4444" }}>
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <CardTitle>Underperforming Drivers</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drivers.map((driver) => (
            <div key={driver.driverId || driver.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar>
                <AvatarFallback className="bg-red-100 text-red-700 text-xs">
                  {getInitials(driver.driverName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{driver.driverName}</p>
                {driver.mobileNumber && (
                  <p className="text-xs text-muted-foreground">{driver.mobileNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm font-bold" style={{ color: driver.rating >= 3 ? "#F59E0B" : "#EF4444" }}>
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

// --- Skeleton Loader ---
const DashboardSkeleton = () => (
  <div className="space-y-6 p-1">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-36 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-5">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full rounded-lg" /></CardContent></Card>
      <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full rounded-lg" /></CardContent></Card>
    </div>
  </div>
);

// --- Main Component ---
const OverviewPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);
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
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.detail || "Could not load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDays, customDateRange]);

  if (isLoading) return <div className="p-2"><DashboardSkeleton /></div>;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <p className="text-lg font-medium text-foreground">Something went wrong</p>
        <p className="max-w-md text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Complete fleet analytics and performance metrics</p>
        </div>
        <Select value={String(selectedDays)} onValueChange={(v) => { setSelectedDays(Number(v)); setCustomDateRange(null); }}>
          <SelectTrigger className="w-40">
            <CalendarDays size={14} className="mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fleet KPI Cards */}
      {vehicles && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fleet Overview</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Vehicles"
              value={formatNumber(vehicles.total || 0)}
              subtext={`${formatNumber(vehicles.active || 0)} active · ${formatNumber(vehicles.onTrip || 0)} on trip`}
              icon={<Truck size={22} />}
              iconBg="#DBEAFE" iconColor="#2563EB"
            />
            <StatCard
              title="Total Drivers"
              value={formatNumber(drivers?.total || 0)}
              subtext={`${formatNumber(drivers?.active || 0)} active`}
              icon={<Users size={22} />}
              iconBg="#D1FAE5" iconColor="#059669"
            />
            <StatCard
              title="Total Trips"
              value={formatNumber(trips?.total || 0)}
              subtext={`${formatNumber(trips?.completed || 0)} completed · ${formatNumber(trips?.ongoing || 0)} ongoing`}
              icon={<Activity size={22} />}
              iconBg="#FEF3C7" iconColor="#D97706"
            />
            <StatCard
              title="Distance Covered"
              value={`${formatNumber(kilometers?.total || 0)} km`}
              icon={<Map size={22} />}
              iconBg="#FCE7F3" iconColor="#DB2777"
            />
          </div>
        </>
      )}

      {/* Fuel Analytics */}
      {fuel && (fuel.totalLitres > 0 || fuel.totalCost > 0) && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fuel Analytics</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Fuel Consumed"
              value={`${formatNumber(fuel.totalLitres || 0)} L`}
              subtext={`Cost: ${formatCurrency(fuel.totalCost || 0)}`}
              icon={<Fuel size={22} />}
              iconBg="#DBEAFE" iconColor="#2563EB"
            />
            <StatCard
              title="Fleet Avg Efficiency"
              value={`${(fuel.avgKmpl || 0).toFixed(2)} km/l`}
              subtext="Overall fuel efficiency"
              icon={<TrendingUp size={22} />}
              iconBg="#D1FAE5" iconColor="#059669"
            />
            {fuelSummary && (
              <>
                <StatCard
                  title="Avg Variance"
                  value={`${(fuelSummary.averageVariance || 0).toFixed(2)} km/l`}
                  subtext={`Fleet avg: ${(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)}`}
                  icon={<TrendingUp size={22} />}
                  iconBg="#FEF3C7" iconColor="#D97706"
                />
                <StatCard
                  title="Outliers Detected"
                  value={formatNumber(fuelSummary.outlierCount || 0)}
                  subtext={`Out of ${formatNumber(fuelSummary.totalTrips || 0)} trips`}
                  icon={<AlertTriangle size={22} />}
                  iconBg="#FEE2E2" iconColor="#DC2626"
                />
              </>
            )}
          </div>

          {/* Fuel Charts */}
          {(fuelAnalytics?.dailyVariance?.length > 0 || fuelAnalytics?.dailyOutliers?.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FuelVarianceChart data={fuelAnalytics.dailyVariance} />
              <OutlierChart data={fuelAnalytics.dailyOutliers} />
            </div>
          )}
        </>
      )}

      {/* Financial Overview */}
      {finSummary && (finSummary.totalRevenue > 0 || finSummary.totalExpenses > 0) && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Financial Overview</h2>
            <Separator className="flex-1" />
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(finSummary.totalRevenue || 0)}</p>
                </div>
                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Expenses</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(finSummary.totalExpenses || 0)}</p>
                </div>
                <div className={`rounded-lg border-l-4 p-4 ${(finSummary.netProfit || 0) >= 0 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net Profit</p>
                  <p className={`mt-1 text-2xl font-bold ${(finSummary.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(finSummary.netProfit || 0)}
                  </p>
                </div>
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profit Margin</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{(finSummary.profitMargin || 0).toFixed(2)}%</p>
                </div>
              </div>
              {financials?.dailyTrend?.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Daily Revenue Trend</h3>
                  <FinancialChart data={financials} />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Driver Performance */}
      {driverPerformance && (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating !== undefined) && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Driver Performance</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {driverPerformance.topPerformingDriver && (
              <DriverCard
                driver={driverPerformance.topPerformingDriver}
                label="Top Performing Driver"
                variant="top"
              />
            )}
            {driverPerformance.averageDriverRating !== undefined && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-blue-500" />
                    <CardTitle>Average Rating</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span
                      className="text-5xl font-bold"
                      style={{
                        color: driverPerformance.averageDriverRating >= 4 ? "#10B981"
                          : driverPerformance.averageDriverRating >= 3 ? "#F59E0B" : "#EF4444"
                      }}
                    >
                      {(driverPerformance.averageDriverRating || 0).toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={s <= Math.round(driverPerformance.averageDriverRating) ? "currentColor" : "none"}
                          className={s <= Math.round(driverPerformance.averageDriverRating) ? "text-amber-400" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      out of 5 ({formatNumber(driverPerformance.totalDrivers || 0)} drivers)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {driverPerformance.underperformingDrivers?.length > 0 && driverPerformance.underperformingDrivers[0]?.driverName ? (
              <UnderperformingList drivers={driverPerformance.underperformingDrivers} />
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    <CardTitle>Total Drivers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-5xl font-bold text-emerald-600">
                      {formatNumber(driverPerformance.totalDrivers || 0)}
                    </span>
                    <p className="text-xs text-muted-foreground">active drivers in fleet</p>
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
