import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Truck, Map, TrendingUp, AlertTriangle, Trophy, Star, TrendingDown, Users, User, ChevronDown
} from 'lucide-react';
import { useProfile } from '../Profile/ProfileContext.jsx';
import { OverviewService } from './OverviewService.jsx';
import './OverviewPage.css'; // New CSS file for this page

// --- Helper Functions ---
// Re-using the getInitials function from your DriversPage
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#10B981'; // Green
    if (rating >= 3.5) return '#F59E0B'; // Yellow
    if (rating >= 2.5) return '#EF4444'; // Red
    return '#EF4444'; // Red
};

// --- Mock Data (will be replaced by API on load) ---

// For KPI Cards (from /vehicles and /drivers endpoints)
const mockKpiData = {
    totalVehicles: 12,
    totalKms: 18450.5,
    avgVariance: -0.85, // Fleet-wide average
    totalOutliers: 14, // Total outlier instances this month
};

// For Line/Bar Charts (from new /daily-summary endpoint)
const mockDailyChartData = [
    { date: 'Oct 20', variance: 0.5, outliers: 1 },
    { date: 'Oct 21', variance: -1.2, outliers: 3 },
    { date: 'Oct 22', variance: -0.3, outliers: 2 },
    { date: 'Oct 23', variance: 0.1, outliers: 0 },
    { date: 'Oct 24', variance: -1.9, outliers: 4 },
    { date: 'Oct 25', variance: -0.7, outliers: 2 },
    { date: 'Oct 26', variance: 0.2, outliers: 0 },
];

// For Driver Lists (from /drivers endpoint)
const mockDriverData = [
    { id: '1', name: 'Amitansu', rating: 4.8, variance: 0.06 },
    { id: '2', name: 'Rohan Sharma', rating: 4.5, variance: 0.02 },
    { id: '3', name: 'Priya Singh', rating: 3.1, variance: -1.1 },
    { id: '4', name: 'Sanjay Verma', rating: 2.1, variance: -2.8 },
    { id: '5', name: 'Deepak Kumar', rating: 1.8, variance: -3.4 },
];

// --- Sub-Components ---

// 1. KPI Stat Card
const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
        <div className="stat-icon-wrapper">
            {icon}
        </div>
        <div className="stat-content">
            <h4 className="stat-title">{title}</h4>
            <p className="stat-value">{value}</p>
        </div>
    </div>
);

