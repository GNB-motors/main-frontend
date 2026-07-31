import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Car,
  CarFront,
  IndianRupee,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Fuel,
  Receipt,
  ScanLine,
  AlertTriangle,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import {
  API_BASE_URL,
  getAuthHeaders,
  formatCurrency,
  formatDate,
  formatNumber,
} from './superAdminFormat';
import { SortIcon } from './components/SortIcon.jsx';
import './SuperAdminPage.css';

// ── component ──────────────────────────────────────────────────────────────

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  // Global stats for top cards
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Organisations table
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState(null);

  // Platform-wide fuel & receipts stats
  const [fuelStats, setFuelStats] = useState(null);
  const [fuelLoading, setFuelLoading] = useState(true);
  const [fuelError, setFuelError] = useState(null);

  // Table controls
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // ── auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'SUPER_ADMIN') {
      navigate('/overview');
      return;
    }
    setUser({
      firstName: localStorage.getItem('user_firstName') || '',
      lastName:  localStorage.getItem('user_lastName')  || '',
      email:     localStorage.getItem('user_email')     || '',
      role:      userRole,
      userId:    localStorage.getItem('user_id')        || '',
    });
  }, [navigate]);

  // ── fetch global stats ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('[SuperAdmin] dashboard-stats fetch failed:', err);
      setStatsError('Failed to load statistics.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── fetch orgs table ────────────────────────────────────────────────────
  const fetchOrgs = useCallback(async () => {
    setOrgsLoading(true);
    setOrgsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/organizations-overview`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOrgs(json.data || []);
    } catch (err) {
      console.error('[SuperAdmin] organizations-overview fetch failed:', err);
      setOrgsError('Failed to load organisations.');
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  // ── fetch platform fuel & receipts stats ────────────────────────────────
  const fetchFuelStats = useCallback(async () => {
    setFuelLoading(true);
    setFuelError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/platform-fuel-stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFuelStats(json.data);
    } catch (err) {
      console.error('[SuperAdmin] platform-fuel-stats fetch failed:', err);
      setFuelError('Failed to load fuel stats.');
    } finally {
      setFuelLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchOrgs();
    fetchFuelStats();
  }, [fetchStats, fetchOrgs, fetchFuelStats]);

  // ── sort + filter ───────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const displayedOrgs = orgs
    .filter((org) => {
      const q = search.toLowerCase();
      return (
        (org.companyName || '').toLowerCase().includes(q) ||
        (org.ownerEmail  || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === 'createdAt') {
        va = new Date(va);
        vb = new Date(vb);
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── stat cards config ───────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Organisations',
      value: statsLoading ? '…' : stats?.totalOrganizations ?? '—',
      icon: <Building2 size={22} />,
      colorClass: 'green',
    },
    {
      label: 'Total Vehicles',
      value: statsLoading ? '…' : stats?.totalVehicles ?? '—',
      icon: <Car size={22} />,
      colorClass: 'purple',
    },
    {
      label: 'Total Expenses',
      value: statsLoading
        ? '…'
        : stats?.totalExpenses != null
        ? formatCurrency(stats.totalExpenses)
        : '—',
      icon: <IndianRupee size={22} />,
      colorClass: 'orange',
    },
    {
      label: 'Active Vehicles',
      value: statsLoading ? '…' : stats?.activeVehicles ?? '—',
      icon: <CarFront size={22} />,
      colorClass: 'teal',
    },
    {
      label: 'Inactive Vehicles',
      value: statsLoading ? '…' : stats?.inactiveVehicles ?? '—',
      icon: <CarFront size={22} />,
      colorClass: 'red',
    },
  ];

  // ── fuel & receipts cards config ────────────────────────────────────────
  const successRate =
    fuelStats && fuelStats.totalReceipts > 0
      ? Math.round((fuelStats.receiptsByStatus.SUCCESS / fuelStats.totalReceipts) * 100)
      : null;
  const pendingCount = fuelStats
    ? fuelStats.receiptsByStatus.PENDING + fuelStats.receiptsByStatus.MANUAL_REVIEW
    : null;
  const totalFuelSpend = fuelStats
    ? fuelStats.fuel.DIESEL.amount + fuelStats.fuel.ADBLUE.amount
    : null;

  const fuelCards = [
    {
      label: 'Fuel Logs Recorded',
      value: fuelStats?.totalFuelLogs,
      icon: <ClipboardList size={22} />,
      colorClass: 'blue',
    },
    {
      label: 'Receipts Processed',
      value: fuelStats?.totalReceipts,
      icon: <Receipt size={22} />,
      colorClass: 'teal',
    },
    {
      label: 'OCR Success Rate',
      value: successRate != null ? `${successRate}%` : null,
      icon: <ScanLine size={22} />,
      colorClass: 'green',
    },
    {
      label: 'Failed OCR',
      value: fuelStats?.receiptsByStatus.ERROR,
      icon: <AlertTriangle size={22} />,
      colorClass: 'red',
    },
    {
      label: 'Pending / Manual Review',
      value: pendingCount,
      icon: <Clock size={22} />,
      colorClass: 'amber',
    },
    {
      label: 'Diesel Logged',
      value: fuelStats ? `${formatNumber(fuelStats.fuel.DIESEL.litres)} L` : null,
      icon: <Fuel size={22} />,
      colorClass: 'purple',
    },
    {
      label: 'Fuel Spend',
      value: totalFuelSpend != null ? formatCurrency(totalFuelSpend) : null,
      icon: <IndianRupee size={22} />,
      colorClass: 'orange',
    },
    {
      label: 'Logs Needing Review',
      value: fuelStats?.needsReview,
      icon: <AlertTriangle size={22} />,
      colorClass: 'amber',
    },
  ];

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div className="super-admin-dashboard">
      {/* Welcome */}
      <div className="welcome-section">
        <h1>Welcome back, {user.firstName}! 👋</h1>
        <p>Here's a live snapshot of all organisations on your platform.</p>
      </div>

      {/* Top stat cards */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <h3 className="stat-value">{card.value}</h3>
              {statsError && <span className="stat-change negative">{statsError}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Fuel & Receipts stats (platform-wide) */}
      <div className="fuel-stats-section">
        <h2 className="fuel-stats-title">
          Fuel &amp; Receipts <span>platform-wide</span>
        </h2>
        <div className="stats-grid">
          {fuelCards.map((card) => (
            <div className="stat-card" key={card.label}>
              <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
              <div className="stat-info">
                <p className="stat-label">{card.label}</p>
                <h3 className="stat-value">{fuelLoading ? '…' : card.value ?? '—'}</h3>
                {fuelError && <span className="stat-change negative">{fuelError}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organisations Table */}
      <div className="content-card orgs-table-card">
        {/* Table header row */}
        <div className="orgs-table-header">
          <div>
            <h3>Organisations Overview</h3>
            <p className="orgs-table-subtitle">
              {orgsLoading ? 'Loading…' : `${displayedOrgs.length} organisation${displayedOrgs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="orgs-table-actions">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="orgs-search-input"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="action-btn refresh-btn"
              onClick={() => { fetchStats(); fetchOrgs(); fetchFuelStats(); }}
              title="Refresh data"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="orgs-table-wrapper">
          {orgsError ? (
            <div className="empty-state">
              <p className="error-text">{orgsError}</p>
            </div>
          ) : orgsLoading ? (
            <div className="empty-state">
              <p>Loading organisations…</p>
            </div>
          ) : displayedOrgs.length === 0 ? (
            <div className="empty-state">
              <p>No organisations found{search ? ' matching your search' : ''}.</p>
            </div>
          ) : (
            <table className="orgs-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('companyName')}>
                    Organisation <SortIcon active={sortKey === 'companyName'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('vehicleCount')}>
                    Vehicles <SortIcon active={sortKey === 'vehicleCount'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('userCount')}>
                    Users <SortIcon active={sortKey === 'userCount'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('tripCount')}>
                    Trips <SortIcon active={sortKey === 'tripCount'} dir={sortDir} />
                  </th>
                  <th className="sortable" onClick={() => handleSort('totalExpenses')}>
                    Expenses <SortIcon active={sortKey === 'totalExpenses'} dir={sortDir} />
                  </th>
                  <th>Status</th>
                  <th className="sortable" onClick={() => handleSort('createdAt')}>
                    Created <SortIcon active={sortKey === 'createdAt'} dir={sortDir} />
                  </th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {displayedOrgs.map((org) => (
                  <tr
                    key={org._id}
                    className="orgs-table-row-clickable"
                    onClick={() => navigate(`/superadmin/organizations/${org._id}`)}
                  >
                    {/* Name + email */}
                    <td>
                      <div className="org-name-cell">
                        <span className="org-company-name">
                          {org.companyName || <span className="no-name">Unnamed Org</span>}
                        </span>
                        <span className="org-email">{org.ownerEmail}</span>
                      </div>
                    </td>
                    {/* Vehicles */}
                    <td>
                      <span className="num">{org.vehicleCount}</span>
                    </td>
                    {/* Users */}
                    <td>
                      <span className="num">{org.userCount}</span>
                    </td>
                    {/* Trips */}
                    <td>
                      <span className="num">{org.tripCount}</span>
                    </td>
                    {/* Expenses */}
                    <td>
                      <span className="num expense-value">{formatCurrency(org.totalExpenses)}</span>
                    </td>
                    {/* Status badge */}
                    <td>
                      {org.isOnboarded ? (
                        <span className="status-badge status-active">
                          <CheckCircle2 size={11} />
                          Active
                        </span>
                      ) : (
                        <span className="status-badge status-pending">
                          <Clock size={11} />
                          Pending
                        </span>
                      )}
                    </td>
                    {/* Created */}
                    <td>
                      <span className="date-value">{formatDate(org.createdAt)}</span>
                    </td>
                    {/* View action */}
                    <td>
                      <span className="orgs-table-view-link">
                        View <ArrowRight size={13} />
                      </span>
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

export default SuperAdminPage;
