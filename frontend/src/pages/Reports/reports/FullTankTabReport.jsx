import { useMemo, useState } from 'react';
import { ClipboardCheck, Fuel, Receipt, Route, Truck } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import ReportFrame, { ReportClear, ReportFooter, ReportSearch } from './ReportFrame';
import { pageCount, pageSlice } from './reportFilters';
import useReportPage from './useReportPage';
import { tripReportSummary } from './tripReportsUtils';
import {
  FULL_TANK_WINDOW_DAYS,
  countKmNotMeasured,
  filterTrucks,
  formatCount,
  formatDaysSince,
  formatKmPerL,
  formatKmSince,
  formatLastFull,
  formatPartialFills,
  hasSummary,
  kmNotMeasuredNote,
  modelRows,
  readFullTankResponse,
  summaryItems,
} from './fullTankTabModel';

/**
 * FullTankTabReport — the "Full tank" report.
 *
 * It reads GET /api/reports/fuel-cycles/full-tank-tab?days=90&search= and
 * shows, for every truck, how many full tanks it has run and what the ledger
 * can (and cannot) say about the km since the last one. Every figure that the
 * backend could not measure reads "—" — never 0 — so a missing number is never
 * mistaken for a quiet truck. The rules live in fullTankTabModel.js, which is
 * unit-tested without a browser.
 */

/** One icon and tone per summary figure, so the cards read at a glance. */
const SUMMARY_ICONS = {
  fullCycles: Fuel,
  openTabs: Route,
  noFullYet: Truck,
  fromSlip: Receipt,
  fromRegister: ClipboardCheck,
};

const SUMMARY_TONES = {
  fullCycles: 'blue',
  openTabs: 'teal',
  noFullYet: 'orange',
  fromSlip: 'violet',
  fromRegister: 'green',
};

const TRUCK_COLUMNS = [
  {
    key: 'plate',
    label: 'Plate',
    render: (r) => <div className="cell-primary">{r.registrationNumber || '—'}</div>,
  },
  {
    key: 'model',
    label: 'Model',
    render: (r) => r.model || '—',
  },
  {
    key: 'fullCycles',
    label: 'Full cycles',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatCount(r.fullCycles)}</div>,
  },
  {
    key: 'otherCycles',
    label: 'Other cycles',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatCount(r.otherCycles)}</div>,
  },
  {
    key: 'lastFull',
    label: 'Last full tank',
    render: (r) => <div className="cell-primary">{formatLastFull(r)}</div>,
  },
  {
    key: 'daysSinceFull',
    label: 'Days since',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatDaysSince(r.daysSinceFull)}</div>,
  },
  {
    key: 'kmSinceFull',
    label: 'Km since',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatKmSince(r.kmSinceFull)}</div>,
  },
  {
    key: 'partialsSinceFull',
    label: 'Partial fills since',
    render: (r) => <div className="cell-primary">{formatPartialFills(r.partialsSinceFull)}</div>,
  },
  {
    key: 'lastKmPerL',
    label: 'Last km/L',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatKmPerL(r.lastKmPerL)}</div>,
  },
  {
    key: 'medianKmPerL',
    label: 'Median km/L',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatKmPerL(r.medianKmPerL)}</div>,
  },
];

const MODEL_COLUMNS = [
  {
    key: 'model',
    label: 'Model',
    render: (r) => <div className="cell-primary">{r.modelKey}</div>,
  },
  {
    key: 'cycles',
    label: 'Cycles',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatCount(r.cycles)}</div>,
  },
  {
    key: 'trucks',
    label: 'Trucks',
    align: 'right',
    render: (r) => <div className="cell-primary">{formatCount(r.trucks)}</div>,
  },
  // A model with no comparable peers has no gap: the cell stays empty rather
  // than claiming a 0% gap.
  { key: 'gap', label: 'Median km gap', align: 'right', render: (r) => r.gap },
  { key: 'note', label: 'Ledger note', render: (r) => r.note },
];

const FullTankTabReport = () => {
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({ days: FULL_TANK_WINDOW_DAYS, search: search.trim() }),
    [search],
  );
  const paramsKey = JSON.stringify(params);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi((signal) => ReportsService.getFullTankTab(params, signal), [paramsKey]);

  const payload = useMemo(() => readFullTankResponse(response?.data), [response]);
  const trucks = useMemo(() => filterTrucks(payload.trucks, search), [payload.trucks, search]);
  const models = useMemo(() => modelRows(payload.models), [payload.models]);

  const [page, setPage] = useReportPage(paramsKey);
  const pageRows = pageSlice(trucks, page);

  // The summary row only appears when the backend sent a summary: a row of
  // dashes would say "nothing measured" about figures it never had.
  const kpis = useMemo(() => {
    if (!hasSummary(payload.summary)) return null;
    return summaryItems(payload.summary).map((item) => ({
      ...item,
      icon: SUMMARY_ICONS[item.key],
      tone: SUMMARY_TONES[item.key],
    }));
  }, [payload.summary]);

  // A truck count that hides how many of them have no measured km reads as a
  // measurement of the whole fleet; the note says what is missing.
  const notMeasured = kmNotMeasuredNote(countKmNotMeasured(trucks));
  const available = response?.available !== false;

  return (
    <ReportFrame
      title="Full tank"
      subtitle={`Full tanks per truck over the last ${FULL_TANK_WINDOW_DAYS} days, from the slips and the trip register`}
      filters={
        <>
          <ReportSearch value={search} onChange={setSearch} placeholder="Search plate or model" />
          <ReportClear active={Boolean(search)} onClear={() => setSearch('')} />
        </>
      }
      kpis={kpis}
      notice={notMeasured ? <span>{notMeasured}</span> : null}
      footer={
        <ReportFooter
          summary={tripReportSummary({ page, total: trucks.length, noun: 'trucks' })}
          page={page}
          totalPages={pageCount(trucks.length)}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={TRUCK_COLUMNS}
        rows={pageRows}
        rowKey={(r, i) => r.vehicleId || r.registrationNumber || i}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={trucks.length}
        activeFilters={search ? 1 : 0}
        emptyTitle={available ? 'No trucks in this window' : 'Full tank report not available'}
        emptyHint={
          available
            ? 'Try a different plate or model.'
            : 'This server has not shipped the full-tank report yet.'
        }
      />

      {models.length ? (
        <>
          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Model comparison
          </h3>
          <DataTable
            columns={MODEL_COLUMNS}
            rows={models}
            rowKey={(r) => r.key}
            showing={models.length}
            total={models.length}
            emptyTitle="No model comparison"
            emptyHint="The backend sent no model rows for this window."
          />
        </>
      ) : null}
    </ReportFrame>
  );
};

export default FullTankTabReport;
