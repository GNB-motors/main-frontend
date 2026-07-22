import { formatDateIST } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, FileText, Plus, ChevronLeft, AlertTriangle, CheckCircle2, Clock, Minus } from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';

const PAGE_SIZE = 10;

const AlertCell = ({ interval }) => {
  const fe = interval.fleetEdge || {};
  const isFlagged = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
  const reasons = fe.flagReasons || [];

  if (interval.status === 'ONGOING' || fe.status === 'PENDING') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C56200', fontSize: 12, fontWeight: 500 }}>
        <Clock size={13} /> Pending
      </span>
    );
  }
  if (fe.status === 'FAILED' || fe.status === 'NO_DATA') {
    return (
      <span style={{ color: '#9ca3af', fontSize: 12 }}>No GPS</span>
    );
  }
  if (isFlagged && reasons.length > 0) {
    return (
      <span
        title={reasons.join('\n')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b91c1c', fontSize: 12, fontWeight: 500, cursor: 'help' }}
      >
        <AlertTriangle size={13} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }
  if (fe.status === 'COMPUTED') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#187A32', fontSize: 12, fontWeight: 500 }}>
        <CheckCircle2 size={13} /> OK
      </span>
    );
  }
  return <span style={{ color: '#9ca3af' }}><Minus size={13} /></span>;
};

const MileageTrackingVehicleDetail = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [intervals, setIntervals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [vehicleInfo, setVehicleInfo] = useState(null);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  const fetchIntervals = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/mileage/intervals', {
        params: { page: pagination.page, limit: pagination.limit, vehicleId }
      });
      const data = res.data?.data || [];
      setIntervals(data);
      if (data.length > 0 && !vehicleInfo) {
        setVehicleInfo(data[0].vehicleId);
      }
      const total = res.data?.pagination?.total ?? res.data?.total ?? res.data?.meta?.total ?? 0;
      setPagination(p => ({ ...p, total }));
    } catch {
      toast.error('Failed to load mileage records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchIntervals(); }, [pagination.page, vehicleId]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

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
      {/* Breadcrumb Header */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <button onClick={() => navigate('/mileage-tracking')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
          <ChevronLeft size={16} />
          <span style={{ marginLeft: 4 }}>Fleet Overview</span>
        </button>
        <ChevronRight size={14} color="#9ca3af" />
        <span style={{ fontWeight: 600, color: '#111827' }}>
          {vehicleInfo ? vehicleInfo.registrationNumber : 'Vehicle Logs'}
        </span>
      </div>

      {/* Content */}
      <div className="mileage-content-area" style={{ height: 'calc(100% - 60px)' }}>
        <div className="mileage-table-container">
          <div className={`mileage-table-wrapper${isLoading || intervals.length === 0 ? ' is-empty' : ''}`}>
            <table className="mileage-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pump Location</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Start Odo</th>
                  <th>End Odo</th>
                  <th>Distance</th>
                  <th>Fuel (L)</th>
                  <th>Mileage (km/L)</th>
                  <th>DEF</th>
                  <th>Cost (₹)</th>
                  <th>Alert</th>
                  <th></th>
                </tr>
              </thead>
              {!isLoading && intervals.length > 0 && (
                <tbody>
                  {intervals.map((interval) => (
                    <tr
                      key={interval._id}
                      className="mileage-table-row"
                      onClick={() => navigate(`/mileage-tracking/${interval._id}`)}
                    >
                      <td>{formatDate(interval.startDate)}</td>
                      <td>{interval.pumpName || '—'}</td>
                      <td>{interval.routeSource?.name || '—'}</td>
                      <td>{interval.routeDestination?.name || '—'}</td>
                      <td>{interval.startOdometer != null ? interval.startOdometer.toLocaleString() : '—'}</td>
                      <td>{interval.endOdometer != null ? interval.endOdometer.toLocaleString() : '...'}</td>
                      <td>{interval.distanceKm != null ? `${interval.distanceKm.toFixed(1)} km` : '—'}</td>
                      <td>{interval.fuelConsumedLiters != null ? interval.fuelConsumedLiters.toFixed(2) : '—'}</td>
                      <td>
                        {interval.mileageKmPerL != null ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{interval.mileageKmPerL.toFixed(2)}</span>
                        ) : '—'}
                      </td>
                      <td>{interval.fleetEdge?.defConsumed != null ? `${interval.fleetEdge.defConsumed.toFixed(1)} L` : '—'}</td>
                      <td>
                        {interval.fuelCost != null ? (
                          <span style={{ fontWeight: 600 }}>₹{interval.fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        ) : '—'}
                      </td>
                      <td><AlertCell interval={interval} /></td>
                      <td className="mileage-last-col">
                        <button
                          className="view-details-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/mileage-tracking/${interval._id}`); }}
                        >
                          <ChevronRight size={14} />
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
            {!isLoading && intervals.length === 0 && (
              <div className="empty-state">
                <FileText size={48} color="#9ca3af" />
                <p>No mileage records found</p>
                <button className="empty-action-btn" onClick={() => navigate('/mileage-tracking/new')}>
                  <Plus size={16} /> Log Fuel
                </button>
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

export default MileageTrackingVehicleDetail;
