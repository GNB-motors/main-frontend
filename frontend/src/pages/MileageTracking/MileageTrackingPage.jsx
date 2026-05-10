import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, ChevronRight, FileText, Satellite } from 'lucide-react';
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
                  <TableHead><Satellite size={13} style={{ display: 'inline', marginRight: 4 }} />GPS</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntervals.map((interval) => (
                  <TableRow
                    key={interval._id}
                    className="trip-table-row"
                    onClick={() => navigate(`/mileage-tracking/${interval._id}`)}
                  >
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
                      <span className="status-badge" style={getFeStatusStyle(interval.fleetEdge?.status)}>
                        {getFeStatusLabel(interval.fleetEdge?.status)}
                      </span>
                    </TableCell>
                    <TableCell className="last-col">
                      <span className="date-text">{formatDate(interval.startDate)}</span>
                      <button
                        className="view-details-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/mileage-tracking/${interval._id}`); }}
                      >
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
    </div>
  );
};

export default MileageTrackingPage;