// 2. Average Variance Chart
const VarianceChart = ({ data }) => (
    <div className="chart-card large-chart">
        <div className="chart-header">
            <h4>Average Variance (Last 7 Days)</h4>
            <select className="chart-filter" defaultValue="all">
                <option value="all">All Vehicles</option>
                <option value="vehicle1">KA01AB1234</option>
                <option value="vehicle2">MH04CD5678</option>
            </select>
        </div>
        <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} label={{ value: 'km/l', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="variance" name="Avg. Variance" stroke="var(--primary-color, #3B82F6)" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

// 3. Outlier Instances Chart
const OutlierChart = ({ data }) => (
    <div className="chart-card small-chart">
        <div className="chart-header">
            <h4>Daily Outlier Instances</h4>
        </div>
        <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="outliers" name="Outlier Trips" fill="#EF4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

// 4. Driver List Card (Reusable for Best/Underperforming)
const DriverList = ({ title, drivers, icon }) => (
    <div className="driver-list-card">
        <div className="driver-list-header">
            {icon}
            <h4>{title}</h4>
        </div>
        <ul className="driver-list">
            {drivers.length === 0 ? (
                <p className="no-drivers-message">No drivers match this criteria.</p>
            ) : (
                drivers.map(driver => (
                    <li key={driver.id} className="driver-item">
                        <div className="driver-avatar" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            {getInitials(driver.name)}
                        </div>
                        <div className="driver-info">
                            <strong>{driver.name}</strong>
                            <span>Avg. Variance: {driver.variance.toFixed(2)} km/l</span>
                        </div>
                        <div className="driver-rating" style={{ color: getRatingColor(driver.rating) }}>
                            <Star size={16} />
                            <span>{driver.rating.toFixed(1)}</span>
                        </div>
                    </li>
                ))
            )}
        </ul>
    </div>
);


// --- Main OverviewPage Component ---
const OverviewPage = () => {
    const { profile } = useProfile();
    const [kpiData, setKpiData] = useState(mockKpiData);
    const [dailyChartData, setDailyChartData] = useState(mockDailyChartData);
    const [driverData, setDriverData] = useState(mockDriverData);

    useEffect(() => {
        const loadOverview = async () => {
            const businessRefId = profile?.business_ref_id;
            const token = localStorage.getItem('authToken');
            if (!businessRefId || !token) return;
            try {
                const data = await OverviewService.getOverview(businessRefId, {}, token);
                const nextKpis = {
                    totalVehicles: data?.kpis?.totalVehicles ?? 0,
                    totalKms: data?.kpis?.totalKms ?? 0,
                    avgVariance: data?.kpis?.avgVariance ?? 0,
                    totalOutliers: data?.kpis?.totalOutliers ?? 0,
                };
                setKpiData(nextKpis);
                setDailyChartData(Array.isArray(data?.daily) ? data.daily : []);

                const drivers = [];
                if (data?.bestDriver) drivers.push(data.bestDriver);
                if (Array.isArray(data?.underperformingDrivers)) drivers.push(...data.underperformingDrivers);
                setDriverData(drivers);
            } catch (e) {
                // Silently keep mocks on failure; consider toast/error later
                console.error('Failed to load overview:', e);
            }
        };
        loadOverview();
    }, [profile?.business_ref_id]);

    // Memoized calculations based on mock data
    const { bestDriver, underperformingDrivers } = useMemo(() => {
        if (!driverData || driverData.length === 0) {
            return { bestDriver: null, underperformingDrivers: [] };
        }

        // Find the best driver (highest rating)
        const best = [...driverData].sort((a, b) => b.rating - a.rating)[0];

        // Find underperforming drivers (rating < 2.5)
        const underperforming = driverData.filter(driver => driver.rating < 2.5)
            .sort((a, b) => a.rating - b.rating); // Show worst first

        return { bestDriver: best, underperformingDrivers: underperforming };
    }, [driverData]);

    return (
        <div className="overview-page">
            <div className="overview-header">
                <h2>Welcome back, {profile?.company_name || 'Fleet Manager'}!</h2>
                <p>Here's a summary of your fleet's performance.</p>
            </div>

            {/* 1. KPI Cards Row */}
            <div className="overview-grid kpi-grid">
                <StatCard
                    title="Vehicles Subscribed"
                    value={kpiData.totalVehicles}
                    icon={<Truck size={22} />}
                />
                <StatCard
                    title="Total KMs Monitored"
                    value={`${kpiData.totalKms.toLocaleString()} km`}
                    icon={<Map size={22} />}
                />
                <StatCard
                    title="Average Variance"
                    value={`${kpiData.avgVariance.toFixed(2)} km/l`}
                    icon={<TrendingUp size={22} />}
                />
                <StatCard
                    title="Outlier Instances"
                    value={kpiData.totalOutliers}
                    icon={<AlertTriangle size={22} />}
                />
            </div>

            {/* 2. Charts Row */}
            <div className="overview-grid chart-grid">
                <VarianceChart data={dailyChartData} />
                <OutlierChart data={dailyChartData} />
            </div>

            {/* 3. Driver Lists Row */}
            <div className="overview-grid driver-grid">
                {bestDriver && (
                    <DriverList
                        title="Best Driver"
                        drivers={[bestDriver]}
                        icon={<Trophy size={20} color="#F59E0B" />}
                    />
                )}
                <DriverList
                    title="Underperforming Drivers (< 2.5 Rating)"
                    drivers={underperformingDrivers}
                    icon={<TrendingDown size={20} color="#EF4444" />}
                />
            </div>

        </div>
    );
};

export default OverviewPage;
