
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import TripDashboardService from './TripDashboardService';
import '../../styles/erp.css'; // Make sure the path is correct depending on the location of this file

const ERP_TRIP_STATES = [
  'PLACED',
  'ADVANCE_PENDING',
  'ADVANCE_PAID',
  'CN_PENDING',
  'CN_UPDATED',
  'TRIP_CLOSED',
  'POD_RECEIVED',
  'UNLOADED',
  'BILLED',
  'CANCELLED',
];

const TripDashboardPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, limit: 20 });
  const [filters, setFilters] = useState({
    search: '',
    state: '',
  });

  const fetchTrips = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = { page, limit: meta.limit };
      if (filters.search.trim()) queryParams.search = filters.search.trim();
      if (filters.state) queryParams.state = filters.state;

      const res = await TripDashboardService.listTrips(queryParams);
      setTrips(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state]); // Reload when state filter changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrips(1);
  };

  const getBadgeClass = (state) => {
    switch (state) {
      case 'PLACED':
      case 'ADVANCE_PENDING':
        return 'warning';
      case 'ADVANCE_PAID':
      case 'CN_UPDATED':
      case 'POD_RECEIVED':
      case 'UNLOADED':
        return 'info';
      case 'TRIP_CLOSED':
      case 'BILLED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="erp-page">
      <header className="erp-header">
        <div>
          <h1>Trip Dashboard</h1>
          <p className="erp-subtitle">Centralized tracking of all trips across the ERP pipeline.</p>
        </div>
      </header>

      <div className="erp-toolbar">
        <form className="erp-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="erp-input"
            placeholder="Search Trip No..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div className="erp-filters">
          <select
            className="erp-input"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          >
            <option value="">All States</option>
            {ERP_TRIP_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Trip No</th>
              <th>Date</th>
              <th>Overall Stage</th>
              <th>Advance Gate</th>
              <th>CN Gate</th>
              <th>Vehicle</th>
              <th>Party</th>
              <th>Route (From ➔ To)</th>
              <th>Material</th>
              <th>Qty (P / L)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="erp-muted">Loading...</td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={10} className="erp-muted">No trips found.</td>
              </tr>
            ) : (
              trips.map((t) => (
                <tr key={t._id}>
                  <td>
                    <strong>
                      <Link to={`/erp/trips/${t._id}`} style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>{t.tripNumber}</Link>
                    </strong>
                  </td>
                  <td>{new Date(t.tripDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`erp-badge ${getBadgeClass(t.state)}`}>
                      {t.state}
                    </span>
                  </td>
                  <td>
                    {t.state === 'PLACED' ? (
                      <span className={`erp-badge ${getBadgeClass(t.advanceGate)}`}>
                        {t.advanceGate}
                      </span>
                    ) : (
                      <span className="erp-muted">—</span>
                    )}
                  </td>
                  <td>
                    {t.state === 'PLACED' ? (
                      <span className={`erp-badge ${getBadgeClass(t.cnGate)}`}>
                        {t.cnGate}
                      </span>
                    ) : (
                      <span className="erp-muted">—</span>
                    )}
                  </td>
                  <td>{t.vehicleNumber || '—'}</td>
                  <td>{t.partyId?.name || '—'}</td>
                  <td>
                    {t.fromLocation ? `${t.fromLocation} ➔ ${t.toLocation}` : '—'}
                  </td>
                  <td>{t.material || '—'}</td>
                  <td>
                    {t.plannedQty || 0} / {t.loadedQty !== null ? t.loadedQty : '?'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && meta.totalPages > 1 && (
        <div className="erp-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={meta.page <= 1}
            onClick={() => fetchTrips(meta.page - 1)}
          >
            Previous
          </button>
          <span className="erp-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={meta.page >= meta.totalPages}
            onClick={() => fetchTrips(meta.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TripDashboardPage;
