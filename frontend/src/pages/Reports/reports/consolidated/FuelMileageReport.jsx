import { useMemo, useState } from 'react';
import { Fuel, Gauge, IndianRupee, CheckCircle2 } from 'lucide-react';
import DataTable from '../../../../components/ui/DataTable';
import ExportButton from '../../../../components/ui/ExportButton';
import ReportDataNotice from '../../../../components/ui/ReportDataNotice';
import useApi from '../../../../hooks/useApi';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import { formatDateIST } from '../../../../utils/dateUtils';
import ReportFrame, { ReportFooter } from '../ReportFrame';
import useReportPage from '../useReportPage';
import { cycleNote } from '../fleetReportUtils';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';
import useConsolidatedReport from './useConsolidatedReport';
import { FUEL_EXPORT_COLUMNS, sortReportRows } from './consolidatedReportModel';
import { DetailButton, GroupControls, MethodNote, ReportScope } from './ConsolidatedReportParts';

const PAGE_SIZE = 10;
const money = (value) => (value == null ? '—' : formatINR(value, { decimals: 2 }));
const mileage = (value) => (value == null ? '—' : `${formatNum(value, { decimals: 2 })} km/L`);
const numeric = (key, label, render) => ({
  key,
  label,
  sortKey: key,
  sortable: true,
  align: 'right',
  render,
});

