import { useMemo, useState } from 'react';
import { Truck, Route, IndianRupee, Waypoints } from 'lucide-react';
import DataTable from '../../../../components/ui/DataTable';
import ExportButton from '../../../../components/ui/ExportButton';
import useApi from '../../../../hooks/useApi';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import { formatDateIST } from '../../../../utils/dateUtils';
import ReportFrame, { ReportFooter } from '../ReportFrame';
import useReportPage from '../useReportPage';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';
import useConsolidatedReport from './useConsolidatedReport';
import FuelPricingNote from './FuelPricingNote';
import {
  RECORD_EXPORT_COLUMNS,
  TRIP_EXPORT_COLUMNS,
  sortReportRows,
} from './consolidatedReportModel';
import {
  Cost,
  DetailButton,
  GroupControls,
  MethodNote,
  RecordLink,
  ReportScope,
} from './ConsolidatedReportParts';

const PAGE_SIZE = 10;
const km = (value) => (value == null ? '—' : formatKm(value));
const litres = (value) => (value == null ? '—' : formatLitres(value));
const titles = {
  summary: 'Running cost breakdown',
  trips: 'Completed trip register',
  movements: 'Extra movement',
};

function recordColumns(movements = false) {
  return [
    { key: 'date', label: 'Date', render: (r) => formatDateIST(r.date) },
    {
      key: 'vehicleNumber',
      label: 'Truck / driver',
      render: (r) => (
        <>
          <div className="cell-primary cr-name">{r.vehicleNumber || 'Unknown truck'}</div>
          <div className="cell-secondary">{r.driverName || 'Driver not assigned'}</div>
        </>
      ),
    },
    movements
      ? {
          key: 'purpose',
          label: 'Purpose / status',
          render: (r) => (
            <>
              <div className="cell-primary">{r.purpose || 'Purpose not recorded'}</div>
              <span className={`cr-status ${r.kind === 'approved' ? 'cr-status--good' : ''}`}>
                {r.kind === 'approved' ? 'Approved non-business' : 'Deviation — review'}
              </span>
            </>
          ),
        }
      : {
          key: 'from',
          label: 'Delivery',
          render: (r) => (
            <>
              <div className="cell-primary">
                {r.from || '—'} → {r.to || '—'}
              </div>
              <div className="cell-secondary">
                {r.status === 'CONFIRMED' ? 'Confirmed' : 'Completed'} ·{' '}
                {(r.distanceSource || 'distance unavailable').toLowerCase().replaceAll('_', ' ')}
              </div>
            </>
          ),
        },
    {
      key: 'distance',
      label: movements ? 'Extra km' : 'Loaded km',
      render: (r) => km(movements ? r.extraKm : r.distanceKm),
    },
    {
      key: 'fuel',
      label: movements ? 'Extra fuel' : 'Laden fuel used',
      render: (r) => (
        <>
          <div className="cell-primary">
            {litres(r.fuelUsedLitres ?? (!movements ? r.roleFuelL : null))}
          </div>
          {!movements && r.fuelUsedLitres == null && r.roleFuelL != null && (
            <div className="cell-secondary">
              {r.ladenFuelBasis === 'PARTIAL' ? 'Partial fuel measurement' : 'Unverified role fuel'}
            </div>
          )}
          {!movements && r.fuelSource === 'ROLE_ENGINE' && (
            <div className="cell-secondary">Complete laden measurement</div>
          )}
          {!movements && r.fuelReadingConflict && (
            <div className="cr-caution">Saved role fuel differs; direct measurement used</div>
          )}
          {!movements && (
            <div className="cell-secondary">
              {r.refuelLitres == null
                ? 'No diesel purchase during trip'
                : `${litres(r.refuelLitres)} bought during trip`}
            </div>
          )}
        </>
      ),
    },
    ...(!movements
      ? [
          {
            key: 'mileageKmPerL',
            label: 'Mileage',
            render: (r) =>
              r.mileageKmPerL == null ? '—' : `${formatNum(r.mileageKmPerL, { decimals: 2 })} km/L`,
          },
        ]
      : []),
    {
      key: 'totalCostInr',
      label: 'Estimated cost',
      render: (r) => (
        <>
          <Cost
            value={r.totalCostInr}
            missing={r.totalCostInr == null ? 1 : 0}
            partial={r.partialCost ? 1 : 0}
          />
          {r.fuelPricing && (
            <>
              <div className="cell-secondary">
                Fuel {r.fuelCostInr == null ? '—' : formatINR(r.fuelCostInr)} · wear{' '}
                {r.wearCostInr == null ? '—' : formatINR(r.wearCostInr)}
              </div>
              <FuelPricingNote quote={r.fuelPricing} />
            </>
          )}
        </>
      ),
    },
    { key: 'open', label: '', render: (r) => <RecordLink record={r} /> },
  ];
}

