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
import { useNonBusinessColumns } from './useNonBusinessColumns.jsx';
import {
  buildTripFilterParams,
  extractVehicleOptions,
  formatCurrency,
  fmtKm,
} from './tripReportsUtils';

const NonBusinessReport = () => {
  const [rows, setRows] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicleId, setVehicleId] = useState('all');

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
    () => ReportsService.getNonBusiness(buildTripFilterParams({ from, to, vehicleId })),
    [JSON.stringify({ from, to, vehicleId })],
  );

  useEffect(() => {
    if (rowsResponse) {
      setError(null);
      setRows(Array.isArray(rowsResponse.data) ? rowsResponse.data : []);
      setTruncated(Boolean(rowsResponse.truncated));
      setTotals(rowsResponse.summary || null);
    }
  }, [rowsResponse]);

  useEffect(() => {
    if (rowsError) {
      setError(rowsError.detail || rowsError.message || 'Could not load non-business report.');
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
            ReportsService.exportReportCsv('api/reports/non-business/export', filters),
          filters: buildTripFilterParams({ from, to, vehicleId }),
          filenamePrefix: 'non_business_report',
          extension,
          errorMessage: 'Could not export non-business report.',
        });
      } catch {
        // toast handled inside exportFilteredReportCsv
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, from, to, vehicleId],
  );

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setVehicleId('all');
  };

  const activeFiltersCount = (from ? 1 : 0) + (to ? 1 : 0) + (vehicleId !== 'all' ? 1 : 0);
  const columns = useNonBusinessColumns();

  return (
    <PageShell
      className="p-6"
      title="Non-Business Running"
      subtitle="Deviations and non-business movement — extra km, approved km and the cost of each"
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
            <div className="date-input-group">
              <label htmlFor="nb-vehicle-filter">Vehicle</label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="nb-vehicle-filter" className="h-9 w-[180px] text-sm">
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
          }
        />
      }
      footer={
        <span className="text-dim text-xs">
          {totals
            ? `Extra ${fmtKm(totals.kmExtra)} · Deviation ${formatCurrency(totals.deviationCostInr)} · Approved ${formatCurrency(totals.approvedCostInr)}`
            : `${rows.length} rows`}
          {truncated ? ' · first rows only — narrow the dates' : ''}
        </span>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.excursionId || r.key}
        loading={isLoading}
        error={error}
        onRetry={refetchRows}
        showing={rows.length}
        total={rows.length}
        emptyTitle="No non-business movement found"
        emptyHint="Try widening the date range or clearing the vehicle filter."
      />
    </PageShell>
  );
};

export default NonBusinessReport;
