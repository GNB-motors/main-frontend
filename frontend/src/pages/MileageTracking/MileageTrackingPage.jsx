import { formatDateIST } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, FileText, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';

const PAGE_SIZE = 10;

const MileageTrackingPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  // Receive search input from the Navbar
  useEffect(() => {
    const handleSearch = (e) => {
      setSearchQuery(e.detail?.value ?? '');
      setPagination(p => ({ ...p, page: 1 }));
    };
    window.addEventListener('mileageSearchChange', handleSearch);
    return () => window.removeEventListener('mileageSearchChange', handleSearch);
  }, []);

  // Push total count up to the Navbar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mileageCountUpdate', { detail: { count: pagination.total } }));
  }, [pagination.total]);

  // Reset Navbar state on unmount
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent('mileageCountUpdate', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('mileageSearchReset', { detail: { value: '' } }));
  }, []);

  const fetchFleetOverview = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/mileage/fleet-overview', {
        params: { page: pagination.page, limit: pagination.limit, search: searchQuery }
      });
      setVehicles(res.data?.data || []);
      const total = res.data?.meta?.total ?? 0;
      setPagination(p => ({ ...p, total }));
    } catch {
      toast.error('Failed to load fleet mileage overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFleetOverview(); }, [pagination.page, searchQuery]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const formatDate = (d) => d ? formatDateIST(d) : '-';

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(p => ({ ...p, page }));
    }
  };

  const getHealthStatusDisplay = (status) => {
    switch (status) {
      case 'GOOD':
        return <span style={{ display: 'flex', alignItems: 'center', color: '#187A32', fontSize: '13px', fontWeight: 500 }}><CheckCircle2 size={14} style={{ marginRight: 4 }} /> Good</span>;
      case 'NEEDS_REVIEW':
        return <span style={{ display: 'flex', alignItems: 'center', color: '#C56200', fontSize: '13px', fontWeight: 500 }}><Clock size={14} style={{ marginRight: 4 }} /> Stale Data</span>;
      case 'NO_DATA':
        return <span style={{ display: 'flex', alignItems: 'center', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}><AlertCircle size={14} style={{ marginRight: 4 }} /> No Data</span>;
      default:
        return '-';
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
          <div className={`mileage-table-wrapper${isLoading || vehicles.length === 0 ? ' is-empty' : ''}`}>
            <table className="mileage-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Completed Trips</th>
                  <th>Average Mileage (km/L)</th>
                  <th>Last Odometer</th>
                  <th>Last Refuel Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              {!isLoading && vehicles.length > 0 && (
                <tbody>
                  {vehicles.map((v) => (
                    <tr
                      key={v.vehicleId}
                      className="mileage-table-row"
                      onClick={() => navigate(`/mileage-tracking/vehicle/${v.vehicleId}`)}
                    >
                      <td className="mileage-vehicle-cell">
                        {v.vehicleNumber || 'Unknown'}
                      </td>
                      <td>{v.completedTrips}</td>
                      <td>
                        {v.avgMileage ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{v.avgMileage.toFixed(2)}</span>
                        ) : '-'}
                      </td>
                      <td>{v.lastOdometer || '-'}</td>
                      <td><span className="date-text">{formatDate(v.lastRefuelDate)}</span></td>
                      <td>{getHealthStatusDisplay(v.healthStatus)}</td>
                      <td className="mileage-last-col">
                        <button
                          className="view-details-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/mileage-tracking/vehicle/${v.vehicleId}`); }}
                        >
                          View logs <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {isLoading && (
              <div className="loading-state"><p>Loading fleet overview...</p></div>
            )}
            {!isLoading && vehicles.length === 0 && (
              <div className="empty-state">
                <FileText size={48} color="#9ca3af" />
                <p>No vehicles found for mileage tracking</p>
                {searchQuery && <p className="empty-subtext">Try adjusting your search</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
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