import { useMemo, useState } from 'react';
import PageShell from '../../../components/ui/PageShell';
import DataTable from '../../../components/ui/DataTable';
import { KpiTile, StatusPill } from '../../../components/overview.primitives.jsx';
import { ReportsService } from '../ReportsService.jsx';
import useApi from '../../../hooks/useApi';
import { laneRow, filterLanes, LANE_FILTERS } from './laneKmReportUtils';

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
    key: 'measured',
    label: 'Measured km',
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

/**
 * GET /api/reports/lanes — every lane of the owner's SAP sheet with the km the
 * register's one-drop trips actually run, measured every night. SAP stays the
 * billing reference; this is the check.
 */
export default function LaneKmReport() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi(
    (signal) => ReportsService.getLaneKm({ signal }),
    [],
  );
  const payload = data || {};
  const rows = useMemo(() => (payload.rows || []).map(laneRow), [payload.rows]);
  const totals = payload.totals || {};
  const shown = filterLanes(rows, filter, search);

  return (
    <PageShell
      className="p-6"
      title="Lane km vs SAP"
      subtitle="Each lane's SAP distance beside the km your trucks actually run on it, from the trip register — measured every night"
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="Lanes"
          value={totals.lanes ?? '—'}
          sub={`${totals.fromRegister ?? 0} not in the sheet`}
        />
        <KpiTile
          label="Run over SAP"
          value={totals.overSap ?? '—'}
          sub="beyond their own trip-to-trip spread"
        />
        <KpiTile label="Extra km over SAP" value={km(totals.extraKm)} sub="across the register" />
        <KpiTile
          label="Not in SAP"
          value={totals.notInSap ?? '—'}
          sub="measured km is our proposed distance"
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {LANE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`ov-btn ${filter === f.key ? 'ov-btn--primary' : ''}`}
            style={{ padding: '4px 12px', fontSize: 12 }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <input
          type="search"
          className="ml-auto rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="Search plant or town"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search lanes"
        />
      </div>
      <DataTable
        columns={COLUMNS}
        rows={shown}
        rowKey={(r) => r.id}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        showing={shown.length}
        total={rows.length}
        emptyTitle="No lanes yet"
        emptyHint="This fills in once the lane sheet (FROM, TO, SAP km) is imported; lanes are measured from the trip register every night."
      />
    </PageShell>
  );
}
