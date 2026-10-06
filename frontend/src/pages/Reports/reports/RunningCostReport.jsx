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
import { useRunningCostColumns } from './useRunningCostColumns.jsx';
import { buildTripFilterParams, extractVehicleOptions, formatCurrency } from './tripReportsUtils';

const GROUP_OPTIONS = [
  { value: 'vehicle', label: 'By Vehicle' },
  { value: 'hub', label: 'By Hub' },
  { value: 'driver', label: 'By Driver' },
  { value: 'day', label: 'By Day' },
];

const RunningCostReport = () => {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [groupBy, setGroupBy] = useState('vehicle');

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
  } = useApi(() => {
    const params = buildTripFilterParams({ from, to, vehicleId, groupBy });
    return ReportsService.getRunningCost(params);
  }, [JSON.stringify({ from, to, vehicleId, groupBy })]);

  useEffect(() => {
    if (rowsResponse) {
      setError(null);
      setRows(Array.isArray(rowsResponse.data) ? rowsResponse.data : []);
      setTotals(rowsResponse.summary || null);
    }
  }, [rowsResponse]);

  useEffect(() => {
    if (rowsError) {
      setError(rowsError.detail || rowsError.message || 'Could not load running-cost report.');
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
            ReportsService.exportReportCsv('api/reports/running-cost/export', filters),
          filters: buildTripFilterParams({ from, to, vehicleId, groupBy }),
          filenamePrefix: 'running_cost_report',
          extension,
          errorMessage: 'Could not export running-cost report.',
        });
      } catch {
        // toast handled inside exportFilteredReportCsv
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, from, to, vehicleId, groupBy],
  );

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setVehicleId('all');
    setGroupBy('vehicle');
  };

  const activeFiltersCount = (from ? 1 : 0) + (to ? 1 : 0) + (vehicleId !== 'all' ? 1 : 0);
  const columns = useRunningCostColumns();

  return (
    <PageShell
      className="p-6"
      title="Running Cost"
      subtitle="Cost of running the fleet — business, non-business, deviation and overhead, by vehicle / hub / driver / day"
      count={rows.length}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadReport('csv')}
            disabled={isExporting || rows.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEE] bg-[#F8F8FB] transition-colors hover:bg-[#ECECEE] disabled:opacity-40"
            title="Export rows to CSV"
          >
            <CsvIcon width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => downloadReport('xlsx')}
            disabled={isExporting || rows.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEE] bg-[#F8F8FB] transition-colors hover:bg-[#ECECEE] disabled:opacity-40"
            title="Export rows to Excel"
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
                <label htmlFor="rc-group-filter">Group by</label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger id="rc-group-filter" className="h-9 w-[160px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {GROUP_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="date-input-group">
                <label htmlFor="rc-vehicle-filter">Vehicle</label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger id="rc-vehicle-filter" className="h-9 w-[180px] text-sm">
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
            </div>
          }
        />
      }
      footer={
        totals ? (
          <span className="text-dim text-xs">
            Total {formatCurrency(totals.totalCostInr)} · Business{' '}
            {formatCurrency(totals.businessCostInr)} · Non-business{' '}
            {formatCurrency(totals.nonBusinessCostInr)} · Deviation{' '}
            {formatCurrency(totals.deviationCostInr)} · Overhead{' '}
            {formatCurrency(totals.overheadCostInr)}
          </span>
        ) : null
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.key}
        loading={isLoading}
        error={error}
        onRetry={refetchRows}
        showing={rows.length}
        total={rows.length}
        emptyTitle="No running-cost rows"
        emptyHint="Try widening the date range or changing the grouping."
      />
    </PageShell>
  );
};

export default RunningCostReport;
