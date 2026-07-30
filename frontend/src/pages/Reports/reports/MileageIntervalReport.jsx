import React, { useState, useEffect, useMemo } from 'react';
import { Box, Alert } from '@mui/material';
import dayjs from 'dayjs';
import { AlertTriangle, CheckCircle2, Clock, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import TableShimmer from '@/components/ui/TableShimmer';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';
import apiClient from '../../../utils/axiosConfig';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';

const COLUMN_COUNT = 15;
const PAGE_SIZE = 10;

const formatNumber = (value, digits = 0) =>
  typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: digits }) : '—';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—';

const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—');

const AlertCell = ({ alert }) => {
  const status = alert?.status;
  const reasons = alert?.reasons || [];

  if (status === 'PENDING') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C56200', fontSize: 12, fontWeight: 500 }}>
        <Clock size={13} /> Pending
      </span>
    );
  }
  if (status === 'NO_GPS') {
    return <span style={{ color: '#9ca3af', fontSize: 12 }}>No GPS</span>;
  }
  if (status === 'FLAGGED') {
    return (
      <span
        title={reasons.join('\n')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b91c1c', fontSize: 12, fontWeight: 500, cursor: 'help' }}
      >
        <AlertTriangle size={13} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }
  if (status === 'OK') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#187A32', fontSize: 12, fontWeight: 500 }}>
        <CheckCircle2 size={13} /> OK
      </span>
    );
  }
  return <span style={{ color: '#9ca3af' }}><Minus size={13} /></span>;
};

const toStartOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).startOf('day').toISOString();
};

const toEndOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).endOf('day').toISOString();
};

