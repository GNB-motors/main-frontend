import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Car,
  CarFront,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Fuel,
  Route as RouteIcon,
  Percent,
  Radar,
  Satellite,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import {
  API_BASE_URL,
  getAuthHeaders,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../superAdminFormat';
import { SortIcon } from './SortIcon.jsx';
import DateRangeFilter from './DateRangeFilter';
import { getUserRole } from '../../../utils/session';
import '../SuperAdminPage.css';
import './OrgDetailPage.css';

const OrgDetailPage = () => {
  const navigate = useNavigate();
  const { id: orgId } = useParams();

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortKey, setSortKey] = useState('totalRevenue');
  const [sortDir, setSortDir] = useState('desc');

  const fetchDetail = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate && dateRange.endDate) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }
      const query = params.toString();
      const res = await fetch(
        `${API_BASE_URL}/api/admin/organizations/${orgId}/detail${query ? `?${query}` : ''}`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDetail(json.data);
    } catch (err) {
      console.error('[OrgDetailPage] organization detail fetch failed:', err);
      setError('Failed to load organisation details.');
    } finally {
      setLoading(false);
    }
  }, [orgId, dateRange]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const vehicles = detail?.vehicles || [];
  const sortedVehicles = [...vehicles].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (va == null) va = -Infinity;
    if (vb == null) vb = -Infinity;
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const vehicleStatCards = [
    {
      label: 'Total Vehicles',
      value: detail?.vehicleStats?.total,
      icon: <Car size={22} />,
      colorClass: 'purple',
    },
    {
      label: 'Active Vehicles',
      value: detail?.vehicleStats?.active,
      icon: <CarFront size={22} />,
      colorClass: 'teal',
    },
    {
      label: 'Inactive Vehicles',
      value: detail?.vehicleStats?.inactive,
      icon: <CarFront size={22} />,
      colorClass: 'red',
    },
    {
      label: 'Total Employees',
      value: detail?.totalUsers,
      icon: <Users size={22} />,
      colorClass: 'blue',
    },
  ];

  const baseline = detail?.mileageStats?.expectedBaseline;
  const fleetEdge = detail?.mileageStats?.fleetEdge;

  const financials = detail?.financials;
  const financialCards = [
    { label: 'Total Revenue', value: financials ? formatCurrency(financials.totalRevenue) : null, icon: <IndianRupee size={22} />, colorClass: 'green' },
    { label: 'Total Expenses', value: financials ? formatCurrency(financials.totalExpenses) : null, icon: <Wallet size={22} />, colorClass: 'orange' },
    { label: 'Net Profit', value: financials ? formatCurrency(financials.netProfit) : null, icon: <TrendingUp size={22} />, colorClass: 'blue' },
    { label: 'Fuel Cost', value: financials ? formatCurrency(financials.fuelCost) : null, icon: <Fuel size={22} />, colorClass: 'purple' },
    { label: 'Profit Margin', value: financials ? `${financials.profitMargin}%` : null, icon: <Percent size={22} />, colorClass: 'teal' },
    { label: 'Trips', value: financials ? formatNumber(financials.tripCount) : null, icon: <RouteIcon size={22} />, colorClass: 'amber' },
  ];

  const orgName = detail?.org?.companyName || detail?.org?.ownerEmail || orgId;

  return (
    <div className="super-admin-dashboard org-detail-page">
      <PageHeader
        backLabel="Organisations"
        backPath="/superadmin"
        currentLabel={orgName || '…'}
        title={orgName || 'Organisation'}
        description={detail?.org?.ownerEmail}
      />

      <div className="org-detail-toolbar">
        <p className="org-detail-toolbar-hint">
          Mileage variance and financials below respect this date range. Vehicle counts are all-time.
        </p>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="empty-state">
          <p className="error-text">{error}</p>
        </div>
      )}

      {/* Vehicle stats */}
      <div className="stats-grid">
        {vehicleStatCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <h3 className="stat-value">{loading ? '…' : card.value ?? '—'}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Mileage variance */}
      <div className="fuel-stats-section">
        <h2 className="fuel-stats-title">
          Mileage Variance <span>vs expected baseline &amp; FleetEdge telemetry</span>
        </h2>
        <div className="mileage-variance-grid">
          <div className="content-card mileage-variance-card">
            <div className="mileage-variance-card-header">
              <Radar size={16} />
              <span>Vs Expected Baseline</span>
            </div>
            {loading ? (
              <p className="mileage-variance-empty">Loading…</p>
            ) : !baseline || baseline.vehiclesConsidered === 0 ? (
              <p className="mileage-variance-empty">No completed mileage intervals in this range.</p>
            ) : (
              <div className="mileage-variance-body">
                <div className="mileage-variance-stat positive">
                  <TrendingUp size={18} />
                  <div>
                    <span className="mileage-variance-count">{baseline.positiveCount}</span>
                    <span className="mileage-variance-label">vehicles above expected</span>
                  </div>
                </div>
                <div className="mileage-variance-stat negative">
                  <TrendingDown size={18} />
                  <div>
                    <span className="mileage-variance-count">{baseline.negativeCount}</span>
                    <span className="mileage-variance-label">vehicles below expected</span>
                  </div>
                </div>
                <p className="mileage-variance-footnote">
                  {baseline.vehiclesConsidered} vehicle{baseline.vehiclesConsidered !== 1 ? 's' : ''} considered
                  {baseline.neutralCount ? `, ${baseline.neutralCount} exactly at baseline` : ''}.
                </p>
              </div>
            )}
          </div>

          <div className="content-card mileage-variance-card">
            <div className="mileage-variance-card-header">
              <Satellite size={16} />
              <span>Vs FleetEdge Telemetry</span>
            </div>
            {loading ? (
              <p className="mileage-variance-empty">Loading…</p>
            ) : !fleetEdge || fleetEdge.vehiclesConsidered === 0 ? (
              <p className="mileage-variance-empty">No FleetEdge data for this organisation.</p>
            ) : (
              <div className="mileage-variance-body">
                <div className="mileage-variance-stat positive">
                  <TrendingUp size={18} />
                  <div>
                    <span className="mileage-variance-count">{fleetEdge.positiveCount}</span>
                    <span className="mileage-variance-label">vehicles above telemetry</span>
                  </div>
                </div>
                <div className="mileage-variance-stat negative">
                  <TrendingDown size={18} />
                  <div>
                    <span className="mileage-variance-count">{fleetEdge.negativeCount}</span>
                    <span className="mileage-variance-label">vehicles below telemetry</span>
                  </div>
                </div>
                <p className="mileage-variance-footnote">
                  {fleetEdge.vehiclesConsidered} vehicle{fleetEdge.vehiclesConsidered !== 1 ? 's' : ''} considered
                  {fleetEdge.neutralCount ? `, ${fleetEdge.neutralCount} exactly at baseline` : ''}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="fuel-stats-section">
        <h2 className="fuel-stats-title">
          Financials <span>selected date range</span>
        </h2>
        <div className="stats-grid">
          {financialCards.map((card) => (
            <div className="stat-card" key={card.label}>
              <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
              <div className="stat-info">
                <p className="stat-label">{card.label}</p>
                <h3 className="stat-value">{loading ? '…' : card.value ?? '—'}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle analysis table */}
      <div className="content-card orgs-table-card">
        <div className="orgs-table-header">
          <div>
            <h3>Vehicle Analysis</h3>
            <p className="orgs-table-subtitle">
              {loading ? 'Loading…' : `${sortedVehicles.length} vehicle${sortedVehicles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="orgs-table-wrapper">
          {loading ? (
            <div className="empty-state"><p>Loading vehicles…</p></div>
          ) : sortedVehicles.length === 0 ? (
            <div className="empty-state"><p>No vehicles found for this organisation.</p></div>
          ) : (
            <table className="orgs-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th className="sortable" onClick={() => handleSort('tripCount')}>
                    Trips <SortIcon active={sortKey === 'tripCount'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('totalRevenue')}>
                    Revenue <SortIcon active={sortKey === 'totalRevenue'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('totalExpenses')}>
                    Expenses <SortIcon active={sortKey === 'totalExpenses'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('netProfit')}>
                    Net Profit <SortIcon active={sortKey === 'netProfit'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('fuelCost')}>
                    Fuel Cost <SortIcon active={sortKey === 'fuelCost'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('avgMileageKmPerL')}>
                    Km/L <SortIcon active={sortKey === 'avgMileageKmPerL'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('mileageVariancePct')}>
                    Vs Baseline <SortIcon active={sortKey === 'mileageVariancePct'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('fleetEdgeVariancePct')}>
                    Vs FleetEdge <SortIcon active={sortKey === 'fleetEdgeVariancePct'} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-company-name">{v.registrationNumber}</span>
                        <span className="org-email">{v.model || v.vehicleType || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${v.status === 'MAINTENANCE' ? 'pending' : 'active'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td><span className="num">{v.tripCount}</span></td>
                    <td><span className="num expense-value">{formatCurrency(v.totalRevenue)}</span></td>
                    <td><span className="num expense-value">{formatCurrency(v.totalExpenses)}</span></td>
                    <td><span className="num expense-value">{formatCurrency(v.netProfit)}</span></td>
                    <td><span className="num expense-value">{formatCurrency(v.fuelCost)}</span></td>
                    <td><span className="num">{v.avgMileageKmPerL ?? '—'}</span></td>
                    <td>
                      <span className={`variance-pill ${v.mileageVariancePct > 0 ? 'positive' : v.mileageVariancePct < 0 ? 'negative' : ''}`}>
                        {formatPercent(v.mileageVariancePct)}
                      </span>
                    </td>
                    <td>
                      {v.fleetEdgeAvailable ? (
                        <span className={`variance-pill ${v.fleetEdgeVariancePct > 0 ? 'positive' : v.fleetEdgeVariancePct < 0 ? 'negative' : ''}`}>
                          {formatPercent(v.fleetEdgeVariancePct)}
                        </span>
                      ) : (
                        <span className="no-name">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgDetailPage;
