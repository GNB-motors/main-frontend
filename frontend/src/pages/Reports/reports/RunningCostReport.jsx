import { useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, CheckCircle2, IndianRupee } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { formatINR } from '../../../utils/formatters';
import { unattributedKmOf, useRunningCostColumns } from './useRunningCostColumns.jsx';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
  ReportSelect,
} from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { matchesSearch, pageCount, pageSlice } from './reportFilters';
import useReportPage from './useReportPage';
import {
  buildTripFilterParams,
  defaultTripRange,
  exportTripReport,
  newestFirst,
  rangeFilterCount,
  tripReportSummary,
} from './tripReportsUtils';

const DEFAULT_GROUP = 'vehicle';
const GROUP_OPTIONS = [
  { value: 'vehicle', label: 'By vehicle' },
  { value: 'hub', label: 'By hub' },
  { value: 'driver', label: 'By driver' },
  { value: 'day', label: 'By day' },
];
const GROUP_NOUN = { vehicle: 'vehicles', hub: 'hubs', driver: 'drivers', day: 'days' };

// For a searched export, built from the rows on screen (the server's /export
// cannot apply the search box). Same columns as the server file, plus unattributed km.
const EXPORT_COLUMNS = [
  ['Group', (r) => r.label || r.key],
  ['Trips', (r) => r.trips],
  ['Approach (Km)', (r) => r.kmApproach],
  ['Laden (Km)', (r) => r.kmLaden],
  ['Return (Km)', (r) => r.kmReturn],
  ['Unattributed (Km)', unattributedKmOf],
  ['Empty Share (%)', (r) => r.emptySharePct],
  ['Fuel (L)', (r) => r.fuelL],
  ['Fuel (Rs)', (r) => r.fuelInr],
  ['Wear (Rs)', (r) => r.wearInr],
  ['Business (Rs)', (r) => r.businessCostInr],
  ['Approved Non-Business (Rs)', (r) => r.nonBusinessCostInr],
  ['Deviation (Rs)', (r) => r.deviationCostInr],
  ['Deviation Share (%)', (r) => r.deviationSharePct],
  ['Total (Rs)', (r) => r.totalCostInr],
];

const COST_KEYS = ['totalCostInr', 'businessCostInr', 'nonBusinessCostInr', 'deviationCostInr'];

/** The server's totals, recomputed for a searched subset. */
function totalsOf(rows) {
  const totals = Object.fromEntries(COST_KEYS.map((k) => [k, 0]));
  rows.forEach((r) => {
    COST_KEYS.forEach((k) => {
      totals[k] += r[k] || 0;
    });
  });
  return totals;
}

const RunningCostReport = () => {
  const [range, setRange] = useState(defaultTripRange);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [groupBy, setGroupBy] = useState(DEFAULT_GROUP);

  const params = useMemo(
    () => buildTripFilterParams({ ...range, vehicleId, groupBy }),
    [range, vehicleId, groupBy],
  );
  const paramsKey = JSON.stringify(params);
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi((signal) => ReportsService.getRunningCost(params, signal), [paramsKey]);

  // Day groups read newest first; the others keep the API's alphabetical order.
  const rows = useMemo(() => {
    if (error) return [];
    const list = response?.data || [];
    return groupBy === 'day' ? newestFirst(list, (r) => r.key) : list;
  }, [response, error, groupBy]);
  const searching = Boolean(search.trim());
  const filtered = useMemo(
    () => rows.filter((r) => matchesSearch(search, [r.label, r.key])),
    [rows, search],
  );
  const totals = useMemo(
    () => (!searching && response?.summary ? response.summary : totalsOf(filtered)),
    [searching, response, filtered],
  );
  const columns = useRunningCostColumns(groupBy);

  const [page, setPage] = useReportPage(`${paramsKey}|${search.trim()}`);
  const pageRows = pageSlice(filtered, page);

  const defaults = defaultTripRange();
  const activeFilters =
    rangeFilterCount(range, defaults) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0) +
    (groupBy !== DEFAULT_GROUP ? 1 : 0);

  const kpis = [
    {
      label: 'Total cost',
      value: formatINR(totals.totalCostInr),
      icon: IndianRupee,
      hint: 'Business + approved non-business + deviation',
    },
    {
      label: 'Business',
      value: formatINR(totals.businessCostInr),
      icon: Briefcase,
      tone: 'teal',
      hint: 'Approach, laden and return running of the trips',
    },
    {
      label: 'Non-business',
      value: formatINR(totals.nonBusinessCostInr),
      icon: CheckCircle2,
      tone: 'green',
      hint: 'Approved non-business movement',
    },
    {
      label: 'Deviation',
      value: formatINR(totals.deviationCostInr),
      icon: AlertTriangle,
      tone: 'red',
      hint: 'Unapproved deviations',
    },
  ];

  return (
    <ReportFrame
      title="Running Cost"
      subtitle="Cost of running the fleet — business, non-business and deviation, by vehicle / hub / driver / day"
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search group" />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportSelect
            label="Group by"
            value={groupBy}
            onChange={setGroupBy}
            options={GROUP_OPTIONS}
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(defaultTripRange());
              setSearch('');
              setVehicleId('all');
              setGroupBy(DEFAULT_GROUP);
            }}
          />
        </>
      }
      actions={
        <ExportButton
          buttonClass="rpt-btn"
          onExport={(extension) =>
            exportTripReport({
              extension,
              clientRows: searching ? filtered : null,
              columns: EXPORT_COLUMNS,
              endpoint: 'api/reports/running-cost/export',
              params,
              filenamePrefix: 'running_cost_report',
              errorMessage: 'Could not export running-cost report.',
            })
          }
          disabled={!filtered.length}
        />
      }
      kpis={response && !error ? kpis : null}
      footer={
        <ReportFooter
          summary={tripReportSummary({
            page,
            total: filtered.length,
            noun: GROUP_NOUN[groupBy] || 'groups',
            truncated: Boolean(response?.truncated),
            capNoun: 'trips',
          })}
          page={page}
          totalPages={pageCount(filtered.length)}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r.key}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={filtered.length}
        activeFilters={activeFilters}
        emptyTitle="No running-cost rows"
        emptyHint="Try widening the date range, clearing the search or changing the grouping."
      />
    </ReportFrame>
  );
};

export default RunningCostReport;
