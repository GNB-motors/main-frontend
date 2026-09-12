import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';
import apiClient from '../../../utils/axiosConfig';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.jsx';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';
import { useMileageIntervalReportColumns } from './useMileageIntervalReportColumns.jsx';
import {
  PAGE_SIZE,
  buildFilterParams,
  extractVehicleOptions,
  extractDriverOptions,
} from './mileageIntervalReportUtils.js';

const MileageIntervalReport = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [driverId, setDriverId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data: filterResponse, error: filtersError } = useApi(
    (signal) =>
      Promise.all([
        apiClient.get('api/vehicles', { params: { limit: 200 }, signal }),
        ReportsService.getEmployees({ limit: 200 }),
      ]),
    [],
  );

  useEffect(() => {
    if (!filterResponse) return;
    const [vehiclesRes, employees] = filterResponse;
    setVehicleOptions(extractVehicleOptions(vehiclesRes));
    setDriverOptions(extractDriverOptions(employees));
  }, [filterResponse]);

  useEffect(() => {
    if (filtersError) console.error('Failed to load report filters:', filtersError);
  }, [filtersError]);

  const {
    data: rowsResponse,
    loading: isLoading,
    error: rowsError,
    refetch: refetchRows,
  } = useApi(() => {
    const params = {
      page: currentPage,
      limit: PAGE_SIZE,
      ...buildFilterParams({ startDate, endDate, vehicleId, driverId }),
    };
    return ReportsService.getMileageIntervalReports(params);
  }, [JSON.stringify({ currentPage, startDate, endDate, vehicleId, driverId })]);

  useEffect(() => {
    if (rowsResponse) {
      setError(null);
      setRows(Array.isArray(rowsResponse.data) ? rowsResponse.data : []);
      setMeta(
        rowsResponse.meta || { total: 0, page: currentPage, limit: PAGE_SIZE, totalPages: 0 },
      );
    }
  }, [rowsResponse, currentPage]);

  useEffect(() => {
    if (rowsError) {
      setError(rowsError.detail || rowsError.message || 'Could not load mileage report.');
      setRows([]);
    }
  }, [rowsError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, vehicleId, driverId]);

  const totalPages = meta.totalPages || 1;

  const selectedVehicleLabel = useMemo(() => {
    if (vehicleId === 'all') return 'All Vehicles';
    return vehicleOptions.find((v) => v.id === vehicleId)?.label || 'All Vehicles';
  }, [vehicleId, vehicleOptions]);

  const selectedDriverLabel = useMemo(() => {
    if (driverId === 'all') return 'All Drivers';
    return driverOptions.find((d) => d.id === driverId)?.label || 'All Drivers';
  }, [driverId, driverOptions]);

  const downloadReport = useCallback(
    async (extension) => {
      if (isExporting) return;
      setIsExporting(true);
      try {
        await exportFilteredReportCsv({
          fetchExport: (filters) =>
            ReportsService.exportReportCsv('api/reports/mileage-intervals/export', filters),
          filters: buildFilterParams({ startDate, endDate, vehicleId, driverId }),
          filenamePrefix: 'mileage_interval_report',
          extension,
          errorMessage: 'Could not export mileage report.',
        });
      } catch {
        // toast handled inside exportFilteredReportCsv
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, startDate, endDate, vehicleId, driverId],
  );

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setVehicleId('all');
    setDriverId('all');
    setCurrentPage(1);
  };

  const activeFiltersCount =
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0) +
    (driverId !== 'all' ? 1 : 0);

  const columns = useMileageIntervalReportColumns();

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

  return (
    <PageShell
      className="p-6"
      title="Mileage Report"
      subtitle="Detailed vehicle mileage intervals, fuel consumption, distance, and alert status"
      count={meta.total}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadReport('csv')}
            disabled={isExporting || rows.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEE] bg-[#F8F8FB] transition-colors hover:bg-[#ECECEE] disabled:opacity-40"
            title="Export filtered rows to CSV"
          >
            <CsvIcon width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => downloadReport('xlsx')}
            disabled={isExporting || rows.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEE] bg-[#F8F8FB] transition-colors hover:bg-[#ECECEE] disabled:opacity-40"
            title="Export filtered rows to Excel"
          >
            <ExcelIcon width={18} height={18} />
          </button>
        </div>
      }
      filters={
        <FilterBar
          from={startDate}
          to={endDate}
          onRangeChange={(patch) => {
            if ('from' in patch) setStartDate(patch.from);
            if ('to' in patch) setEndDate(patch.to);
          }}
          activeCount={activeFiltersCount}
          onClear={clearFilters}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="date-input-group">
                <label htmlFor="mileage-vehicle-filter">Vehicle</label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger id="mileage-vehicle-filter" className="h-9 w-[180px] text-sm">
                    <SelectValue>{selectedVehicleLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicleOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="date-input-group">
                <label htmlFor="mileage-driver-filter">Driver</label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger id="mileage-driver-filter" className="h-9 w-[180px] text-sm">
                    <SelectValue>{selectedDriverLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Drivers</SelectItem>
                    {driverOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />
      }
      footer={
        totalPages > 1 ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-dim text-xs">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, meta.total)} of {meta.total}
            </span>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                    className={
                      currentPage <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'
                    }
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
                    className={
                      currentPage >= totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={isLoading}
          error={error}
          onRetry={refetchRows}
          showing={rows.length}
          total={meta.total}
          emptyTitle="No mileage records found"
          emptyHint="Try widening the date range or clearing selected vehicle and driver filters."
        />
      </div>
    </PageShell>
  );
};

export default MileageIntervalReport;
