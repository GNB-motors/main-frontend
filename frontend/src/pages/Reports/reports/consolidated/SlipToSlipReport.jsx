import { useState } from 'react';
import { CheckCircle2, Fuel, Gauge, IndianRupee } from 'lucide-react';
import DataTable from '../../../../components/ui/DataTable';
import ExportButton from '../../../../components/ui/ExportButton';
import useApi from '../../../../hooks/useApi';
import { formatDateTimeIST } from '../../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import ReportFrame, { ReportFooter } from '../ReportFrame';
import useReportPage from '../useReportPage';
import useConsolidatedReport from './useConsolidatedReport';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';
import { DetailButton, MethodNote, ReportScope } from './ConsolidatedReportParts';

const PAGE_SIZE = 15;
const litres = (v) => (v == null ? '—' : formatLitres(v));
const money = (v) => (v == null ? '—' : formatINR(v, { decimals: 2 }));
const km = (v) => (v == null ? '—' : formatKm(v));
const mileage = (v) => (v == null ? '—' : `${formatNum(v, { decimals: 2 })} km/L`);
const balanceLabel = (r) =>
  ({
    CAPACITY_REQUIRED: 'Tank capacity required',
    FIRST_FULL_REQUIRED: 'First full fill required',
    CONFIRMED_FULL: 'Reset to confirmed full',
    ESTIMATED: 'Estimated balance',
    COVERAGE_GAP: 'Engine gap: balance uncertain',
    BALANCE_OUT_OF_RANGE: 'Impossible balance: check records',
    MISSING_FILL_LITRES: 'Slip quantity missing',
  })[r.balanceStatus] || 'Balance unknown';
const qualityLabel = (value) =>
  ({
    VALID: 'Engine-based',
    INVALID_TIME: 'Check slip times',
    ENGINE_GAP: 'Incomplete engine data',
    CHECK_ENGINE: 'Check engine reading',
    ODOMETER_REVERSED: 'Check odometer',
    MEASURED_ZERO: 'Measured zero',
    CHECK_READINGS: 'Check readings',
    COVERAGE_GAP: 'Missing engine coverage',
    BALANCE_OUT_OF_RANGE: 'Estimated stock outside tank limits',
    MISSING_FILL_LITRES: 'Missing refill quantity',
  })[value] || value;

const EXPORT = [
  { key: 'vehicleNumber', label: 'Truck' },
  { key: 'driverName', label: 'Drivers in interval' },
  { key: 'startDate', label: 'Opening diesel slip' },
  { key: 'endDate', label: 'Closing diesel slip' },
  { key: 'distanceKm', label: 'Interval distance (km)', type: 'number' },
  { key: 'distanceBasis', label: 'Distance basis' },
  { key: 'fuelUsedLitres', label: 'Engine consumption with complete coverage (L)', type: 'number' },
  { key: 'measuredFuelLitres', label: 'Known measured fuel subtotal (L)', type: 'number' },
  { key: 'mileageKmpl', label: 'Engine-based mileage (km/L)', type: 'number' },
  { key: 'estimatedCost', label: 'Last-slip-price consumption estimate (₹)', type: 'currency' },
  { key: 'closingFillLitres', label: 'Closing slip purchased fuel (L)', type: 'number' },
  { key: 'closingFillSpend', label: 'Closing slip purchase spend (₹)', type: 'currency' },
  { key: 'tankCapacityLitres', label: 'Fuel tank capacity (L)', type: 'number' },
  { key: 'balanceAfterOpening', label: 'Balance after opening slip (L)', type: 'number' },
  {
    key: 'balanceBeforeClosing',
    label: 'Estimated balance before closing slip (L)',
    type: 'number',
  },
  { key: 'balanceAfterClosing', label: 'Balance after closing slip (L)', type: 'number' },
  {
    key: 'fullFillVarianceLitres',
    label: 'Full refill minus predicted empty space (L)',
    type: 'number',
  },
  { key: 'balanceStatus', label: 'Balance status' },
  { key: 'stockWarning', label: 'Stock warning before reset' },
  { key: 'measuredMinutes', label: 'Engine minutes covered', type: 'number' },
  { key: 'durationMinutes', label: 'Interval minutes', type: 'number' },
  { key: 'quality', label: 'Consumption quality' },
  { key: 'apportioned', label: 'Boundary allocation estimated' },
  {
    key: 'minorMovementKm',
    label: 'Minor zero-fuel movement within allowance (km)',
    type: 'number',
  },
];

