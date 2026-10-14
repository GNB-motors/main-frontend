import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Route, Waypoints } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { formatINR, formatKm, formatNum } from '../../../utils/formatters';
import { fuelExtraOf, useNonBusinessColumns } from './useNonBusinessColumns.jsx';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
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

// For a searched export, built from the rows on screen (the server's /export
// cannot apply the search box). Same columns as the server file, plus purpose.
const EXPORT_COLUMNS = [
  ['Date', (r) => r.date],
  ['Vehicle No', (r) => r.vehicleNumber],
  ['Status', (r) => r.status],
  ['Place Kind', (r) => r.placeKind],
  ['Purpose', (r) => r.purpose],
  ['Extra (Km)', (r) => r.kmExtra],
  ['Total (Km)', (r) => r.kmTotal],
  ['Fuel Extra (L)', fuelExtraOf],
  ['Fuel (Rs)', (r) => r.fuelInr],
  ['Wear (Rs)', (r) => r.wearInr],
  ['Total (Rs)', (r) => r.totalInr],
  ['Dwell (Min)', (r) => r.dwellMin],
];

/** The server's totals, recomputed for a searched subset (same rule: DEVIATION vs approved). */
function totalsOf(rows) {
  return rows.reduce(
    (a, r) => {
      a.kmExtra += r.kmExtra || 0;
      if (r.status === 'DEVIATION') a.deviationCostInr += r.totalInr || 0;
      else a.approvedCostInr += r.totalInr || 0;
      return a;
    },
    { kmExtra: 0, deviationCostInr: 0, approvedCostInr: 0 },
  );
}

const NonBusinessReport = () => {
  const [range, setRange] = useState(defaultTripRange);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('all');

  const params = useMemo(() => buildTripFilterParams({ ...range, vehicleId }), [range, vehicleId]);
  const paramsKey = JSON.stringify(params);
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi((signal) => ReportsService.getNonBusiness(params, signal), [paramsKey]);

  const rows = useMemo(
    () => (error ? [] : newestFirst(response?.data || [], (r) => r.date)),
    [response, error],
  );
  const searching = Boolean(search.trim());
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesSearch(search, [r.vehicleNumber, r.placeKind, r.purpose, r.status]),
      ),
    [rows, search],
  );
  const totals = useMemo(
    () => (!searching && response?.summary ? response.summary : totalsOf(filtered)),
    [searching, response, filtered],
  );
  const showKmApproved = rows.some((r) => typeof r.kmApproved === 'number');
  const columns = useNonBusinessColumns({ showKmApproved });

  const [page, setPage] = useReportPage(`${paramsKey}|${search.trim()}`);
  const pageRows = pageSlice(filtered, page);

  const defaults = defaultTripRange();
  const activeFilters =
    rangeFilterCount(range, defaults) + (search ? 1 : 0) + (vehicleId !== 'all' ? 1 : 0);

  const kpis = [
    { label: 'Excursions', value: formatNum(filtered.length), icon: Waypoints },
    {
      label: 'Extra km',
      value: formatKm(totals.kmExtra),
      icon: Route,
      tone: 'violet',
      hint: 'Km driven beyond the direct route',
    },
    {
      label: 'Deviation cost',
      value: formatINR(totals.deviationCostInr),
      icon: AlertTriangle,
      tone: 'red',
      hint: 'Fuel and wear of the unapproved deviations',
    },
    {
      label: 'Approved cost',
      value: formatINR(totals.approvedCostInr),
      icon: CheckCircle2,
      tone: 'green',
      hint: 'Fuel and wear of approved non-business movement',
    },
  ];

  return (
    <ReportFrame
      title="Non-Business Running"
      subtitle="Deviations and non-business movement — extra km and the cost of each"
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch
            value={search}
            onChange={setSearch}
            placeholder="Search vehicle, place, purpose"
          />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(defaultTripRange());
              setSearch('');
              setVehicleId('all');
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
              endpoint: 'api/reports/non-business/export',
              params,
              filenamePrefix: 'non_business_report',
              errorMessage: 'Could not export non-business report.',
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
            noun: 'excursions',
            truncated: Boolean(response?.truncated),
            capNoun: 'excursions',
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
        rowKey={(r) => r.excursionId || r.key}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={filtered.length}
        activeFilters={activeFilters}
        emptyTitle="No non-business movement found"
        emptyHint="Try widening the date range or clearing the search and vehicle filter."
      />
    </ReportFrame>
  );
};

export default NonBusinessReport;
