import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, ChevronRight, FileText, X, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const MileageTrackingPage = () => {
  const navigate = useNavigate();
  const [intervals, setIntervals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [selectedInterval, setSelectedInterval] = useState(null);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
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

  const getTelemetryBadge = (fleetEdge) => {
    if (!fleetEdge || !fleetEdge.status) return <span style={{ color: '#9ca3af', fontSize: '13px' }}>-</span>;
    if (fleetEdge.status === 'COMPUTED') {
      if (fleetEdge.isFlagged) {
        return <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><AlertTriangle size={14} /> Flagged</span>;
      }
      return <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><CheckCircle size={14} /> Verified</span>;
    }
    if (fleetEdge.status === 'PENDING') return <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><Clock size={14} /> Computing</span>;
    return <span style={{ color: '#9ca3af', fontSize: '13px' }}>No Data</span>;
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderPageItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - pagination.page) <= 1) items.push(i);
      else if (items[items.length - 1] !== '...') items.push('...');
    }
    return items;
  };

  return (
    <div className="page-container mileage-listing-container">
      {/* Header */}
      <div className="mileage-listing-header">
        <div className="header-content">
          <div className="header-left">
            <h2>Mileage Tracking</h2>
            <span className="header-count">{pagination.total}</span>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <Search width={18} height={18} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search by vehicle or status..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mileage-content-area">
        {isLoading ? (
          <div className="loading-state"><p>Loading mileage records...</p></div>
        ) : filteredIntervals.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="#9ca3af" />
            <p>No mileage records found</p>
            {searchQuery && <p className="empty-subtext">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="table-wrapper">
            <Table>
              <TableHeader>
                <TableRow className="table-header-row">
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Odometer Range</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Fuel (L)</TableHead>
                  <TableHead>Mileage (km/L)</TableHead>
                  <TableHead>Telemetry</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntervals.map((interval) => (
                  <TableRow key={interval._id} className="trip-table-row">
                    <TableCell className="font-semibold text-gray-900">
                      {interval.vehicleId?.registrationNumber || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span className="status-badge" style={getStatusStyle(interval.status)}>
                        {interval.status}
                      </span>
                    </TableCell>
                    <TableCell>{interval.startOdometer} ➝ {interval.endOdometer || '...'}</TableCell>
                    <TableCell>{interval.distanceKm ? interval.distanceKm.toFixed(1) : '-'}</TableCell>
                    <TableCell>{interval.fuelConsumedLiters ? interval.fuelConsumedLiters.toFixed(2) : '-'}</TableCell>
                    <TableCell>
                      {interval.mileageKmPerL ? (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>{interval.mileageKmPerL.toFixed(2)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {getTelemetryBadge(interval.fleetEdge)}
                    </TableCell>
                    <TableCell className="last-col">
                      <span className="date-text">{formatDate(interval.startDate)}</span>
                      <button className="view-details-btn" onClick={() => {
                        // Normalize fleetEdge: Interval uses fuelConsumedLiters, Trip uses fuelConsumedL
                        const fe = interval.fleetEdge;
                        const normalizedInterval = fe ? {
                          ...interval,
                          fleetEdge: { ...fe, fuelConsumedLiters: fe.fuelConsumedLiters ?? fe.fuelConsumedL }
                        } : interval;
                        setSelectedInterval(normalizedInterval);
                      }}>
                        View details <ChevronRight size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredIntervals.length > 0 && totalPages > 1 && (
          <div className="pagination-wrapper">
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className={pagination.page <= 1 ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
                {renderPageItems().map((item, idx) =>
                  item === '...' ? (
                    <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink isActive={pagination.page === item} onClick={() => setPagination(p => ({ ...p, page: item }))}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => pagination.page < totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className={pagination.page >= totalPages ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInterval && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>Mileage Interval Details</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {selectedInterval.vehicleId?.registrationNumber} • {formatDate(selectedInterval.startDate)}
                </p>
              </div>
              <button onClick={() => setSelectedInterval(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Driver Submitted Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Logged Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Odometer</label>
                    <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                      {selectedInterval.startOdometer} <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}>to</span> {selectedInterval.endOdometer || '?'}
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Distance</label>
                    <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                      {selectedInterval.distanceKm ? selectedInterval.distanceKm.toFixed(1) : '-'} <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>km</span>
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Fuel Used</label>
                    <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                      {selectedInterval.fuelConsumedLiters ? selectedInterval.fuelConsumedLiters.toFixed(2) : '-'} <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>L</span>
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Mileage</label>
                    <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                      {selectedInterval.mileageKmPerL ? selectedInterval.mileageKmPerL.toFixed(2) : '-'} <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>km/L</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* FleetEdge Verification Section */}
              {selectedInterval.fleetEdge && selectedInterval.fleetEdge.status && (
                <div style={{
                  background: selectedInterval.fleetEdge.isFlagged ? '#fef2f2' : (selectedInterval.fleetEdge.status === 'COMPUTED' ? '#f0fdf4' : 'white'),
                  border: '1.5px solid',
                  borderColor: selectedInterval.fleetEdge.isFlagged ? '#fecaca' : (selectedInterval.fleetEdge.status === 'COMPUTED' ? '#bbf7d0' : '#e5e7eb'),
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    {selectedInterval.fleetEdge.status === 'PENDING' && <Clock width={20} height={20} color="#6b7280" />}
                    {selectedInterval.fleetEdge.status === 'COMPUTED' && !selectedInterval.fleetEdge.isFlagged && <CheckCircle width={20} height={20} color="#16a34a" />}
                    {selectedInterval.fleetEdge.isFlagged && <AlertTriangle width={20} height={20} color="#dc2626" />}
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600',
                      color: selectedInterval.fleetEdge.isFlagged ? '#991b1b' : (selectedInterval.fleetEdge.status === 'COMPUTED' ? '#166534' : '#111827')
                    }}>
                      FleetEdge Telemetry Verification
                    </h3>
                    {selectedInterval.fleetEdge.status === 'COMPUTED' && (
                      <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6b7280' }}>
                        Based on {selectedInterval.fleetEdge.snapshotCount} GPS snapshots
                      </span>
                    )}
                  </div>

                  {selectedInterval.fleetEdge.status === 'PENDING' && (
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Gathering GPS and fuel telemetry data from Tata Motors FleetEdge. This usually takes a few minutes after interval completion...</p>
                  )}

                  {selectedInterval.fleetEdge.status === 'NO_DATA' && (
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>No telemetry data was available from Tata Motors FleetEdge for this time period.</p>
                  )}

                  {selectedInterval.fleetEdge.status === 'FAILED' && (
                    <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>Failed to compute telemetry data. Please try again later.</p>
                  )}

                  {selectedInterval.fleetEdge.status === 'COMPUTED' && (
                    <>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        marginBottom: selectedInterval.fleetEdge.isFlagged ? '16px' : '0'
                      }}>
                        <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Verified Distance</label>
                          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                            {selectedInterval.fleetEdge.distanceKm ? selectedInterval.fleetEdge.distanceKm.toFixed(1) : '-'} <span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>km</span>
                          </p>
                          {selectedInterval.fleetEdge.distanceVariancePct !== undefined && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: selectedInterval.fleetEdge.isFlaggedDistance ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                              {selectedInterval.fleetEdge.distanceVariancePct > 0 ? '+' : ''}{selectedInterval.fleetEdge.distanceVariancePct.toFixed(1)}% vs logged
                            </p>
                          )}
                        </div>

                        <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Verified Fuel</label>
                          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                            {selectedInterval.fleetEdge.fuelConsumedLiters ? selectedInterval.fleetEdge.fuelConsumedLiters.toFixed(2) : '-'} <span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>L</span>
                          </p>
                          {selectedInterval.fleetEdge.fuelVariancePct !== undefined && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: selectedInterval.fleetEdge.isFlaggedFuel ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                              {selectedInterval.fleetEdge.fuelVariancePct > 0 ? '+' : ''}{selectedInterval.fleetEdge.fuelVariancePct.toFixed(1)}% vs logged
                            </p>
                          )}
                        </div>

                        <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>Verified Mileage</label>
                          <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                            {selectedInterval.fleetEdge.mileageKmPerL ? selectedInterval.fleetEdge.mileageKmPerL.toFixed(2) : '-'} <span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>km/L</span>
                          </p>
                          {selectedInterval.fleetEdge.mileageVariancePct !== undefined && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: selectedInterval.fleetEdge.isFlaggedMileage ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                              {selectedInterval.fleetEdge.mileageVariancePct > 0 ? '+' : ''}{selectedInterval.fleetEdge.mileageVariancePct.toFixed(1)}% vs logged
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedInterval.fleetEdge.isFlagged && selectedInterval.fleetEdge.flagReasons && selectedInterval.fleetEdge.flagReasons.length > 0 && (
                        <div style={{ padding: '12px 16px', background: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '4px' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>Discrepancies Detected:</p>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b', fontSize: '13px' }}>
                            {selectedInterval.fleetEdge.flagReasons.map((reason, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', background: '#f9fafb', borderRadius: '0 0 12px 12px' }}>
              <button 
                onClick={() => setSelectedInterval(null)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MileageTrackingPage;