function SlipEvidence({ row }) {
  return (
    <section className="cr-detail" aria-label={`Slip interval evidence for ${row.vehicleNumber}`}>
      <h3>Engine consumption and tank reconciliation</h3>
      <p className="cr-evidence-note">
        {row.sourceIds.length} engine windows ·{' '}
        {formatNum(row.measuredMinutes / 60, { decimals: 2 })} /{' '}
        {formatNum(row.durationMinutes / 60, { decimals: 2 })} hours covered.
        {row.apportioned && ' Boundary hours are allocated by elapsed time.'} The closing purchase
        updates the tank; its litres are separate from consumption in this interval.
        {row.sharedDrivers &&
          ' This whole interval includes more than one driver; it is not a driver performance comparison.'}
      </p>
      {row.minorMovementKm > 0 && (
        <p className="cr-evidence-note">
          {formatNum(row.minorMovementKm, { decimals: 2 })} km of minor zero-fuel movement is within
          the 0.2 km per engine window / 0.5 km per truck-day allowance. These readings alone do not
          break measured fuel or tank continuity.
        </p>
      )}
      <DataTable
        columns={[
          { key: 'refuelTime', label: 'Slip time', render: (r) => formatDateTimeIST(r.refuelTime) },
          { key: 'role', label: 'Role' },
          {
            key: 'fillingType',
            label: 'Fill type',
            render: (r) =>
              r.fillingType === 'FULL_TANK' ? 'Confirmed full' : 'Partial / unspecified',
          },
          { key: 'litres', label: 'Purchased fuel', render: (r) => litres(r.litres) },
          { key: 'totalAmount', label: 'Purchase amount', render: (r) => money(r.totalAmount) },
          { key: 'odometerReading', label: 'Odometer', render: (r) => km(r.odometerReading) },
        ]}
        rows={[
          { ...row.openingBill, role: 'Opening slip' },
          { ...row.closingBill, role: 'Closing slip' },
        ]}
        rowKey={(r) => r.id}
      />
      <p className="cr-evidence-note">
        After opening: <strong>{litres(row.balanceAfterOpening)}</strong> − engine use:{' '}
        <strong>{litres(row.fuelUsedLitres)}</strong> = before closing:{' '}
        <strong>{litres(row.balanceBeforeClosing)}</strong>; add closing purchase:{' '}
        <strong>{litres(row.closingFillLitres)}</strong>. After closing:{' '}
        <strong>{litres(row.balanceAfterClosing)}</strong> · {balanceLabel(row)}.
        {row.anchorAt && <> Baseline full fill: {formatDateTimeIST(row.anchorAt)}.</>}
      </p>
      {row.stockWarning && (
        <p className="cr-caution">
          Stock check: {qualityLabel(row.stockWarning)}. Inspect missing data or slips before
          relying on the balance.
        </p>
      )}
      {row.fullFillVarianceLitres != null && (
        <p className="cr-quality-notice">
          Full-fill reconciliation: actual refill minus predicted empty space ={' '}
          <strong>{litres(row.fullFillVarianceLitres)}</strong>. Positive means more fuel was added
          than predicted. The tank resets to its confirmed capacity. This difference is not proof of
          theft.
        </p>
      )}
      <h3>Earlier slip price used for consumption</h3>
      <DataTable
        columns={[
          { key: 'at', label: 'Price effective from', render: (r) => formatDateTimeIST(r.at) },
          { key: 'rate', label: 'Rate / litre', render: (r) => money(r.rate) },
        ]}
        rows={row.priceReferences}
        rowKey={(r) => r.id}
        emptyTitle="No usable earlier slip price"
      />
    </section>
  );
}