function FuelDetails({ report, row }) {
  const [kind, setKind] = useState('cycles');
  const [page, setPage] = useReportPage(`${report.key}|${row.id}|${kind}`);
  const params = { ...report.query, groupId: row.id, kind, page, limit: PAGE_SIZE };
  const key = JSON.stringify(params);
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.fuelDetails(params, signal),
    [key],
    { scopeKey: report.key },
  );
  const columns =
    kind === 'cycles'
      ? [
          { key: 'endDate', label: 'Closed', render: (r) => formatDateIST(r.endDate) },
          { key: 'vehicleNumber', label: 'Truck' },
          { key: 'distanceKm', label: 'Distance', render: (r) => formatKm(r.distanceKm) },
          { key: 'fuelLiters', label: 'Diesel', render: (r) => formatLitres(r.fuelLiters) },
          { key: 'mileageKmPerL', label: 'Mileage', render: (r) => mileage(r.mileageKmPerL) },
          {
            key: 'quality',
            label: 'Used in average',
            render: (r) => (
              <span className={`cr-status ${r.quality === 'VALID' ? 'cr-status--good' : ''}`}>
                {r.quality === 'VALID'
                  ? 'Included'
                  : r.quality === 'IMPLAUSIBLE_KMPL'
                    ? 'Excluded: check readings'
                    : 'Excluded: incomplete data'}
              </span>
            ),
          },
        ]
      : [
          { key: 'date', label: 'Bill date', render: (r) => formatDateIST(r.date) },
          {
            key: 'fluid',
            label: 'Fluid',
            render: (r) => (r.fluid === 'ADBLUE' ? 'AdBlue' : 'Diesel'),
          },
          {
            key: 'pump',
            label: 'Pump / place',
            render: (r) => (typeof r.pump === 'string' ? r.pump : r.pump?.name || '—'),
          },
          { key: 'litres', label: 'Purchased', render: (r) => formatLitres(r.litres) },
          { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
        ];
  return (
    <section className="cr-detail" aria-label={`Supporting records for ${row.label}`}>
      <div className="cr-detail-head">
        <div>
          <h3>{row.label}</h3>
          <p>
            {kind === 'cycles'
              ? 'Completed cycles that closed in this period. Excluded cycles remain visible for checking.'
              : 'Diesel and AdBlue purchases dated in this period. Purchases can fund later running.'}
          </p>
        </div>
        <div className="cr-switch" role="group" aria-label="Supporting record type">
          {[
            ['cycles', 'Completed cycles'],
            ['bills', 'Bills in period'],
          ].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={data?.rows || []}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle={
          kind === 'cycles'
            ? 'No completed cycles closed in this period'
            : 'No purchases in this period'
        }
        emptyHint="A purchase and a completed mileage cycle can belong to different periods."
      />
      <ReportFooter
        summary={`${data?.meta?.total || 0} ${kind === 'cycles' ? 'cycles' : 'bills'}`}
        page={page}
        totalPages={data?.meta?.totalPages || 0}
        onPage={setPage}
      />
    </section>
  );
}

export default function FuelMileageReport({ navigation = null } = {}) {
  const report = useConsolidatedReport('fuel');
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.fuelMileage(report.query, signal),
    [report.key],
    { enabled: !report.dateError, scopeKey: report.key },
  );
  const [selected, setSelected] = useState(null);
  const sortBy = [
    'label',
    'dieselLitres',
    'defLitres',
    'totalSpend',
    'mileageKmpl',
    'dieselCostPerKm',
    'cycleCount',
  ].includes(report.params.get('sort'))
    ? report.params.get('sort')
    : 'totalSpend';
  const order = report.params.get('order') === 'asc' ? 'asc' : 'desc';
  const rows = useMemo(
    () => sortReportRows(data?.rows || [], sortBy, order),
    [data, sortBy, order],
  );
  const [page, setPage] = useReportPage(`${report.key}|${sortBy}|${order}`);
  const expandedId = selected?.key === report.key ? selected.id : null;
  const toggle = (row) =>
    setSelected({ key: report.key, id: expandedId === row.id ? null : row.id });
  const summary = data?.summary;
  const maxSpend = Math.max(0, ...rows.map((row) => row.totalSpend || 0));
  const columns = [
    {
      key: 'label',
      label: report.groups.find((g) => g.value === report.groupBy).label,
      sortKey: 'label',
      sortable: true,
      render: (r) => (
        <>
          <div className="cell-primary cr-name">{r.label}</div>
          <div className="cell-secondary">
            {report.groupBy === 'model' ? `${r.memberCount} trucks` : r.secondary}
          </div>
        </>
      ),
    },
    numeric('dieselLitres', 'Diesel bought', (r) => (
      <>
        <div className="cell-primary">{formatLitres(r.dieselLitres)}</div>
        <div className="cell-secondary">{formatINR(r.dieselSpend)}</div>
      </>
    )),
    numeric('defLitres', 'AdBlue bought', (r) => (
      <>
        <div className="cell-primary">{formatLitres(r.defLitres)}</div>
        <div className="cell-secondary">{formatINR(r.defSpend)}</div>
      </>
    )),
    numeric('totalSpend', 'Fuel spend', (r) => (
      <div className="cr-spend-value">
        <div className="cell-primary">{formatINR(r.totalSpend)}</div>
        {maxSpend > 0 && (
          <div
            className="cr-spend-meter"
            aria-hidden="true"
            title="Purchase spend relative to the highest group in this view"
          >
            <i style={{ width: `${(Math.max(0, r.totalSpend || 0) / maxSpend) * 100}%` }} />
          </div>
        )}
      </div>
    )),
    numeric('mileageKmpl', 'Cycle mileage', (r) => (
      <>
        <div className="cell-primary cr-measure">{mileage(r.mileageKmpl)}</div>
        <div className="cell-secondary">
          {r.cycleCount ? formatKm(r.distanceKm) : 'No eligible completed cycle'}
        </div>
      </>
    )),
    numeric('dieselCostPerKm', 'Diesel ₹/km', (r) => (
      <div className="cell-primary">{money(r.dieselCostPerKm)}</div>
    )),
    {
      key: 'cycleCount',
      label: 'Coverage',
      sortKey: 'cycleCount',
      sortable: true,
      render: (r) => (
        <div>
          <span className={`cr-status ${r.cycleCount ? 'cr-status--good' : ''}`}>
            {cycleNote(r.cycleCount, r.excludedCycleCount)}
          </span>
          {report.groupBy === 'model' && (
            <div className="cell-secondary">
              {r.measuredMembers} / {r.memberCount} trucks with mileage
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      label: '',
      render: (r) => (
        <DetailButton label={r.label} expanded={expandedId === r.id} onClick={() => toggle(r)} />
      ),
    },
  ];
  const available = !error && !report.dateError && summary;
  return (
    <ReportFrame
      variant="consolidated"
      navigation={navigation}
      title="Fuel & Mileage"
      subtitle="Fuel purchases and completed-cycle efficiency, with the records behind every figure."
      filters={
        <ReportScope
          report={report}
          searchPlaceholder={`Search ${report.groupBy === 'vehicle' ? 'truck or model' : report.groupBy}`}
        />
      }
      actions={
        <ExportButton
          rows={rows}
          columns={FUEL_EXPORT_COLUMNS}
          filename="fuel-mileage"
          buttonClass="rpt-btn"
          disabled={!available || !rows.length || loading}
          meta={{
            filters: [
              { label: 'Period (IST)', value: `${report.range.from} → ${report.range.to}` },
              { label: 'Group by', value: report.groupBy },
              {
                label: 'Basis',
                value:
                  'Purchases by bill date; eligible completed cycles by closing date. Driver = cycle opener.',
              },
            ],
          }}
        />
      }
      kpis={
        available
          ? [
              {
                label: 'Fuel purchased',
                value: formatINR(summary.totalSpend),
                icon: IndianRupee,
                hint: 'Diesel + AdBlue purchases',
              },
              {
                label: 'Diesel bought',
                value: formatLitres(summary.dieselLitres),
                icon: Fuel,
                tone: 'teal',
                hint: `AdBlue: ${formatLitres(summary.defLitres)} (separate)`,
              },
              {
                label: 'Cycle mileage',
                value: mileage(summary.mileageKmpl),
                icon: Gauge,
                tone: 'violet',
                hint: `${summary.cycleCount} eligible cycles · ${formatKm(summary.distanceKm)}`,
              },
              {
                label:
                  report.groupBy === 'driver'
                    ? 'Listed drivers with mileage'
                    : 'Listed trucks with mileage',
                value: `${summary.measuredMembers} / ${summary.memberCount}`,
                icon: CheckCircle2,
                tone: 'orange',
                hint: `${summary.excludedCycleCount} excluded cycles`,
              },
            ]
          : null
      }
      notice={
        <>
          <MethodNote>
            Purchases follow the <strong>bill date</strong>. Mileage and diesel ₹/km use valid
            completed cycles that <strong>closed in the period</strong>; they do not cover all fleet
            running. AdBlue litres are excluded from diesel mileage. Coverage refers to the listed
            records, rather than every registered truck.
            {report.groupBy === 'driver' && (
              <p>
                Drivers are associated with their bills and the cycles they opened. Cycles can span
                multiple drivers; this is not an individual driving score. Unassigned bills are
                outside this driver grouping.
              </p>
            )}
            {report.groupBy === 'model' && (
              <p>
                Model totals can cover different routes, loads and duties. Compare equivalent work
                before judging performance; these figures do not rank the best model.
              </p>
            )}
          </MethodNote>
          {available && data?.meta && Object.hasOwn(data.meta, 'dataAsOf') && (
            <div className="cr-source-notice">
              <ReportDataNotice
                dataAsOf={data.meta.dataAsOf}
                label="Latest recorded fuel bill"
                emptyText="No fuel bills have been recorded for this scope."
                staleHint="No newer bills are present in these report inputs. An empty period does not establish zero fuel use."
              />
            </div>
          )}
        </>
      }
      footer={
        <ReportFooter
          summary={`${rows.length} ${report.groupBy === 'vehicle' ? 'trucks' : report.groupBy === 'driver' ? 'drivers' : 'models'}`}
          page={page}
          totalPages={Math.ceil(rows.length / PAGE_SIZE)}
          onPage={setPage}
        />
      }
    >
      <div className="cr-table-heading">
        <div>
          <h3>Where the fuel went</h3>
          <p>Select a group to inspect its completed cycles and purchases.</p>
        </div>
        <GroupControls
          groups={report.groups}
          value={report.groupBy}
          onChange={(group) => report.patch({ group })}
        />
      </div>
      <DataTable
        columns={columns}
        rows={report.dateError ? [] : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        rowKey={(r) => r.id}
        loading={!report.dateError && loading}
        error={error}
        onRetry={refetch}
        sortBy={sortBy}
        sortOrder={order}
        onSort={(sort, nextOrder) => report.patch({ sort, order: nextOrder || 'asc' })}
        onRowClick={toggle}
        expandedKeys={new Set(expandedId ? [expandedId] : [])}
        renderExpanded={(row) => (
          <FuelDetails key={`${report.key}|${row.id}`} report={report} row={row} />
        )}
        emptyTitle={
          report.dateError ? 'Complete the reporting period' : 'No fuel activity in this period'
        }
        emptyHint="Try a wider period or clear the truck, driver or search filter."
      />
    </ReportFrame>
  );
}