const MileageIntervalReport = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [driverId, setDriverId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [vehiclesRes, employees] = await Promise.all([
          apiClient.get('api/vehicles', { params: { limit: 200 } }),
          ReportsService.getEmployees({ limit: 200 }),
        ]);
        const vehicles = vehiclesRes.data?.data || vehiclesRes.data || [];
        setVehicleOptions(
          (Array.isArray(vehicles) ? vehicles : []).map((v) => ({
            id: String(v._id || v.id),
            label: v.registrationNumber || v.vehicleNumber || '—',
          })).filter((v) => v.id && v.id !== 'undefined'),
        );
        setDriverOptions(
          (Array.isArray(employees) ? employees : [])
            .filter((d) => !d.role || d.role === 'DRIVER')
            .map((d) => ({
              id: String(d._id || d.id),
              label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
            }))
            .filter((d) => d.id && d.id !== 'undefined'),
        );
      } catch (err) {
        console.error('Failed to load report filters:', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const fetchRows = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        const startIso = toStartOfDayIso(startDate);
        const endIso = toEndOfDayIso(endDate);
        if (startIso) params.startDate = startIso;
        if (endIso) params.endDate = endIso;
        if (vehicleId && vehicleId !== 'all') params.vehicleId = String(vehicleId);
        if (driverId && driverId !== 'all') params.driverId = String(driverId);

        const result = await ReportsService.getMileageIntervalReports(params);
        setRows(Array.isArray(result.data) ? result.data : []);
        setMeta(result.meta || { total: 0, page: currentPage, limit: PAGE_SIZE, totalPages: 0 });
      } catch (err) {
        console.error('Failed to fetch mileage interval reports:', err);
        setError(err.detail || err.message || 'Could not load mileage report.');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRows();
  }, [currentPage, startDate, endDate, vehicleId, driverId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, vehicleId, driverId]);

  const totalPages = meta.totalPages || 1;

  const renderPageItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== '...') {
        items.push('...');
      }
    }
    return items;
  };

  const selectedVehicleLabel = useMemo(() => {
    if (vehicleId === 'all') return 'All Vehicles';
    return vehicleOptions.find((v) => v.id === vehicleId)?.label || 'All Vehicles';
  }, [vehicleId, vehicleOptions]);

  const selectedDriverLabel = useMemo(() => {
    if (driverId === 'all') return 'All Drivers';
    return driverOptions.find((d) => d.id === driverId)?.label || 'All Drivers';
  }, [driverId, driverOptions]);

  /** Same filters as the table fetch — CSV export must use these so only matching rows are downloaded. */
  const buildFilterParams = () => {
    const params = {};
    const startIso = toStartOfDayIso(startDate);
    const endIso = toEndOfDayIso(endDate);
    if (startIso) params.startDate = startIso;
    if (endIso) params.endDate = endIso;
    if (vehicleId && vehicleId !== 'all') params.vehicleId = String(vehicleId);
    if (driverId && driverId !== 'all') params.driverId = String(driverId);
    return params;
  };

  const downloadCsv = async (extension) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportFilteredReportCsv({
        fetchExport: (filters) =>
          ReportsService.exportReportCsv('api/reports/mileage-intervals/export', filters),
        filters: buildFilterParams(),
        filenamePrefix: 'mileage_interval_report',
        extension,
        errorMessage: 'Could not export mileage report.',
      });
    } catch {
      // toast handled inside exportFilteredReportCsv
    } finally {
      setIsExporting(false);
    }
  };

  const exportBtnStyle = {
    width: '44px',
    height: '44px',
    padding: '6px 8px',
    background: '#F8F8FB',
    borderRadius: '8px',
    border: '1px solid #ECECEE',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  };

  return (
    <Box sx={{ padding: '24px' }}>
      <div className="report-header-section">
        <div className="report-header-top">
          <h3 className="report-title">Mileage Report</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => downloadCsv('csv')}
              disabled={isExporting}
              style={{ ...exportBtnStyle, opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'wait' : 'pointer' }}
              onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.background = '#ECECEE'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8F8FB'; }}
              title="Export filtered rows to CSV"
            >
              <CsvIcon width={24} height={24} />
            </button>
            <button
              onClick={() => downloadCsv('xlsx')}
              disabled={isExporting}
              style={{ ...exportBtnStyle, opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'wait' : 'pointer' }}
              onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.background = '#ECECEE'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8F8FB'; }}
              title="Export filtered rows to Excel"
            >
              <ExcelIcon width={22} height={22} />
            </button>
          </div>
        </div>

        <div className="report-filters">
          <div className="date-input-group">
            <label>From</label>
            <input
              type="date"
              className="report-date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>
          <div className="date-input-group">
            <label>To</label>
            <input
              type="date"
              className="report-date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
            />
          </div>
          <div className="date-input-group">
            <label>Vehicle</label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="h-10 w-[180px] text-sm">
                <SelectValue>{selectedVehicleLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicleOptions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="date-input-group">
            <label>Driver</label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className="h-10 w-[180px] text-sm">
                <SelectValue>{selectedDriverLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All Drivers</SelectItem>
                {driverOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(startDate || endDate || vehicleId !== 'all' || driverId !== 'all') && (
            <div className="date-input-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setVehicleId('all');
                  setDriverId('all');
                }}
                style={{
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid #ECECEE',
                  background: '#fff',
                  fontSize: 13,
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="report-content">
          <TableShimmer columns={COLUMN_COUNT} rows={10} />
        </div>
      )}

      {error && !isLoading && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!isLoading && !error && (
        <div className="report-content">
          <div className="table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr className="table-header-row">
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Pump Location</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Start Odo</th>
                  <th>End Odo</th>
                  <th>Distance</th>
                  <th>Fuel (L)</th>
                  <th>Mileage</th>
                  <th>DEF</th>
                  <th>Cost</th>
                  <th>Alert</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} className="vehicle-empty-state">
                      No mileage records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="trip-table-row">
                      <td><div className="cell-primary">{formatDate(row.startDate || row.date)}</div></td>
                      <td>
                        <div className="cell-primary">
                          {row.endDate ? formatDate(row.endDate) : (row.intervalStatus === 'ONGOING' ? '...' : '—')}
                        </div>
                      </td>
                      <td><div className="cell-primary">{row.vehicleNumber || '—'}</div></td>
                      <td><div className="cell-primary">{row.driverName || '—'}</div></td>
                      <td><div className="cell-primary">{row.pumpLocation || '—'}</div></td>
                      <td><div className="cell-primary">{row.source?.name || '—'}</div></td>
                      <td><div className="cell-primary">{row.destination?.name || '—'}</div></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary">{formatNumber(row.startOdo)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary">{row.endOdo != null ? formatNumber(row.endOdo) : '...'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary">
                          {typeof row.distanceKm === 'number' ? `${row.distanceKm.toFixed(1)} km` : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary">
                          {typeof row.fuelLiters === 'number' ? row.fuelLiters.toFixed(2) : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary" style={typeof row.mileageKmPerL === 'number' ? { color: '#2563eb', fontWeight: 600 } : undefined}>
                          {typeof row.mileageKmPerL === 'number' ? row.mileageKmPerL.toFixed(2) : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary">
                          {typeof row.defLiters === 'number' ? `${row.defLiters.toFixed(1)} L` : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cell-primary" style={{ fontWeight: 600 }}>{formatCurrency(row.cost)}</div>
                      </td>
                      <td><AlertCell alert={row.alert} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.total > 0 && (
            <div className="pagination-wrapper" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6b7280', flexShrink: 0 }}>
                {meta.total} record{meta.total === 1 ? '' : 's'}
              </span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {renderPageItems().map((item, idx) =>
                    item === '...' ? (
                      <PaginationItem key={`e-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          isActive={currentPage === item}
                          onClick={() => setCurrentPage(item)}
                          className="cursor-pointer"
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </Box>
  );
};

export default MileageIntervalReport;