export default function SlipToSlipReport({ navigation }) {
  const report = useConsolidatedReport('fuel');
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.slipIntervals(report.query, signal),
    [report.key],
    { enabled: !report.dateError, scopeKey: report.key },
  );
  const rows = data?.rows || [],
    summary = data?.summary,
    available = !error && !report.dateError && summary;
  const [page, setPage] = useReportPage(report.key),
    [selected, setSelected] = useState(null);
  const expanded = selected?.key === report.key ? selected.id : null;
  const toggle = (r) => setSelected({ key: report.key, id: expanded === r.id ? null : r.id });
  const columns = [
    {
      key: 'vehicleNumber',
      label: 'Truck / driver',
      render: (r) => (
        <>
          <div className="cell-primary cr-name">{r.vehicleNumber}</div>
          <div className="cell-secondary">
            {r.driverName}
            {r.sharedDrivers ? ' · shared interval' : ''}
          </div>
        </>
      ),
    },
    {
      key: 'startDate',
      label: 'Slip-to-slip period',
      render: (r) => (
        <>
          <div>{formatDateTimeIST(r.startDate)}</div>
          <div className="cell-secondary">→ {formatDateTimeIST(r.endDate)}</div>
        </>
      ),
    },
    {
      key: 'distanceKm',
      label: 'Distance',
      align: 'right',
      render: (r) => (
        <>
          <div>{km(r.distanceKm)}</div>
          <div className="cell-secondary">
            {r.distanceBasis === 'SLIP_ODOMETERS' ? 'Slip odometers' : 'Engine windows'}
          </div>
        </>
      ),
    },
    {
      key: 'fuelUsedLitres',
      label: 'Engine consumption',
      align: 'right',
      render: (r) => (
        <>
          <div>{litres(r.fuelUsedLitres)}</div>
          <div className="cell-secondary">
            {r.completeCoverage
              ? 'Complete interval'
              : `${formatNum(r.measuredMinutes / 60, { decimals: 1 })} / ${formatNum(r.durationMinutes / 60, { decimals: 1 })} h covered`}
          </div>
        </>
      ),
    },
    { key: 'mileageKmpl', label: 'Mileage', align: 'right', render: (r) => mileage(r.mileageKmpl) },
    {
      key: 'estimatedCost',
      label: 'Consumption cost',
      align: 'right',
      render: (r) => money(r.estimatedCost),
    },
    {
      key: 'closingFillLitres',
      label: 'Closing purchase',
      align: 'right',
      render: (r) => (
        <>
          <div>{litres(r.closingFillLitres)}</div>
          <div className="cell-secondary">{money(r.closingFillSpend)}</div>
        </>
      ),
    },
    {
      key: 'balanceAfterClosing',
      label: 'Tank after closing',
      render: (r) => (
        <>
          <div>{litres(r.balanceAfterClosing)}</div>
          <div className="cell-secondary">{balanceLabel(r)}</div>
        </>
      ),
    },
    {
      key: 'quality',
      label: 'Evidence',
      render: (r) => (
        <>
          <span className={`cr-status ${r.quality === 'VALID' ? 'cr-status--good' : ''}`}>
            {qualityLabel(r.quality)}
          </span>
          <DetailButton
            label={`${r.vehicleNumber} slip interval`}
            expanded={expanded === r.id}
            onClick={() => toggle(r)}
          />
        </>
      ),
    },
  ];
  return (
    <ReportFrame
      variant="consolidated"
      title="Fuel & Mileage"
      subtitle="Engine consumption between diesel slips, plus estimated tank balance."
      navigation={navigation}
      filters={<ReportScope report={report} searchPlaceholder="Search truck, model or driver" />}
      actions={
        <ExportButton
          rows={rows}
          columns={EXPORT}
          filename="fuel-slip-to-slip"
          buttonClass="rpt-btn"
          disabled={!available || loading || !rows.length}
          meta={{
            filters: [
              { label: 'Period (IST)', value: `${report.range.from} → ${report.range.to}` },
              {
                label: 'Basis',
                value:
                  'Intervals selected by closing diesel slip. Consumption from complete engine windows; stock is estimated from confirmed full + slips − engine use. Closing purchase is separate from consumption cost.',
              },
            ],
          }}
        />
      }
      kpis={
        available
          ? [
              {
                label: 'Slip intervals',
                value: formatNum(summary.intervalCount),
                icon: CheckCircle2,
                hint: `${summary.completeIntervals} have complete engine coverage`,
              },
              {
                label: 'Engine fuel used',
                value: litres(summary.fuelUsedLitres),
                icon: Fuel,
                tone: 'teal',
                hint: `${summary.incompleteIntervals} intervals excluded for gaps or readings`,
              },
              {
                label: 'Engine mileage',
                value: mileage(summary.mileageKmpl),
                icon: Gauge,
                tone: 'violet',
                hint: 'Total valid distance ÷ matching fuel',
              },
              {
                label: 'Priced consumption',
                value: money(summary.estimatedCost),
                icon: IndianRupee,
                tone: 'orange',
                hint: `${summary.costedIntervals} / ${summary.intervalCount} intervals priced`,
              },
            ]
          : null
      }
      notice={
        <>
          <MethodNote>
            Each interval starts after one diesel slip and ends before the next. Engine consumption
            requires complete, non-overlapping coverage. Hourly boundaries are time-apportioned;
            zero-fuel movement up to 0.2 km per engine window and 0.5 km per truck-day does not
            break consumption or tank continuity. Larger discrepancies still need checking. vendor
            daily totals are accepted only when the whole vendor day lies inside the interval.
            Distance uses slip odometers, or complete engine-window distance when odometers are
            missing. The latest valid earlier slip price values consumption; a closing slip never
            reprices the preceding interval. Driver filters retain whole intervals involving that
            driver; shared intervals are labelled. Stock starts at confirmed full capacity, then
            adds slips and subtracts engine use. Gaps, missing fill quantities and impossible
            balances stop the estimate until the next confirmed full fill. Full fills reset stock
            and show any reconciliation difference. Stock calculated from engine use cannot
            independently verify engine mileage or prove theft.
          </MethodNote>
          <p className="cr-quality-notice" role="status">
            <span className="cr-quality-dot" />
            {available && summary.capacityMissing > 0
              ? `${summary.capacityMissing} trucks need fuel-tank capacity. `
              : ''}
            Tank capacity is optional for consumption and mileage; required for tank balance.
            Missing engine coverage stays unknown.
          </p>
          {data?.meta?.truncated && (
            <p className="cr-caution cr-truncation" role="status">
              Partial history: narrow the period or truck selection for complete totals and stock
              evidence.
            </p>
          )}
          {data?.meta?.identityConflicts > 0 && (
            <p className="cr-caution">
              {data.meta.identityConflicts} ambiguous engine records excluded.
            </p>
          )}
        </>
      }
      footer={
        <ReportFooter
          summary={`${rows.length} slip intervals`}
          page={page}
          totalPages={Math.ceil(rows.length / PAGE_SIZE)}
          onPage={setPage}
        />
      }
    >
      <div className="cr-table-heading">
        <div>
          <h3>Slip-to-slip consumption</h3>
          <p>Closing purchases and estimated tank balance are shown separately.</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        rowKey={(r) => r.id}
        loading={loading && !report.dateError}
        error={error}
        onRetry={refetch}
        onRowClick={toggle}
        expandedKeys={new Set(expanded ? [expanded] : [])}
        renderExpanded={(r) => <SlipEvidence row={r} />}
        emptyTitle={
          report.dateError
            ? 'Complete the reporting period'
            : 'No diesel slip interval closed in this period'
        }
        emptyHint="Choose a period containing a closing diesel slip. Its preceding slip may be before the reporting period. Purchases remain available in the Purchases view."
      />
    </ReportFrame>
  );
}
