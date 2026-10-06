import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';
import apiClient from '../../../utils/axiosConfig';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.jsx';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';
import { useFuelCyclesColumns } from './useFuelCyclesColumns.jsx';
import { buildTripFilterParams, extractVehicleOptions } from './tripReportsUtils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'RECONCILED', label: 'Reconciled' },
  { value: 'UNRECONCILED_NO_LEDGER', label: 'Unreconciled (no ledger)' },
];

const FuelCyclesReport = () => {
  const [rows, setRows] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [status, setStatus] = useState('all');

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data: vehiclesRes } = useApi(
    (signal) => apiClient.get('api/vehicles', { params: { limit: 200 }, signal }),
    [],
  );
  useEffect(() => {
    if (vehiclesRes) setVehicleOptions(extractVehicleOptions(vehiclesRes));
  }, [vehiclesRes]);

  const {
    data: rowsResponse,
    loading: isLoading,
    error: rowsError,
    refetch: refetchRows,
  } = useApi(
    () => ReportsService.getFuelCycles(buildTripFilterParams({ from, to, vehicleId, status })),
    [JSON.stringify({ from, to, vehicleId, status })],
  );

  useEffect(() => {
    if (rowsResponse) {
      setError(null);
      setRows(Array.isArray(rowsResponse.data) ? rowsResponse.data : []);
      setTruncated(Boolean(rowsResponse.truncated));
    }
  }, [rowsResponse]);

  useEffect(() => {
    if (rowsError) {
      setError(rowsError.detail || rowsError.message || 'Could not load fuel cycles.');
      setRows([]);
    }
  }, [rowsError]);

  const selectedVehicleLabel = useMemo(() => {
    if (vehicleId === 'all') return 'All Vehicles';
    return vehicleOptions.find((v) => v.id === vehicleId)?.label || 'All Vehicles';
  }, [vehicleId, vehicleOptions]);

  const downloadReport = useCallback(
    async (extension) => {
      if (isExporting) return;
      setIsExporting(true);
      try {
        await exportFilteredReportCsv({
          fetchExport: (filters) =>
            ReportsService.exportReportCsv('api/reports/fuel-cycles/export', filters),
          filters: buildTripFilterParams({ from, to, vehicleId, status }),
          filenamePrefix: 'fuel_cycles_report',
          extension,
          errorMessage: 'Could not export fuel cycles report.',
        });
      } catch {
        // toast handled inside exportFilteredReportCsv
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, from, to, vehicleId, status],
  );

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setVehicleId('all');
    setStatus('all');
  };

  const activeFiltersCount =
    (from ? 1 : 0) + (to ? 1 : 0) + (vehicleId !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0);

  const columns = useFuelCyclesColumns();

  return (
    <PageShell
      className="p-6"
      title="Fuel Cycles"
      subtitle="Full-tank to full-tank cycles — distance, fuel reconciliation and cost per cycle"
      count={rows.length}
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
          from={from}
          to={to}
          onRangeChange={(patch) => {
            if ('from' in patch) setFrom(patch.from);
            if ('to' in patch) setTo(patch.to);
          }}
          activeCount={activeFiltersCount}
          onClear={clearFilters}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="date-input-group">
                <label htmlFor="fc-vehicle-filter">Vehicle</label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger id="fc-vehicle-filter" className="h-9 w-[180px] text-sm">
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
                <label htmlFor="fc-status-filter">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="fc-status-filter" className="h-9 w-[200px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
        truncated ? (
          <span className="text-dim text-xs">
            First {rows.length} cycles only — narrow the dates to see the rest.
          </span>
        ) : (
          <span className="text-dim text-xs">{rows.length} cycles</span>
        )
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        loading={isLoading}
        error={error}
        onRetry={refetchRows}
        showing={rows.length}
        total={rows.length}
        emptyTitle="No fuel cycles found"
        emptyHint="Try widening the date range or clearing the vehicle and status filters."
      />
    </PageShell>
  );
};

export default FuelCyclesReport;
