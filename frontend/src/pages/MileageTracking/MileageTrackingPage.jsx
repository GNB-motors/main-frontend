import { formatDateIST } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, FileText, Satellite, Plus } from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';

const PAGE_SIZE = 10;

const FE_STATUS_BADGE = {
  COMPUTED: { label: 'GPS ✓', bg: 'rgba(37,186,76,0.1)', color: '#187A32' },
  PENDING:  { label: 'GPS Pending', bg: 'rgba(251,191,35,0.1)', color: '#C56200' },
  FAILED:   { label: 'GPS Failed', bg: 'rgba(239,68,68,0.1)', color: '#b91c1c' },
  NO_DATA:  { label: 'No GPS', bg: 'rgba(156,163,175,0.1)', color: '#6b7280' },
};

const MileageTrackingPage = () => {
  const navigate = useNavigate();
  const [intervals, setIntervals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  // Push total count up to the Navbar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mileageCountUpdate', { detail: { count: pagination.total } }));
  }, [pagination.total]);

  // Receive search input from the Navbar
  useEffect(() => {
    const handleSearch = (e) => {
      setSearchQuery(e.detail?.value ?? '');
      setPagination(p => ({ ...p, page: 1 }));
    };
    window.addEventListener('mileageSearchChange', handleSearch);
    return () => window.removeEventListener('mileageSearchChange', handleSearch);
  }, []);

  // Reset Navbar state on unmount
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent('mileageCountUpdate', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('mileageSearchReset', { detail: { value: '' } }));
  }, []);

  const fetchIntervals = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/mileage/intervals', {
        params: { page: pagination.page, limit: pagination.limit }
      });
      setIntervals(res.data?.data || []);
      const total = res.data?.pagination?.total ?? res.data?.total ?? res.data?.meta?.total ?? 0;
      setPagination(p => ({ ...p, total }));
    } catch {
      toast.error('Failed to load mileage records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchIntervals(); }, [pagination.page]);

  const filteredIntervals = searchQuery
    ? intervals.filter(i => {
        const q = searchQuery.toLowerCase();
        const reg = (i.vehicleId?.registrationNumber || '').toLowerCase();
        const status = (i.status || '').toLowerCase();
        return reg.includes(q) || status.includes(q);
      })
    : intervals;

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const getStatusStyle = (status) => {
    if (status === 'COMPLETED') return { backgroundColor: 'rgba(37, 186, 76, 0.10)', color: '#187A32' };
    return { backgroundColor: 'rgba(251, 191, 35, 0.10)', color: '#C56200' };
  };

  const getFeStatusStyle = (feStatus) => {
    const s = FE_STATUS_BADGE[feStatus] || FE_STATUS_BADGE.PENDING;
    return { backgroundColor: s.bg, color: s.color };
  };

  const getFeStatusLabel = (feStatus) => (FE_STATUS_BADGE[feStatus] || FE_STATUS_BADGE.PENDING).label;

  const formatDate = (d) => formatDateIST(d);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(p => ({ ...p, page }));
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pagination.page > 3) pages.push('...');
      for (let i = Math.max(2, pagination.page - 1); i <= Math.min(totalPages - 1, pagination.page + 1); i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (pagination.page < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="page-container mileage-listing-container">
      {/* Content */}
      <div className="mileage-content-area">
        <div className="mileage-table-container">
          <div className={`mileage-table-wrapper${isLoading || filteredIntervals.length === 0 ? ' is-empty' : ''}`}>
            <table className="mileage-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Odometer Range</th>
                  <th>Distance (km)</th>
                  <th>Fuel (L)</th>
                  <th>Mileage (km/L)</th>
                  <th><Satellite size={13} style={{ display: 'inline', marginRight: 4 }} />GPS</th>
                  <th>Date</th>
                </tr>
              </thead>
              {!isLoading && filteredIntervals.length > 0 && (
                <tbody>
                  {filteredIntervals.map((interval) => (
                    <tr
                      key={interval._id}
                      className="mileage-table-row"
                      onClick={() => navigate(`/mileage-tracking/${interval._id}`)}
                    >
                      <td className="mileage-vehicle-cell">
                        {interval.vehicleId?.registrationNumber || 'Unknown'}
                      </td>
                      <td>
                        <span className="status-badge" style={getStatusStyle(interval.status)}>
                          {interval.status}
                        </span>
                      </td>
                      <td>{interval.startOdometer} ➝ {interval.endOdometer || '...'}</td>
                      <td>{interval.distanceKm ? interval.distanceKm.toFixed(1) : '-'}</td>
                      <td>{interval.fuelConsumedLiters ? interval.fuelConsumedLiters.toFixed(2) : '-'}</td>
                      <td>
                        {interval.mileageKmPerL ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{interval.mileageKmPerL.toFixed(2)}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className="status-badge" style={getFeStatusStyle(interval.fleetEdge?.status)}>
                          {getFeStatusLabel(interval.fleetEdge?.status)}
                        </span>
                      </td>
                      <td className="mileage-last-col">
                        <span className="date-text">{formatDate(interval.startDate)}</span>
                        <button
                          className="view-details-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/mileage-tracking/${interval._id}`); }}
                        >
                          View details <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {isLoading && (
              <div className="loading-state"><p>Loading mileage records...</p></div>
            )}
            {!isLoading && filteredIntervals.length === 0 && (
              <div className="empty-state">
                <FileText size={48} color="#9ca3af" />
                <p>No mileage records found</p>
                {searchQuery ? (
                  <p className="empty-subtext">Try adjusting your search</p>
                ) : (
                  <button className="empty-action-btn" onClick={() => navigate('/mileage-tracking/new')}>
                    <Plus size={16} /> Log Fuel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination Footer — matches DriversPage */}
      {pagination.total > 0 && (
      <div className="mileage-pagination-controls">
        <button
          className="mileage-pagination-btn"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || totalPages <= 1}
        >
          <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
        </button>

        {generatePageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <div key={`overflow-${index}`} className="mileage-page-overflow">
                <span>...</span>
              </div>
            );
          }
          return (
            <button
              key={page}
              className={`mileage-page-number ${pagination.page === page ? 'mileage-page-number-current' : ''}`}
              onClick={() => handlePageChange(page)}
              disabled={totalPages <= 1}
            >
              <span>{page}</span>
            </button>
          );
        })}

        <button
          className="mileage-pagination-btn"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === totalPages || totalPages <= 1}
        >
          <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>
      )}
    </div>
  );
};

export default MileageTrackingPage;