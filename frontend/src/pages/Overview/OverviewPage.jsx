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
  User, // Added User icon fallback
  ChevronDown,
  DollarSign,
  Calendar,
  Filter,
  TrendingUpIcon,
  Activity,
} from "lucide-react";
import { OverviewService } from "./OverviewService.jsx";
import { useProfile } from "../Profile/ProfileContext"; // Import useProfile
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

// 0. Date Range Selector (Glassmorphism + Gliding Effect)
const DateRangeSelector = ({ onDaysChange, onDateRangeChange, selectedDays }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeIndex, setActiveIndex] = useState(0); // For gliding effect
  const customBtnRef = React.useRef(null);

  const quickOptions = [
    { label: "7 Days", days: 7 },
    { label: "14 Days", days: 14 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
  ];

  // Update active index when selectedDays changes
  useEffect(() => {
    const index = quickOptions.findIndex(opt => opt.days === selectedDays);
    if (index !== -1) setActiveIndex(index);
    else setActiveIndex(-1); // Custom or unknown
  }, [selectedDays]);

  const handleQuickSelect = (days, index) => {
    setShowCustom(false);
    setActiveIndex(index);
    onDaysChange(days);
    onDateRangeChange(null, null);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setShowCustom(false);
      setActiveIndex(-1); // Clear glider
    }
  };

  return (
    <div className="date-range-containner-glass">
      <div className="date-tabs-wrapper">
        {/* The Glider Background */}
        <div
          className="glider-pill"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
            opacity: activeIndex === -1 ? 0 : 1
          }}
        />

        {quickOptions.map((opt, idx) => (
          <button
            key={opt.days}
            className={`glass-tab-btn ${selectedDays === opt.days ? "active" : ""}`}
            onClick={() => handleQuickSelect(opt.days, idx)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="vertical-divider-glass"></div>

      <div className="custom-wrapper" ref={customBtnRef}>
        <button
          className={`glass-custom-btn ${showCustom ? "active" : ""}`}
          onClick={() => {
            setShowCustom(!showCustom);
            if (!showCustom) setActiveIndex(-1);
          }}
        >
          <Calendar size={14} style={{ marginRight: 6 }} />
          Custom
        </button>
        {showCustom && (
          <div className="custom-date-modal glass-modal">
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
              Apply Range
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ... Imports ...

// 1. KPI Stat Card
const StatCard = ({ title, value, subtext, icon, trend }) => (
  <div className="stat-card pop-card">
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
    <div className="chart-card large-chart pop-card">
      <div className="chart-header">
        <div>
          <h4>Fuel Efficiency Trend</h4>
          <p className="chart-subtext">Daily fuel efficiency (km/l) over time</p>
        </div>
      </div>
      {hasData ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                fontSize={11}
                tickFormatter={(value) => getDateLabel(value)}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                label={{ value: "km/l", angle: -90, position: "insideLeft", fontSize: 11, fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                formatter={(value) => [`${value.toFixed(2)} km/l`, 'Efficiency']}
                labelFormatter={(label) => getDateLabel(label)}
              />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="averageVariance"
                name="Efficiency" /* Mapping variance to Efficiency for visualization logic if needed, or stick to provided key */
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                fill="url(#colorVariance)"
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

// 3. Outlier Detection Chart -> REMOVING/MERGING into Insights or keeping as smaller (NOT USED IN NEW DESIGN AS PER REQUEST TO MAKE SPACE)
// I'll keep the code but maybe not render it prominently if not needed. 
// Actually user said "Fuel insights pushed to corner". I will resize Revenue Chart too.

// ... Revenue & Expense Trend (BarChart) ...
// 6. Financial Summary Card (Updated to render Chart only as "Revenue & Expense Trend")
const FinancialSummaryCard = ({ data }) => {
  // We only use this for the chart now, as metrics are in Hero Cards
  if (!data || !data.dailyTrend || data.dailyTrend.length === 0) return null;

  return (
    <div className="chart-card pop-card">
      <div className="chart-header">
        <div>
          <h4>Revenue & Expense Trend</h4>
          <p className="chart-subtext">Daily financial breakdown</p>
        </div>
      </div>
      <div className="mini-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.dailyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barGap={6}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              fontSize={11}
              tickFormatter={(value) => getDateLabel(value)}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => getDateLabel(label)}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="revenue" name="Revenue" fill="url(#colorRev)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expenses" name="Expenses" fill="url(#colorExp)" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
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



// --- Main OverviewPage Component ---
// --- Main OverviewPage Component ---
const OverviewPage = () => {
  // Access Profile Data
  const { profile, isLoadingProfile } = useProfile();

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


  if ((isLoading || isLoadingProfile) && !summaryData) {
    return (
      <div className="overview-page">
        <div className="loading-state">
          <div className="loader-spinner"></div>
          <p>Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !summaryData) {
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

  // Determine user display name
  const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : "Admin User";
  const userEmail = profile?.email || "fleet@gnblogistics.com";

  return (
    <div className={`overview-page ${isLoading ? 'is-refreshing' : ''}`}>

      {/* Personalized Header (Dark Blue Gradient) */}
      <div className="overview-header modern-header">
        <div className="header-left">
          <div className="user-welcome">
            <div className="user-avatar-placeholder">
              {getInitials(userName)}
            </div>
            <div className="welcome-text">
              <h1>Hello, {userName} 👋</h1>
              <p className="user-email">{userEmail}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <DateRangeSelector
            onDaysChange={handleDaysChange}
            onDateRangeChange={handleDateRangeChange}
            selectedDays={selectedDays}
          />
        </div>
      </div>

      {/* 1. HERO SECTION: Financial Overview */}
      {financials && financials.summary && (
        <div className="overview-section">
          <div className="section-title">Financial Overview</div>
          <div className="overview-grid financial-hero-grid">
            <div className="hero-card revenue-card">
              <div className="hero-icon-wrapper">
                <DollarSign size={24} />
              </div>
              <div className="hero-content">
                <span className="hero-label">Total Revenue</span>
                <span className="hero-value">{formatCurrency(financials.summary.totalRevenue || 0)}</span>
                <div className="hero-trend up">
                  <TrendingUp size={16} />
                  <span>+12.5%</span> {/* Placeholder */}
                </div>
              </div>
            </div>

            <div className="hero-card profit-card">
              <div className="hero-icon-wrapper">
                <TrendingUpIcon size={24} />
              </div>
              <div className="hero-content">
                <span className="hero-label">Net Profit</span>
                <span className="hero-value">{formatCurrency(financials.summary.netProfit || 0)}</span>
                <span className="hero-subtext">Margin: {(financials.summary.profitMargin || 0).toFixed(2)}%</span>
              </div>
            </div>

            <div className="hero-card expenses-card">
              <div className="hero-icon-wrapper">
                <TrendingDown size={24} />
              </div>
              <div className="hero-content">
                <span className="hero-label">Total Expenses</span>
                <span className="hero-value">{formatCurrency(financials.summary.totalExpenses || 0)}</span>
              </div>
            </div>

            <div className="hero-card fuel-cost-card">
              <div className="hero-icon-wrapper">
                <Activity size={24} />
              </div>
              <div className="hero-content">
                <span className="hero-label">Fuel Cost</span>
                <span className="hero-value">{formatCurrency(financials.summary.fuelCost || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fleet Overview (with Circular Charts) */}
      <div className="overview-section">
        <div className="section-title">Fleet Statistics</div>
        <div className="overview-grid kpi-grid">
          {summaryData?.vehicles && (
            <div className="stat-card circular-stat-card">
              <div className="circular-chart-wrapper">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: summaryData.vehicles.active || 0, fill: '#10B981' },
                        { name: 'Inactive', value: (summaryData.vehicles.total - summaryData.vehicles.active) || 0, fill: '#E5E7EB' }
                      ]}
                      innerRadius={25}
                      outerRadius={35}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center-icon">
                  <Truck size={16} color="#10B981" />
                </div>
              </div>
              <div className="stat-content">
                <h4 className="stat-title">Vehicle Status</h4>
                <div className="mini-stats-row">
                  <div className="mini-stat">
                    <span className="val">{summaryData.vehicles.active || 0}</span>
                    <span className="lbl">Active</span>
                  </div>
                  <div className="divider"></div>
                  <div className="mini-stat">
                    <span className="val">{summaryData.vehicles.total || 0}</span>
                    <span className="lbl">Total</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {summaryData?.drivers && (
            <div className="stat-card circular-stat-card">
              <div className="circular-chart-wrapper" style={{ background: '#E0F2FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} color="#0284C7" />
              </div>
              <div className="stat-content">
                <h4 className="stat-title">Total Drivers</h4>
                <div className="mini-stats-row">
                  <div className="mini-stat">
                    <span className="val">{formatNumber(summaryData.drivers?.total || 0)}</span>
                    <span className="lbl">Total</span>
                  </div>
                  <div className="divider"></div>
                  <div className="mini-stat">
                    <span className="val">{formatNumber(summaryData.drivers?.active || 0)}</span>
                    <span className="lbl">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {summaryData?.trips && (
            <div className="stat-card circular-stat-card">
              <div className="circular-chart-wrapper">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: summaryData.trips.completed || 0, fill: '#3B82F6' },
                        { name: 'Ongoing', value: summaryData.trips.ongoing || 0, fill: '#F59E0B' }
                      ]}
                      innerRadius={25}
                      outerRadius={35}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center-icon">
                  <Activity size={16} color="#3B82F6" />
                </div>
              </div>
              <div className="stat-content">
                <h4 className="stat-title">Trip Status</h4>
                <div className="mini-stats-row">
                  <div className="mini-stat">
                    <span className="val">{summaryData.trips.completed || 0}</span>
                    <span className="lbl">Done</span>
                  </div>
                  <div className="divider"></div>
                  <div className="mini-stat">
                    <span className="val">{summaryData.trips.ongoing || 0}</span>
                    <span className="lbl">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {summaryData?.kilometers && (
            <StatCard
              title="Distance Covered"
              value={`${formatNumber(summaryData.kilometers?.total || 0)} km`}
              icon={<Map size={22} />}
            />
          )}
        </div>
      </div>

      <div className="overview-grid main-content-grid">
        {/* Left Column: Charts & Fuel Analytics */}
        {/* Left Column: Charts & Fuel Analytics */}
        <div className="left-column">
          {/* Fuel Analytics Chart */}
          {fuelAnalytics?.dailyVariance?.length > 0 && (
            <FuelAnalyticsChart data={fuelAnalytics.dailyVariance} />
          )}

          {/* Financial Trend Chart */}
          {financials && (
            <FinancialSummaryCard data={financials} />
          )}
        </div>

        {/* Right Column: Driver Performance & Details */}
        <div className="right-column">
          <div className="overview-section-header">
            <h3>Top Performer</h3>
          </div>

          {driverPerformance?.topPerformingDriver ? (
            <div className="modern-driver-card top-performer">
              <div className="performer-badge">
                <Trophy size={14} /> #1
              </div>
              <div className="driver-profile">
                <div className="driver-avatar-lg">
                  {getInitials(driverPerformance.topPerformingDriver.driverName)}
                </div>
                <div className="driver-main-info">
                  <h4>{driverPerformance.topPerformingDriver.driverName}</h4>
                  <span className="driver-phone">{driverPerformance.topPerformingDriver.mobileNumber}</span>
                </div>
                <div className="driver-rating-pill">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  {driverPerformance.topPerformingDriver.rating}
                </div>
              </div>

              <div className="driver-metrics-grid">
                <div className="metric-item">
                  <label>Trips</label>
                  <span>{driverPerformance.topPerformingDriver.tripCount}</span>
                </div>
                <div className="metric-item">
                  <label>Revenue</label>
                  <span className="text-green">{formatCurrency(driverPerformance.topPerformingDriver.totalRevenue)}</span>
                </div>
                <div className="metric-item">
                  <label>Efficiency</label>
                  <span>{driverPerformance.topPerformingDriver.avgActualKmpl?.toFixed(1)} km/l</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-card">No driver data available</div>
          )}

          {/* Fuel Secondary Metrics (Poppier Design) */}
          {summaryData?.fuel && (
            <div className="fuel-summary-row" style={{ marginTop: '24px' }}>
              <div className="overview-section-header" style={{ marginBottom: '16px' }}>
                <h3>Fuel Insights</h3>
              </div>
              <div className="mini-stat-grid">

                {/* Avg Efficiency Card */}
                <div className="mini-stat-card pop-card">
                  <div className="icon-box blue">
                    <Activity size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="label">Avg Efficiency</span>
                    <span className="value">{summaryData.fuel.avgKmpl?.toFixed(2)} <small>km/l</small></span>
                  </div>
                </div>

                {/* Total Consumed Card */}
                <div className="mini-stat-card pop-card">
                  <div className="icon-box orange">
                    <Truck size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="label">Total Consumed</span>
                    <span className="value">{formatNumber(summaryData.fuel.totalLitres)} <small>L</small></span>
                  </div>
                </div>

                {/* Outliers Card */}
                {fuelAnalytics?.summary && (
                  <div className={`mini-stat-card pop-card ${fuelAnalytics.summary.outlierCount > 0 ? 'warning-bg' : ''}`}>
                    <div className="icon-box red">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="stat-info">
                      <span className="label">Abnormal Days</span>
                      <span className="value">{fuelAnalytics.summary.outlierCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );

};

export default OverviewPage;
