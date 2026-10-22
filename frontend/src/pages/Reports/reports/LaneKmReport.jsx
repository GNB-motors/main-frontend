import { createElement, lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { canEditSap } from '../../Sap/sapModel';
import { getUserRole } from '../../../utils/session';
import { AlertTriangle, MapPinOff, Route, TrendingUp, Settings2, Link2 } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import { StatusPill } from '../../../components/overview.primitives.jsx';
import { ReportsService } from '../ReportsService.js';
import useApi from '../../../hooks/useApi';
import { formatNum } from '../../../utils/formatters';
import { laneRow, filterLanes, LANE_FILTERS } from './laneKmReportUtils';
import ReportFrame, { ReportClear, ReportFooter, ReportSearch, ReportSelect } from './ReportFrame';
import { pageCount, pageSlice, rangeLabel, REPORT_PAGE_SIZE } from './reportFilters';
import useReportPage from './useReportPage';
import '../../Sap/Sap.css';

const SapSettings = lazy(() => import('../../Sap/SapSettings'));
const SapMatchReview = lazy(() => import('../../Sap/SapMatchReview'));

const km = (v) => (v == null ? '—' : `${Math.round(v).toLocaleString('en-IN')} km`);

const COLUMNS = [
  {
    key: 'lane',
    label: 'Lane',
    render: (r) => (
      <div>
        <div className="cell-primary font-medium">
          {r.from} → {r.to}
        </div>
        {(r.fromName || r.toName) && (
          <div className="text-xs text-slate-500">
            {r.fromName || '—'} → {r.toName || '—'}
          </div>
        )}
        {r.fromRegister && (
          <div className="text-xs text-slate-500">
            Not in the sheet{r.possibly ? ` — possibly the sheet’s ${r.possibly}` : ''}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'sap',
    label: 'SAP km',
    align: 'right',
    render: (r) => (
      <div
        className="cell-primary"
        title={r.severalSap ? 'The sheet lists this lane with several SAP values' : undefined}
      >
        {r.sapText}
      </div>
    ),
  },
  {
    key: 'gps',
    label: 'GPS loaded km',
    align: 'right',
    render: (r) => (
      <div>
        {km(r.gpsKm)} <span className="text-xs text-slate-500">({r.gpsTrips ?? 0} trips)</span>
      </div>
    ),
  },
  {
    key: 'measured',
    label: 'Refuel-cycle km (register)',
    align: 'right',
    render: (r) => (
      <div className="cell-primary">
        {r.measuredKm == null ? '—' : `${Math.round(r.measuredKm)} ±${Math.round(r.spreadKm || 0)}`}
      </div>
    ),
  },
  {
    key: 'trips',
    label: 'Trips',
    align: 'right',
    render: (r) => (
      <div className="cell-primary">
        {r.trips} <span className="text-xs text-slate-500">({r.trucks} trucks)</span>
      </div>
    ),
  },
  {
    key: 'verdict',
    label: 'Against SAP',
    render: (r) => (
      <span>
        <StatusPill tone={r.tone}>{r.label}</StatusPill>
        {r.matchingSap.length > 0 && r.severalSap && (
          <span className="ml-1 text-xs text-slate-500">matches {r.matchingSap.join(' / ')}</span>
        )}
      </span>
    ),
  },
  {
    key: 'extra',
    label: 'Extra km',
    align: 'right',
    render: (r) =>
      r.extraPerTrip == null ? (
        <div className="cell-primary">—</div>
      ) : (
        <div className="cell-primary" style={{ fontWeight: 600 }}>
          +{Math.round(r.extraPerTrip)}/trip{' '}
          <span className="text-xs text-slate-500">({km(r.extraTotal)} in all)</span>
        </div>
      ),
  },
];

const VERDICT_OPTIONS = LANE_FILTERS.map((f) => ({ value: f.key, label: f.label }));

const count = (v) => (v == null ? '—' : formatNum(v));

function laneKpis(totals, legacy) {
  return [
    {
      label: 'Lanes',
      value: count(totals.lanes),
      icon: Route,
      hint: `${formatNum(totals.fromRegister ?? 0)} not in the sheet`,
    },
    {
      label: 'Run over SAP',
      value: count(totals.overSap ?? totals.over),
      icon: AlertTriangle,
      tone: 'red',
      hint: legacy
        ? 'Refuel-cycle distance beyond its usual spread'
        : 'GPS loaded distance beyond SAP tolerance',
    },
    {
      label: 'Extra km over SAP',
      value: km(totals.extraKm),
      icon: TrendingUp,
      tone: 'orange',
      hint: legacy ? 'Across register trips' : 'Across GPS trips',
    },
    {
      label: 'Not in SAP',
      value: count(totals.notInSap ?? totals.noSap),
      icon: MapPinOff,
      tone: 'violet',
      hint: 'Routes without a sheet distance',
    },
  ];
}

/**
 * GET /api/reports/lanes — every lane of the owner's SAP sheet with the km the
 * register's one-drop trips actually run, measured every night. SAP stays the
 * billing reference; this is the check.
 */
function LaneKmTable() {
  const [verdict, setVerdict] = useState('all');
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi(
    (signal) => ReportsService.getLaneKm({ signal, preferSap: canEditSap(getUserRole()) }),
    [],
  );
  const payload = data || {};
  const rows = useMemo(() => (payload.rows || []).map(laneRow), [payload.rows]);
  const totals = payload.totals || {};
  const shown = useMemo(() => filterLanes(rows, verdict, search), [rows, verdict, search]);

  const [page, setPage] = useReportPage(`${verdict}|${search.trim()}`);
  const pageRows = pageSlice(shown, page);
  const activeFilters = (verdict !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <ReportFrame
      layout="inline"
      title="Lane km vs SAP"
      subtitle="Refuel-cycle km is odometer between two refuels from your oil report, and usually covers more than one leg. GPS loaded km is plant → drop on this trip."
      filters={
        <>
          <ReportSearch value={search} onChange={setSearch} placeholder="Search plant or town" />
          <ReportSelect
            label="Verdict"
            value={verdict}
            onChange={setVerdict}
            options={VERDICT_OPTIONS}
            width={180}
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setVerdict('all');
              setSearch('');
            }}
          />
        </>
      }
      kpis={data && !error ? laneKpis(totals, payload.legacy) : null}
      footer={
        <ReportFooter
          summary={`${rangeLabel(page, REPORT_PAGE_SIZE, shown.length)} lanes`}
          page={page}
          totalPages={pageCount(shown.length)}
          onPage={setPage}
        />
      }
    >
      <>
        {payload.legacy && (
          <p className="sap-muted">
            Showing refuel-cycle data. GPS comparisons are unavailable in this view.
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={error ? [] : pageRows}
          rowKey={(r) => r.id}
          loading={loading && !data}
          error={error}
          onRetry={refetch}
          showing={pageRows.length}
          total={shown.length}
          activeFilters={activeFilters}
          emptyTitle={activeFilters ? 'No lane matches these filters' : 'No lanes yet'}
          emptyHint={
            activeFilters
              ? 'Clear the search or choose All lanes.'
              : 'This fills in once the lane sheet (FROM, TO, SAP km) is imported; lanes are measured from the trip register every night.'
          }
        />
      </>
    </ReportFrame>
  );
}

export default function LaneKmReport() {
  const [params, setParams] = useSearchParams();
  const canEdit = canEditSap(getUserRole());
  const requested = params.get('sapTab');
  const tab = canEdit && ['settings', 'review'].includes(requested) ? requested : 'lanes';
  return (
    <div>
      {canEdit && (
        <nav className="sap-view-nav" aria-label="SAP views">
          {[
            ['lanes', 'Lane km', Route],
            ['settings', 'Settings & upload', Settings2],
            ['review', 'Link SAP sheet to places', Link2],
          ].map(([id, label, icon]) => (
            <button
              className="sap-view-tab"
              aria-pressed={tab === id}
              type="button"
              key={id}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (id === 'lanes') next.delete('sapTab');
                else next.set('sapTab', id);
                setParams(next, { replace: true });
              }}
            >
              {createElement(icon, { size: 15, 'aria-hidden': true })}
              {label}
            </button>
          ))}
        </nav>
      )}
      <Suspense fallback={<p className="sap-panel">Loading…</p>}>
        {tab === 'settings' ? (
          <SapSettings />
        ) : tab === 'review' ? (
          <SapMatchReview />
        ) : (
          <LaneKmTable />
        )}
      </Suspense>
    </div>
  );
}