function GroupDetail({ row, records }) {
  const items = records.filter((r) => row.recordIds.includes(r.id));
  const [kind, setKind] = useState(items.some((r) => r.kind === 'trip') ? 'trips' : 'movements');
  const [page, setPage] = useReportPage(kind);
  const filtered = items.filter((r) => (kind === 'trips' ? r.kind === 'trip' : r.kind !== 'trip'));
  return (
    <section className="cr-detail" aria-label={`Supporting records for ${row.label}`}>
      <div className="cr-detail-head">
        <div>
          <h3>{row.label}</h3>
          <p>Only records included in this group and reporting period.</p>
        </div>
        <div className="cr-switch" role="group" aria-label="Group record type">
          {[
            ['trips', 'Trips'],
            ['movements', 'Extra movement'],
          ].map(([id, label]) => (
            <button type="button" key={id} aria-pressed={kind === id} onClick={() => setKind(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={recordColumns(kind === 'movements')}
        rows={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        rowKey={(r) => r.id}
        emptyTitle={`No ${kind === 'trips' ? 'completed trips' : 'extra movement'} in this group`}
      />
      <ReportFooter
        summary={`${filtered.length} records`}
        page={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        onPage={setPage}
      />
    </section>
  );
}

export default function TripsRunningCostReport() {
  const report = useConsolidatedReport('trips');
  const view = ['summary', 'trips', 'movements'].includes(report.params.get('view'))
    ? report.params.get('view')
    : 'summary';
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.tripsRunningCost(report.query, signal),
    [report.key],
    { enabled: !report.dateError, scopeKey: report.key },
  );
  const [selected, setSelected] = useState(null);
  const sortBy = [
    'label',
    'tripCount',
    'ladenKm',
    'businessCost',
    'approvedCost',
    'deviationCost',
    'totalCost',
  ].includes(report.params.get('sort'))
    ? report.params.get('sort')
    : 'totalCost';
  const order = report.params.get('order') === 'asc' ? 'asc' : 'desc';
  const rows = useMemo(
    () =>
      view === 'summary'
        ? sortReportRows(data?.rows || [], sortBy, order)
        : (data?.records || []).filter((r) =>
            view === 'trips' ? r.kind === 'trip' : r.kind !== 'trip',
          ),
    [data, view, sortBy, order],
  );
  const [page, setPage] = useReportPage(`${report.key}|${view}|${sortBy}|${order}`);
  const expandedId = selected?.key === report.key ? selected.id : null;
  const toggle = (r) => setSelected({ key: report.key, id: expandedId === r.id ? null : r.id });
  const summary = data?.summary;
  const available = !error && !report.dateError && summary;
  const cols = [
    {
      key: 'label',
      label: report.groups.find((g) => g.value === report.groupBy).label,
      sortable: true,
      sortKey: 'label',
      render: (r) => <span className="cr-name">{r.label}</span>,
    },
    { key: 'tripCount', label: 'Trips', sortable: true, sortKey: 'tripCount', align: 'right' },
    {
      key: 'ladenKm',
      label: 'Loaded / empty km',
      sortable: true,
      sortKey: 'ladenKm',
      render: (r) => (
        <>
          <div className="cell-primary">{km(r.ladenKm)} loaded</div>
          <div className="cell-secondary">
            {r.approachKm == null || r.returnKm == null
              ? 'Empty distance incomplete'
              : `${km(r.approachKm + r.returnKm)} known empty`}
            {r.legMeasuredTrips < r.tripCount
              ? ` · legs measured for ${r.legMeasuredTrips}/${r.tripCount} trips`
              : ''}
          </div>
        </>
      ),
    },
    {
      key: 'businessCost',
      label: 'Trip running',
      sortable: true,
      sortKey: 'businessCost',
      render: (r) => (
        <Cost
          value={r.businessCost}
          missing={r.uncostedTrips ?? r.tripCount - r.costedTrips}
          partial={r.partialTrips || 0}
        />
      ),
    },
    {
      key: 'approvedCost',
      label: 'Approved extra',
      sortable: true,
      sortKey: 'approvedCost',
      render: (r) => <Cost value={r.approvedCost} />,
    },
    {
      key: 'deviationCost',
      label: 'Deviation',
      sortable: true,
      sortKey: 'deviationCost',
      render: (r) => <Cost value={r.deviationCost} />,
    },
    {
      key: 'totalCost',
      label: 'Estimated total',
      sortable: true,
      sortKey: 'totalCost',
      render: (r) => (
        <Cost value={r.totalCost} missing={r.uncostedRecords} partial={r.partialCostRecords} />
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
  return (
    <ReportFrame
      variant="consolidated"
      title="Trips & Running Cost"
      subtitle="Completed deliveries, their estimated running cost, and extra movement explained separately."
      filters={
        <ReportScope report={report} searchPlaceholder="Search truck, driver, plant or place" />
      }
      actions={
        <ExportButton
          rows={rows}
          columns={view === 'summary' ? TRIP_EXPORT_COLUMNS : RECORD_EXPORT_COLUMNS}
          filename={`trips-running-cost-${view}`}
          buttonClass="rpt-btn"
          disabled={!available || loading || !rows.length}
          meta={{
            filters: [
              { label: 'Period (IST)', value: `${report.range.from} → ${report.range.to}` },
              {
                label: 'Basis',
                value:
                  'Completed trips by pickup departure; extra movement by opening date. Fuel uses Daily Digest last-refuelling state + reporting-day stored diesel history; known wear shown separately. Estimated running cost, not profit.',
              },
              {
                label: 'Scope',
                value: data?.meta?.truncated
                  ? `Partial: capped at ${data.meta.recordCap} trips and movements each; narrow the dates.`
                  : 'All matching records',
              },
            ],
          }}
        />
      }
      kpis={
        available
          ? [
              {
                label: 'Completed trips',
                value: formatNum(summary.tripCount),
                icon: Truck,
                hint: `${summary.costedTrips} of ${summary.tripCount} trips fully costed`,
              },
              {
                label: 'Loaded distance',
                value: km(summary.ladenKm),
                icon: Route,
                tone: 'teal',
                hint: `${summary.mileageKmpl == null ? 'Mileage unavailable' : `${formatNum(summary.mileageKmpl, { decimals: 2 })} km/L`} · ${summary.mileageTrips || 0} trips with complete fuel`,
              },
              {
                label: 'Known running cost',
                value: summary.totalCost == null ? '—' : formatINR(summary.totalCost),
                icon: IndianRupee,
                tone: 'violet',
                hint: `${summary.uncostedRecords} not costed · ${summary.partialCostRecords} partial`,
              },
              {
                label: 'Extra distance',
                value: km(summary.extraKm),
                icon: Waypoints,
                tone: 'orange',
                hint: `${summary.approvedCount} approved · ${summary.deviationCount} deviations`,
              },
            ]
          : null
      }
      notice={
        <>
          <MethodNote>
            Completed trips follow their <strong>pickup departure date</strong>; extra movements
            follow their <strong>opening date</strong>. Costs cover available fuel and wear
            estimates, not full business expenditure or profit. Missing measurements are not zero.
            Approved extra movement is shown separately from deviations. Fuel valuation reuses Daily
            Digest: last refuelling evidence at pickup departure selects the state, and the pickup
            day’s stored diesel history supplies the rate. Extra movements use their opening
            time/day. The shared 07:30 IST price-day rule and earlier-quote flags apply. Missing
            refuelling location, price or consumption remains unknown; wear-only subtotals are
            marked partial. Complete laden-role measurements are used for mileage when the direct
            trip fuel field is absent. Partial fuel contributes only to known cost subtotals and is
            excluded from mileage; it cannot make a trip fully costed. Actual fuel purchases retain
            their bills.
          </MethodNote>
          {available && (summary.uncostedRecords > 0 || summary.partialCostRecords > 0) && (
            <p className="cr-quality-notice" role="status">
              <span className="cr-quality-dot" aria-hidden="true" />
              <strong>Cost is incomplete:</strong> {summary.costedTrips} of {summary.tripCount}{' '}
              trips have a complete cost.
              <span className="cr-quality-extra">
                {' '}
                {summary.uncostedRecords} uncosted · {summary.partialCostRecords} partial. Missing
                costs are not zero.
              </span>
            </p>
          )}
          {data?.meta?.truncated && (
            <p className="cr-caution cr-truncation" role="status">
              Partial report: only the newest {data.meta.recordCap.toLocaleString()} trips and extra
              movements per source are included. Narrow the period for complete totals and exports.
            </p>
          )}
          {available && summary.stalePriceRecords > 0 && (
            <p className="cr-caution">
              {summary.stalePriceRecords} records use the latest earlier stored diesel price.
            </p>
          )}
          {available && summary.tripCount === 0 && data?.meta?.coverage && (
            <p className="cr-quality-notice" role="status">
              <span className="cr-quality-dot" />
              {data.meta.coverage.latestCompletedDeparture
                ? `Latest completed-trip departure: ${formatDateIST(data.meta.coverage.latestCompletedDeparture)}. `
                : 'No completed trips recorded in this scope. '}
              {data.meta.coverage.openTripsInPeriod} open · {data.meta.coverage.reviewTripsInPeriod}{' '}
              awaiting review in this period. These are excluded from completed-trip totals.
            </p>
          )}
        </>
      }
      footer={
        <ReportFooter
          summary={`${rows.length} ${view === 'summary' ? 'groups' : 'records'}`}
          page={page}
          totalPages={Math.ceil(rows.length / PAGE_SIZE)}
          onPage={setPage}
        />
      }
    >
      <div className="cr-table-heading cr-table-heading--views">
        <div className="cr-switch" role="group" aria-label="Report view">
          {[
            ['summary', 'Summary'],
            ['trips', 'Trip register'],
            ['movements', 'Extra movement'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => report.patch({ view: id })}
            >
              {label}
            </button>
          ))}
        </div>
        <h3 className="cr-visually-hidden">{titles[view]}</h3>
        {view === 'summary' && (
          <GroupControls
            groups={report.groups}
            value={report.groupBy}
            onChange={(group) => report.patch({ group })}
          />
        )}
      </div>
      <DataTable
        columns={view === 'summary' ? cols : recordColumns(view === 'movements')}
        rows={report.dateError ? [] : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        rowKey={(r) => r.id}
        loading={!report.dateError && loading}
        error={error}
        onRetry={refetch}
        sortBy={sortBy}
        sortOrder={order}
        onSort={
          view === 'summary'
            ? (sort, nextOrder) => report.patch({ sort, order: nextOrder || 'asc' })
            : null
        }
        onRowClick={view === 'summary' ? toggle : null}
        expandedKeys={new Set(view === 'summary' && expandedId ? [expandedId] : [])}
        renderExpanded={(row) => (
          <GroupDetail key={`${report.key}|${row.id}`} row={row} records={data?.records || []} />
        )}
        emptyTitle={
          report.dateError ? 'Complete the reporting period' : 'No matching running in this period'
        }
        emptyHint="Try a wider period or clear the truck, driver or search filter."
      />
    </ReportFrame>
  );
}
