import React, { useState, useMemo, useEffect } from "react";
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
  PieChart,
  Pie,
  Cell,
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
  User,
  ChevronDown,
  DollarSign,
  Calendar,
  Filter,
  TrendingUpIcon,
  Activity,
} from "lucide-react";
import { OverviewService } from "./OverviewService.jsx";
import "./OverviewPage.css";

// --- Helper Functions ---
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
};

const getRatingColor = (rating) => {
  if (rating >= 4.5) return "#10B981"; // Green
  if (rating >= 3.5) return "#F59E0B"; // Yellow
  if (rating >= 2.5) return "#EF4444"; // Red
  return "#EF4444"; // Red
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};

const getDateLabel = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// --- Sub-Components ---

// 0. Date Range Selector
const DateRangeSelector = ({ onDaysChange, onDateRangeChange, selectedDays }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const customBtnRef = React.useRef(null);

  const quickOptions = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 14 Days", days: 14 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
  ];

  const handleQuickSelect = (days) => {
    setShowCustom(false);
    onDaysChange(days);
    onDateRangeChange(null, null);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setShowCustom(false);
    }
  };

  return (
    <div className="date-range-selector">
      <div className="date-selector-header">
        <Calendar size={18} />
        <span className="date-selector-label">Date Range</span>
      </div>

      <div className="date-quick-options">
        {quickOptions.map((opt) => (
          <button
            key={opt.days}
            className={`quick-option-btn ${selectedDays === opt.days ? "active" : ""}`}
            onClick={() => handleQuickSelect(opt.days)}
          >
            {opt.label}
          </button>
        ))}
        <div className="custom-wrapper" ref={customBtnRef}>
          <button
            className={`quick-option-btn ${showCustom ? "active" : ""}`}
            onClick={() => setShowCustom(!showCustom)}
          >
            Custom
          </button>
          {showCustom && (
            <div className="custom-date-modal">
              <div className="date-input-group">
                <label>From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <button className="apply-date-btn" onClick={handleCustomApply}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 1. KPI Stat Card
const StatCard = ({ title, value, subtext, icon, trend }) => (
  <div className="stat-card">
    <div className="stat-icon-wrapper">{icon}</div>
    <div className="stat-content">
      <h4 className="stat-title">{title}</h4>
      <p className="stat-value">{value}</p>
      {subtext && <p className="stat-subtext">{subtext}</p>}
    </div>
    {trend && (
      <div className={`stat-trend ${trend.direction}`}>
        {trend.direction === "up" ? (
          <TrendingUp size={16} />
        ) : (
          <TrendingDown size={16} />
        )}
        <span>{trend.value}%</span>
      </div>
    )}
  </div>
);

// 2. Fuel Analytics Chart
const FuelAnalyticsChart = ({ data, dateRange }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="chart-card large-chart">
      <div className="chart-header">
        <div>
          <h4>Fuel Consumption Variance</h4>
          <p className="chart-subtext">Daily fuel efficiency variance (km/l)</p>
        </div>
      </div>
      {hasData ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickFormatter={(value) => getDateLabel(value)}
              />
              <YAxis
                fontSize={12}
                label={{ value: "km/l", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                formatter={(value) => value.toFixed(2)}
                labelFormatter={(label) => getDateLabel(label)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageVariance"
                name="Avg. Variance"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="no-data-placeholder">No variance data available</div>
      )}
    </div>
  );
};

// 3. Outlier Detection Chart
const OutlierChart = ({ data, dateRange }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="chart-card small-chart">
      <div className="chart-header">
        <div>
          <h4>Daily Outliers</h4>
          <p className="chart-subtext">Abnormal fuel consumption days</p>
        </div>
      </div>
      {hasData ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickFormatter={(value) => getDateLabel(value)}
              />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                labelFormatter={(label) => getDateLabel(label)}
              />
              <Bar
                dataKey="outlierCount"
                name="Outlier Count"
                fill="#EF4444"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="no-data-placeholder">No outlier data available</div>
      )}
    </div>
  );
};

// 4. Driver Performance Card
const DriverPerformanceCard = ({ data, icon, title }) => {
  if (!data) {
    return (
      <div className="driver-card">
        <div className="driver-card-header">
          {icon}
          <h4>{title}</h4>
        </div>
        <p className="no-drivers-message">No data available</p>
      </div>
    );
  }

  return (
    <div className="driver-card">
      <div className="driver-card-header">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="driver-card-content">
        <div className="driver-avatar" style={{ backgroundColor: "#E0F2FE", color: "#0284C7" }}>
          {getInitials(data.driverName)}
        </div>
        <div className="driver-details">
          <h5>{data.driverName}</h5>
          {data.mobileNumber && <p className="driver-mobile">{data.mobileNumber}</p>}
          <div className="driver-stats">
            <span className="stat-badge">
              <span className="badge-label">Trips:</span> {data.tripCount || 0}
            </span>
            <span className="stat-badge">
              <span className="badge-label">Fuel:</span>{" "}
              {formatNumber(data.totalFuelLitres || 0)} L
            </span>
          </div>
        </div>
        <div className="driver-rating" style={{ color: getRatingColor(data.rating) }}>
          <Star size={18} fill="currentColor" />
          <span>{(data.rating || 0).toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

// 5. Underperforming Drivers List
const UnderperformingDriversList = ({ drivers, icon, title }) => {
  return (
    <div className="driver-list-card">
      <div className="driver-list-header">
        {icon}
        <h4>{title}</h4>
      </div>
      {drivers && drivers.length > 0 ? (
        <ul className="driver-list">
          {drivers.map((driver) => (
            <li key={driver.driverId || driver.id} className="driver-item">
              <div className="driver-avatar" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                {getInitials(driver.driverName)}
              </div>
              <div className="driver-info">
                <strong>{driver.driverName}</strong>
                {driver.mobileNumber && <span>{driver.mobileNumber}</span>}
              </div>
              <div className="driver-rating" style={{ color: getRatingColor(driver.rating) }}>
                <Star size={16} fill="currentColor" />
                <span>{(driver.rating || 0).toFixed(1)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-drivers-message">No underperforming drivers</p>
      )}
    </div>
  );
};

// 6. Financial Summary Card
const FinancialSummaryCard = ({ data }) => {
  if (!data || !data.summary) {
    return (
      <div className="financial-summary-card">
        <h4>Financial Summary</h4>
        <p className="no-drivers-message">No financial data available</p>
      </div>
    );
  }

  const { summary } = data;
  const profitColor = (summary.netProfit || 0) >= 0 ? "#10B981" : "#EF4444";

  return (
    <div className="financial-summary-card">
      <h4>Financial Summary</h4>
      <div className="financial-metrics">
        <div className="financial-metric">
          <span className="metric-label">Total Revenue</span>
          <span className="metric-value" style={{ color: "#10B981" }}>
            {formatCurrency(summary.totalRevenue || 0)}
          </span>
        </div>
        <div className="financial-metric">
          <span className="metric-label">Total Expenses</span>
          <span className="metric-value" style={{ color: "#EF4444" }}>
            {formatCurrency(summary.totalExpenses || 0)}
          </span>
        </div>
        <div className="financial-metric">
          <span className="metric-label">Net Profit</span>
          <span className="metric-value" style={{ color: profitColor, fontWeight: 700 }}>
            {formatCurrency(summary.netProfit || 0)}
          </span>
        </div>
        <div className="financial-metric">
          <span className="metric-label">Profit Margin</span>
          <span className="metric-value" style={{ color: "#F59E0B" }}>
            {(summary.profitMargin || 0).toFixed(2)}%
          </span>
        </div>
      </div>

      {data.dailyTrend && data.dailyTrend.length > 0 && (
        <div className="financial-chart-wrapper">
          <h5>Daily Trend</h5>
          <div className="mini-chart">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickFormatter={(value) => getDateLabel(value)}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => getDateLabel(label)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main OverviewPage Component ---
const OverviewPage = () => {
  // State for dashboard data
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date range parameters
  const [selectedDays, setSelectedDays] = useState(7);
  const [customDateRange, setCustomDateRange] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let params = {};

        // Use custom date range if selected, otherwise use days
        if (customDateRange && customDateRange.start && customDateRange.end) {
          params.startDate = new Date(customDateRange.start).toISOString();
          params.endDate = new Date(customDateRange.end).toISOString();
        } else {
          params.days = selectedDays;
        }

        // Fetch all data in parallel
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
        
        // Set the date range from the response
        if (summary?.dateRange) {
          setDateRange(summary.dateRange);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.detail || "Could not load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDays, customDateRange]);

  const handleDaysChange = (days) => {
    setSelectedDays(days);
    setCustomDateRange(null);
  };

  const handleDateRangeChange = (start, end) => {
    if (start && end) {
      setCustomDateRange({ start, end });
    }
  };

  if (isLoading) {
    return (
      <div className="overview-page">
        <div className="loading-state">
          <div className="loader-spinner"></div>
          <p>Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page">
        <div className="error-state">
          <AlertTriangle size={40} />
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      {/* Header with Date Filter */}
      <div className="overview-header">
        <div className="header-content">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Complete fleet analytics and performance metrics</p>
          </div>
          <DateRangeSelector
            onDaysChange={handleDaysChange}
            onDateRangeChange={handleDateRangeChange}
            selectedDays={selectedDays}
          />
        </div>
      </div>

      {/* 1. Summary KPI Cards Row */}
      <div className="section-title">Fleet Overview</div>
      <div className="overview-grid kpi-grid">
        {summaryData?.vehicles && (
          <>
            <StatCard
              title="Total Vehicles"
              value={formatNumber(summaryData.vehicles.total || 0)}
              subtext={`${formatNumber(summaryData.vehicles.active || 0)} active • ${formatNumber(summaryData.vehicles.onTrip || 0)} on trip`}
              icon={<Truck size={22} />}
            />
            <StatCard
              title="Total Drivers"
              value={formatNumber(summaryData.drivers?.total || 0)}
              subtext={`${formatNumber(summaryData.drivers?.active || 0)} active`}
              icon={<Users size={22} />}
            />
            <StatCard
              title="Total Trips"
              value={formatNumber(summaryData.trips?.total || 0)}
              subtext={`${formatNumber(summaryData.trips?.completed || 0)} completed • ${formatNumber(summaryData.trips?.ongoing || 0)} ongoing`}
              icon={<Activity size={22} />}
            />
            <StatCard
              title="Distance Covered"
              value={`${formatNumber(summaryData.kilometers?.total || 0)} km`}
              icon={<Map size={22} />}
            />
          </>
        )}
      </div>

      {/* 2. Fuel Metrics Row */}
      {summaryData?.fuel && (summaryData.fuel.totalLitres > 0 || summaryData.fuel.totalCost > 0) && (
        <>
          <div className="section-title">Fuel Analytics</div>
          <div className="overview-grid fuel-grid">
            <StatCard
              title="Total Fuel Consumed"
              value={`${formatNumber(summaryData.fuel.totalLitres || 0)} L`}
              subtext={`Total Cost: ${formatCurrency(summaryData.fuel.totalCost || 0)}`}
              icon={<TrendingUp size={22} />}
            />
            <StatCard
              title="Fleet Avg Efficiency"
              value={`${(summaryData.fuel.avgKmpl || 0).toFixed(2)} km/l`}
              subtext="Overall fuel efficiency"
              icon={<TrendingUp size={22} />}
            />
            {fuelAnalytics?.summary && (
              <>
                <StatCard
                  title="Avg Variance"
                  value={`${(fuelAnalytics.summary.averageVariance || 0).toFixed(2)} km/l`}
                  subtext={`Fleet-wide average: ${(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)}`}
                  icon={<TrendingUp size={22} />}
                />
                <StatCard
                  title="Outliers Detected"
                  value={formatNumber(fuelAnalytics.summary.outlierCount || 0)}
                  subtext={`Out of ${formatNumber(fuelAnalytics.summary.totalTrips || 0)} trips`}
                  icon={<AlertTriangle size={22} />}
                />
              </>
            )}
          </div>

          {/* Fuel Analytics Charts */}
          {fuelAnalytics?.dailyVariance?.length > 0 && (
            <div className="overview-grid chart-grid">
              <FuelAnalyticsChart data={fuelAnalytics.dailyVariance} dateRange={dateRange} />
            </div>
          )}
        </>
      )}

      {/* 3. Financial Overview */}
      {financials && financials.summary && (financials.summary.totalRevenue > 0 || financials.summary.totalExpenses > 0) && (
        <>
          <div className="section-title">Financial Overview</div>
          <div className="overview-grid financial-grid">
            <FinancialSummaryCard data={financials} />
          </div>
        </>
      )}

      {/* 4. Driver Performance Section */}
      {driverPerformance && (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating) && (
        <>
          <div className="section-title">Driver Performance</div>
          <div className="overview-grid driver-performance-grid">
            {driverPerformance.topPerformingDriver && (
              <DriverPerformanceCard
                data={driverPerformance.topPerformingDriver}
                icon={<Trophy size={20} style={{ color: "#F59E0B" }} />}
                title="Top Performing Driver"
              />
            )}
            {driverPerformance.averageDriverRating !== undefined && (
              <div className="driver-card">
                <div className="driver-card-header">
                  <Star size={20} style={{ color: "#3B82F6" }} />
                  <h4>Average Driver Rating</h4>
                </div>
                <div className="driver-card-content center">
                  <div className="rating-display" style={{ color: getRatingColor(driverPerformance.averageDriverRating) }}>
                    <div className="rating-number">{(driverPerformance.averageDriverRating || 0).toFixed(1)}</div>
                    <div className="rating-stars">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div className="rating-text">
                      out of 5 ({formatNumber(driverPerformance.totalDrivers || 0)} drivers)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Underperforming Drivers */}
          {driverPerformance.underperformingDrivers && 
           driverPerformance.underperformingDrivers.length > 0 && 
           driverPerformance.underperformingDrivers[0].driverName && (
            <div className="overview-grid">
              <UnderperformingDriversList
                drivers={driverPerformance.underperformingDrivers}
                icon={<TrendingDown size={20} style={{ color: "#EF4444" }} />}
                title="Underperforming Drivers"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OverviewPage;
