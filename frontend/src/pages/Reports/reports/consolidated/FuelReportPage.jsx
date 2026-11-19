import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Fuel, Gauge, IndianRupee } from 'lucide-react';
import DataTable from '../../../../components/ui/DataTable';
import ExportButton from '../../../../components/ui/ExportButton';
import useApi from '../../../../hooks/useApi';
import { formatDateIST, formatDateTimeIST } from '../../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import ReportFrame, { ReportFooter } from '../ReportFrame';
import useReportPage from '../useReportPage';
import useConsolidatedReport from './useConsolidatedReport';
import { ConsolidatedReportService as Service } from './ConsolidatedReportService';
import { DetailButton, MethodNote, ReportScope } from './ConsolidatedReportParts';
import PurchaseSummary from './FuelMileageReport';
import SlipToSlipReport from './SlipToSlipReport';
import { priceReason } from './fuelPricingLabels';

const PAGE_SIZE = 15;
const km = (v) => (v == null ? '—' : formatKm(v));
const litres = (v) => (v == null ? '—' : formatLitres(v));
const money = (v) => (v == null ? '—' : formatINR(v, { decimals: 2 }));
const mileage = (v) => (v == null ? '—' : `${formatNum(v, { decimals: 2 })} km/L`);
const quality = (value) =>
  ({
    VALID: 'Full-to-full',
    MISSING_LITRES: 'Missing slip quantity',
    MISSING_ODOMETER: 'Missing odometer',
    ODOMETER_REVERSED: 'Check odometer',
    NO_DISTANCE: 'No distance recorded',
    CHECK_READINGS: 'Check readings',
    INVALID_TIME: 'Check fill times',
  })[value] || value;

function FuelViews({ view, billView, change }) {
  return (
    <div className="cr-fuel-navigation">
      <div className="cr-switch cr-fuel-primary" role="group" aria-label="Fuel report basis">
        <button
          type="button"
          aria-pressed={view === 'day'}
          onClick={() => change({ fuelView: 'day' })}
        >
          <CalendarDays size={14} /> Day-wise
        </button>
        <button
          type="button"
          aria-pressed={view === 'bill'}
          onClick={() => change({ fuelView: 'bill' })}
        >
          <Fuel size={14} /> Bill-to-bill
        </button>
      </div>
      {view === 'bill' && (
        <div className="cr-switch" role="group" aria-label="Bill report view">
          <button
            type="button"
            aria-pressed={billView === 'full'}
            onClick={() => change({ billView: 'full' })}
          >
            Full tank → Full tank
          </button>
          <button
            type="button"
            aria-pressed={billView === 'slips'}
            onClick={() => change({ billView: 'slips' })}
          >
            Slip → Slip
          </button>
          <button
            type="button"
            aria-pressed={billView === 'purchases'}
            onClick={() => change({ billView: 'purchases' })}
          >
            Purchases
          </button>
        </div>
      )}
    </div>
  );
}

function DailyEvidence({ row }) {
  return (
    <section className="cr-detail" aria-label={`Daily fuel evidence for ${row.vehicleNumber}`}>
      <div className="cr-detail-head">
        <div>
          <h3>
            {row.vehicleNumber} · {row.day}
          </h3>
          <p>
            {row.sources.join(' / ')} · {row.sourceIds.length} engine windows ·{' '}
            {formatNum(row.measuredMinutes / 60, { decimals: 1 })} hours of data.
          </p>
        </div>
      </div>
      <p className="cr-evidence-note">
        {row.apportioned
          ? 'Hours crossing midnight or a driver/rate change are split by elapsed time. Those allocations are estimates, not additional engine measurements.'
          : 'Consumption comes from the recorded engine windows. Missing hours are not treated as zero.'}
      </p>
      <p className="cr-evidence-note">
        Mileage uses{' '}
        {row.mileageDistanceKm == null
          ? '—'
          : `${formatNum(row.mileageDistanceKm, { decimals: 2 })} km`}{' '}
        and {litres(row.mileageFuelLitres)} from matching usable windows.
        {row.mileagePartial
          ? ` ${formatNum(row.mileageExcludedMinutes)} minutes excluded from mileage. Fuel cost is assessed separately from mileage coverage.`
          : ' Known priced fuel is retained even when another part of the day has no price.'}
      </p>
      {row.minorMovementWindows > 0 && (
        <p className="cr-evidence-note">
          {formatNum(row.minorMovementKm, { decimals: 2 })} km of minor movement with zero reported
          fuel. Within the 0.2 km per window / 0.5 km per truck-day allowance. These readings do not
          downgrade fuel cost or report eligibility; other checks still apply. These windows are
          excluded from mileage.
        </p>
      )}
      {row.qualityWarnings?.length > 0 && (
        <DataTable
          columns={[
            { key: 'from', label: 'Window start', render: (r) => formatDateTimeIST(r.from) },
            { key: 'to', label: 'Window end', render: (r) => formatDateTimeIST(r.to) },
            {
              key: 'distanceKm',
              label: 'Movement with zero reported fuel',
              render: (r) => `${formatNum(r.distanceKm, { decimals: 2 })} km`,
            },
            {
              key: 'reason',
              label: 'Assessment',
              render: (r) =>
                r.reason === 'MINOR_ZERO_FUEL_MOVEMENT'
                  ? 'Minor movement · report retained'
                  : 'Check engine reading',
            },
          ]}
          rows={row.qualityWarnings}
          rowKey={(r) => `${r.id}|${r.from}`}
        />
      )}
      <h3>Diesel valuation — same as Daily Digest</h3>
      <DataTable
        columns={[
          { key: 'at', label: 'Refuelling evidence', render: (r) => formatDateTimeIST(r.at) },
          { key: 'regionCode', label: 'Refuelling state' },
          { key: 'priceDate', label: 'Price date', render: (r) => formatDateIST(r.priceDate) },
          { key: 'rate', label: 'Price / L', render: (r) => money(r.rate) },
          {
            key: 'source',
            label: 'Price source / coverage',
            render: (r) =>
              r.inrPerL == null
                ? priceReason(r.reason)
                : r.stale
                  ? 'State history · earlier stored quote'
                  : 'State history · reporting day',
          },
        ]}
        rows={row.priceReferences}
        rowKey={(r) => r.id}
        emptyTitle={
          row.dailyPriceChange
            ? 'Price changed during a vendor daily total'
            : 'No usable refuelling-state price'
        }
        emptyHint="Refuelling location selects the state. Stored history supplies the reporting-day diesel rate."
      />
    </section>
  );
}

const DAILY_EXPORT = [
  { key: 'day', label: 'IST day' },
  { key: 'vehicleNumber', label: 'Truck' },
  { key: 'driverName', label: 'Driver assignment' },
  { key: 'fuelUsedLitres', label: 'Engine fuel used (L)', type: 'number' },
  { key: 'distanceKm', label: 'Matched window distance (km)', type: 'number' },
  { key: 'mileageKmpl', label: 'Measured-window mileage (km/L)', type: 'number' },
  { key: 'mileageDistanceKm', label: 'Distance included in mileage (km)', type: 'number' },
  { key: 'mileageFuelLitres', label: 'Fuel included in mileage (L)', type: 'number' },
  { key: 'mileagePartial', label: 'Mileage excludes unusable windows' },
  { key: 'knownCost', label: 'Known fuel cost subtotal (₹)', type: 'currency' },
  { key: 'costStatus', label: 'Cost coverage' },
  {
    key: 'estimatedCost',
    label: 'Digest state-history consumption cost estimate (₹)',
    type: 'currency',
  },
  { key: 'pricingRegions', label: 'Refuelling state(s)' },
  { key: 'priceDates', label: 'Stored price date(s)' },
  { key: 'stalePrice', label: 'Uses latest earlier stored quote' },
  { key: 'unpricedLitres', label: 'Fuel without a usable price (L)', type: 'number' },
  { key: 'measuredMinutes', label: 'Minutes covered', type: 'number' },
  { key: 'fullDay', label: 'Full day covered' },
  { key: 'apportioned', label: 'Time-apportioned boundary windows' },
  { key: 'inconsistentZero', label: 'Reported zero fuel with movement' },
  {
    key: 'minorMovementKm',
    label: 'Minor zero-fuel movement within allowance (km)',
    type: 'number',
  },
];

function DayReport({ navigation }) {
  const report = useConsolidatedReport('fuel');
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.dailyFuel(report.query, signal),
    [report.key],
    { enabled: !report.dateError, scopeKey: report.key },
  );
  const rows = data?.rows || [],
    summary = data?.summary,
    available = !error && !report.dateError && summary;
  const [page, setPage] = useReportPage(report.key);
  const [selected, setSelected] = useState(null),
    expanded = selected?.key === report.key ? selected.id : null;
  const toggle = (r) => setSelected({ key: report.key, id: expanded === r.id ? null : r.id });
  const columns = [
    { key: 'day', label: 'Day (IST)' },
    {
      key: 'vehicleNumber',
      label: 'Truck / driver',
      render: (r) => (
        <>
          <div className="cell-primary cr-name">{r.vehicleNumber}</div>
          <div className="cell-secondary">{r.driverName}</div>
        </>
      ),
    },
    { key: 'distanceKm', label: 'Measured km', align: 'right', render: (r) => km(r.distanceKm) },
    {
      key: 'fuelUsedLitres',
      label: 'Engine fuel used',
      align: 'right',
      render: (r) => (
        <>
          <div className="cell-primary">{litres(r.fuelUsedLitres)}</div>
          {r.inconsistentZero && (
            <div className="cr-caution">Includes zero-fuel movement windows</div>
          )}
          {r.minorMovementWindows > 0 && (
            <div className="cell-secondary">Minor movement · within allowance</div>
          )}
        </>
      ),
    },
    {
      key: 'mileageKmpl',
      label: 'Mileage',
      align: 'right',
      render: (r) => (
        <>
          <div>{mileage(r.mileageKmpl)}</div>
          {r.mileagePartial && <div className="cell-secondary">Usable windows only</div>}
        </>
      ),
    },
    {
      key: 'rateMin',
      label: 'Diesel valuation',
      render: (r) => (
        <>
          <div className="cell-primary">
            {r.rateMin == null
              ? 'No usable price'
              : r.rateMin === r.rateMax
                ? `${money(r.rateMin)} / L`
                : `${money(r.rateMin)}–${money(r.rateMax)} / L`}
          </div>
          <div className="cell-secondary">
            {r.priceDates.length
              ? `${r.pricingRegions || 'State history'} · ${formatDateIST(r.priceDates.at(-1))}${r.stalePrice ? ' · earlier quote' : ''}`
              : r.dailyPriceChange
                ? 'Changed within vendor day'
                : priceReason(r.priceReferences[0]?.reason)}
          </div>
        </>
      ),
    },
    {
      key: 'knownCost',
      label: 'Known fuel cost',
      align: 'right',
      render: (r) => (
        <>
          <div className="cell-primary">{money(r.knownCost)}</div>
          {r.costStatus === 'ZERO_REPORTED' && (
            <div className="cell-secondary">Zero fuel reported</div>
          )}
          {r.costStatus === 'PARTIAL' && <div className="cr-caution">Partial subtotal</div>}
          {r.estimatedCost == null && r.costStatus !== 'ZERO_REPORTED' && (
            <div className="cr-caution">
              {r.inconsistentZero
                ? 'Measurement needs checking'
                : `${litres(r.unpricedLitres)} not priced`}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'measuredMinutes',
      label: 'Coverage',
      render: (r) => (
        <>
          <span className={`cr-status ${r.fullDay ? 'cr-status--good' : ''}`}>
            {formatNum(r.measuredMinutes / 60, { decimals: 1 })} / 24 h
          </span>
          {r.apportioned && <div className="cell-secondary">Boundary allocation estimated</div>}
        </>
      ),
    },
    {
      key: 'details',
      label: '',
      render: (r) => (
        <DetailButton
          label={`${r.vehicleNumber} on ${r.day}`}
          expanded={expanded === r.id}
          onClick={() => toggle(r)}
        />
      ),
    },
  ];
  return (
    <ReportFrame
      variant="consolidated"
      title="Fuel & Mileage"
      subtitle="Daily engine consumption, valued with the same refuelling-state diesel prices as Daily Digest."
      navigation={navigation}
      filters={<ReportScope report={report} searchPlaceholder="Search truck, driver or day" />}
      actions={
        <ExportButton
          rows={rows}
          columns={DAILY_EXPORT}
          filename="fuel-day-wise"
          buttonClass="rpt-btn"
          disabled={!available || loading || !rows.length}
          meta={{
            filters: [
              { label: 'Period (IST)', value: `${report.range.from} → ${report.range.to}` },
              {
                label: 'Basis',
                value:
                  'Measured non-overlapping engine windows; Daily Digest last-refuelling state + reporting-day stored diesel price; boundary hours time-apportioned. Consumption cost is estimated, not purchase spend.',
              },
            ],
          }}
        />
      }
      kpis={
        available
          ? [
              {
                label: 'Engine fuel used',
                value: litres(summary.fuelUsedLitres),
                icon: Fuel,
                hint: `${summary.vehicleCount} distinct trucks · ${summary.vehicleDays} truck-days`,
              },
              {
                label: 'Measured distance',
                value: km(summary.distanceKm),
                icon: Gauge,
                tone: 'teal',
                hint: `${summary.distanceMissingDays} days have incomplete distance`,
              },
              {
                label: 'Matched-window mileage',
                value: mileage(summary.mileageKmpl),
                icon: Gauge,
                tone: 'violet',
                hint: `${summary.mileagePartialDays || 0} truck-days exclude unusable windows`,
              },
              {
                label: 'Known fuel cost',
                value: money(summary.knownCostSubtotal),
                icon: IndianRupee,
                tone: 'orange',
                hint: `${summary.positivelyPricedTrucks || 0} distinct trucks · ${summary.positivelyPricedDays || 0} truck-days with priced fuel`,
              },
            ]
          : null
      }
      notice={
        <>
          <MethodNote>
            Days use midnight-to-midnight IST. Only non-overlapping hourly engine windows or
            complete, IST-aligned vendor days are counted; rolling 24-hour snapshots are excluded.
            Missing hours remain missing. Mileage uses fuel and distance from matching measured
            windows, including partial days. Pricing reuses Daily Digest: the latest eligible
            refuelling evidence at consumption time selects the state; that state’s stored price for
            the reporting day values the fuel. Slips, detected fills and provider refuel alerts can
            establish that location. The shared 07:30 IST price-day rule applies; an older stored
            quote is flagged. Missing refuelling location or price history stays unknown. Split
            hourly windows are allocated by elapsed time. Vendor daily totals are not split into
            imaginary hours; an intraday refuelling-state change leaves their cost unknown. Actual
            purchase amounts remain bill-based. Known priced consumption is included as a subtotal
            even on a partly priced day. Zero-fuel movement up to 0.2 km per source window, with at
            most 0.5 km per truck-day, is shown as minor movement and does not downgrade fuel cost
            or interval eligibility. Those windows remain excluded from mileage. Larger or repeated
            movements above the allowance need checking; other usable windows are retained. Missing
            prices or measurements are not filled in. Zero-use rows are counted separately from
            trucks with positively priced consumption.
          </MethodNote>
          {available && (
            <p className="cr-quality-notice" role="status">
              <span className="cr-quality-dot" />
              <strong>Truck-day coverage:</strong> {summary.costedDays || 0} fully costed ·{' '}
              {summary.partialCostDays || 0} partial cost · {summary.unpricedDays || 0} unpriced ·{' '}
              {summary.zeroUseDays || 0} zero fuel reported. {summary.partialDays || 0} have partial
              engine coverage.
              {summary.stalePriceDays > 0 &&
                ` ${summary.stalePriceDays} days use an earlier stored price.`}
            </p>
          )}
          {available && data?.meta?.missingVehicleCount > 0 && (
            <p className="cr-caution" role="status">
              {data.meta.missingVehicleCount} of {data.meta.fleetVehicleCount} fleet trucks have no
              usable engine fuel records in this period.
              <span className="cell-secondary">
                {' '}
                {data.meta.missingVehicleNumbers?.join(', ')}.
              </span>
            </p>
          )}
          {data?.meta?.truncated && (
            <p className="cr-caution cr-truncation" role="status">
              Partial report: newest {data.meta.recordCap} vehicle-days or the engine-window limit
              reached. Narrow the period for complete totals and exports.
            </p>
          )}
          {data?.meta &&
            data.meta.excludedOverlaps + data.meta.excludedInvalid + data.meta.identityConflicts >
              0 && (
              <p className="cr-caution">
                {data.meta.excludedOverlaps +
                  data.meta.excludedInvalid +
                  data.meta.identityConflicts}{' '}
                overlapping, invalid or ambiguous records excluded.
              </p>
            )}
        </>
      }
      footer={
        <ReportFooter
          summary={`${rows.length} vehicle-days`}
          page={page}
          totalPages={Math.ceil(rows.length / PAGE_SIZE)}
          onPage={setPage}
        />
      }
    >
      <div className="cr-table-heading">
        <div>
          <h3>Daily engine consumption</h3>
          <p>Actual recorded windows; purchasing diesel is a separate activity.</p>
        </div>
        <span className="cr-table-context">IST · measured hours shown per day</span>
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
        renderExpanded={(row) => <DailyEvidence row={row} />}
        emptyTitle={
          report.dateError
            ? 'Complete the reporting period'
            : 'No engine fuel measurements in this period'
        }
        emptyHint="Try a different period or clear filters. Missing engine data does not mean zero fuel use."
      />
    </ReportFrame>
  );
}

const CYCLE_EXPORT = [
  { key: 'vehicleNumber', label: 'Truck' },
  { key: 'startDate', label: 'Opening full fill' },
  { key: 'endDate', label: 'Closing full fill' },
  { key: 'driverName', label: 'Opening driver' },
  { key: 'distanceKm', label: 'Odometer distance (km)', type: 'number' },
  { key: 'refillLitres', label: 'Partials + closing fill (L)', type: 'number' },
  { key: 'refillSpend', label: 'Refill purchase spend (₹)', type: 'currency' },
  { key: 'mileageKmpl', label: 'Valid full-to-full mileage (km/L)', type: 'number' },
  { key: 'quality', label: 'Quality' },
];
const OPEN_EXPORT = [
  { key: 'vehicleNumber', label: 'Truck' },
  { key: 'anchorAt', label: 'Last confirmed full fill' },
  { key: 'partialCount', label: 'Top-ups after anchor', type: 'number' },
  { key: 'refillLitres', label: 'Litres bought after anchor (not tank balance)', type: 'number' },
  { key: 'tankCapacityLitres', label: 'Fuel tank capacity (L)', type: 'number' },
  { key: 'status', label: 'Status' },
];

function CycleBills({ row }) {
  return (
    <section className="cr-detail" aria-label={`Bills in full-tank cycle for ${row.vehicleNumber}`}>
      <h3>What counts in this cycle</h3>
      <p className="cr-evidence-note">
        The opening full fill anchors the tank and odometer. Its litres and cost are excluded. Every
        later partial plus the closing full fill is included.
      </p>
      <DataTable
        columns={[
          { key: 'refuelTime', label: 'Fill time', render: (r) => formatDateTimeIST(r.refuelTime) },
          {
            key: 'fillingType',
            label: 'Fill',
            render: (r) =>
              r.isAnchor
                ? 'Opening full · anchor only'
                : r.fillingType === 'FULL_TANK'
                  ? 'Closing full'
                  : 'Partial top-up',
          },
          { key: 'litres', label: 'Litres', render: (r) => litres(r.litres) },
          { key: 'totalAmount', label: 'Amount', render: (r) => money(r.totalAmount) },
          { key: 'odometerReading', label: 'Odometer', render: (r) => km(r.odometerReading) },
          {
            key: 'included',
            label: 'Used for cycle',
            render: (r) => (r.isAnchor ? 'Excluded opening fill' : 'Included'),
          },
        ]}
        rows={[row.openingBill, ...row.bills]}
        rowKey={(r) => r.id}
      />
    </section>
  );
}

function FullTankReport({ navigation }) {
  const report = useConsolidatedReport('fuel');
  const { data, loading, error, refetch } = useApi(
    (signal) => Service.fullTankCycles(report.query, signal),
    [report.key],
    { enabled: !report.dateError, scopeKey: report.key },
  );
  const pending = report.params.get('tankView') === 'open',
    rows = (pending ? data?.open : data?.rows) || [],
    summary = data?.summary,
    available = !error && !report.dateError && summary;
  const [page, setPage] = useReportPage(report.key + '|' + pending),
    [selected, setSelected] = useState(null),
    expanded = selected?.key === report.key ? selected.id : null;
  const toggle = (r) => setSelected({ key: report.key, id: expanded === r.id ? null : r.id });
  const columns = pending
    ? [
        {
          key: 'vehicleNumber',
          label: 'Truck',
          render: (r) => <span className="cr-name">{r.vehicleNumber}</span>,
        },
        {
          key: 'anchorAt',
          label: 'Last confirmed full',
          render: (r) => (r.anchorAt ? formatDateIST(r.anchorAt) : 'No confirmed full fill'),
        },
        { key: 'partialCount', label: 'Top-ups after full', align: 'right' },
        {
          key: 'refillLitres',
          label: 'Bought after full',
          render: (r) => (r.anchorAt ? litres(r.refillLitres) : '—'),
        },
        {
          key: 'tankCapacityLitres',
          label: 'Tank capacity',
          render: (r) => litres(r.tankCapacityLitres),
        },
        {
          key: 'status',
          label: 'Next evidence needed',
          render: (r) => (r.anchorAt ? 'Next confirmed full fill' : 'First confirmed full fill'),
        },
      ]
    : [
        {
          key: 'vehicleNumber',
          label: 'Truck / opening driver',
          render: (r) => (
            <>
              <div className="cell-primary cr-name">{r.vehicleNumber}</div>
              <div className="cell-secondary">{r.driverName}</div>
            </>
          ),
        },
        {
          key: 'startDate',
          label: 'Full-to-full period',
          render: (r) => (
            <>
              <div>{formatDateIST(r.startDate)}</div>
              <div className="cell-secondary">→ {formatDateIST(r.endDate)}</div>
            </>
          ),
        },
        {
          key: 'distanceKm',
          label: 'Odometer km',
          align: 'right',
          render: (r) => km(r.distanceKm),
        },
        {
          key: 'refillLitres',
          label: 'Fuel replaced',
          align: 'right',
          render: (r) => (
            <>
              <div>{litres(r.refillLitres)}</div>
              <div className="cell-secondary">{r.partialCount} partials + closing full</div>
            </>
          ),
        },
        {
          key: 'refillSpend',
          label: 'Refill spend',
          align: 'right',
          render: (r) => money(r.refillSpend),
        },
        {
          key: 'mileageKmpl',
          label: 'Mileage',
          align: 'right',
          render: (r) => mileage(r.mileageKmpl),
        },
        {
          key: 'quality',
          label: 'Basis / quality',
          render: (r) => (
            <span className={`cr-status ${r.quality === 'VALID' ? 'cr-status--good' : ''}`}>
              {quality(r.quality)}
            </span>
          ),
        },
        {
          key: 'details',
          label: '',
          render: (r) => (
            <DetailButton
              label={`${r.vehicleNumber} full-tank cycle`}
              expanded={expanded === r.id}
              onClick={() => toggle(r)}
            />
          ),
        },
      ];
  return (
    <ReportFrame
      variant="consolidated"
      title="Fuel & Mileage"
      subtitle="Bill-based mileage between two confirmed full tanks. Opening fuel is excluded."
      navigation={navigation}
      filters={<ReportScope report={report} searchPlaceholder="Search truck, model or driver" />}
      actions={
        <ExportButton
          rows={rows}
          columns={pending ? OPEN_EXPORT : CYCLE_EXPORT}
          filename={pending ? 'full-tank-open' : 'full-tank-cycles'}
          buttonClass="rpt-btn"
          disabled={!available || loading || !rows.length}
          meta={{
            filters: [
              { label: 'Period', value: `${report.range.from} → ${report.range.to}` },
              {
                label: 'Basis',
                value:
                  'Only explicit FULL_TANK slips; partials + closing fill, excluding opening; cycles selected by closing date.',
              },
            ],
          }}
        />
      }
      kpis={
        available
          ? [
              {
                label: 'Completed full cycles',
                value: formatNum(summary.cycleCount),
                icon: CheckCircle2,
                hint: `${summary.eligibleCycles} usable · ${summary.excludedCycles} need checking`,
              },
              {
                label: 'Full-to-full mileage',
                value: mileage(summary.mileageKmpl),
                icon: Gauge,
                tone: 'teal',
                hint: `${km(summary.distanceKm)} / ${litres(summary.refillLitres)}`,
              },
              {
                label: 'Known refill spend',
                value: money(summary.knownRefillSpend),
                icon: IndianRupee,
                tone: 'violet',
                hint: `${summary.unpricedCycles} cycles have missing amounts`,
              },
              {
                label: 'Awaiting full evidence',
                value: formatNum(summary.awaitingFull + summary.needsFirstFull),
                icon: Fuel,
                tone: 'orange',
                hint: `${summary.needsFirstFull} need their first full fill`,
              },
            ]
          : null
      }
      notice={
        <>
          <MethodNote>
            A full-to-full cycle starts after an explicit full refill and closes after the next
            explicit full refill. Fuel replaced is every partial top-up plus the closing fill; the
            opening fill is excluded. Distance is the closing odometer minus the opening odometer.
            Tank capacity cancels out and is not needed. Missing quantities, reversed odometers and
            implausible readings remain visible but are excluded from mileage. Refill spend is money
            on the included bills, not an engine-consumption valuation. A register MAIN row alone is
            not treated as a confirmed full tank. Driver filtering uses the driver on the opening
            full fill.
          </MethodNote>
          <p className="cr-quality-notice">
            <span className="cr-quality-dot" />
            Partial slips alone do not prove fuel consumed or fuel remaining. Open tanks have no
            calculated mileage or stock balance.
          </p>
          {data?.meta?.truncated && (
            <p className="cr-caution cr-truncation" role="status">
              Partial history: narrow the period or vehicle scope for complete cycles.
            </p>
          )}
        </>
      }
      footer={
        <ReportFooter
          summary={`${rows.length} ${pending ? 'trucks' : 'cycles'}`}
          page={page}
          totalPages={Math.ceil(rows.length / PAGE_SIZE)}
          onPage={setPage}
        />
      }
    >
      <div className="cr-table-heading">
        <h3>{pending ? 'Trucks awaiting full-tank evidence' : 'Confirmed full-to-full cycles'}</h3>
        <div className="cr-switch" role="group" aria-label="Full-tank records">
          <button
            type="button"
            aria-pressed={!pending}
            onClick={() => report.patch({ tankView: null })}
          >
            Completed cycles
          </button>
          <button
            type="button"
            aria-pressed={pending}
            onClick={() => report.patch({ tankView: 'open' })}
          >
            Open tanks / missing anchors
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        rowKey={(r) => r.id}
        loading={loading && !report.dateError}
        error={error}
        onRetry={refetch}
        onRowClick={pending ? null : toggle}
        expandedKeys={new Set(expanded && !pending ? [expanded] : [])}
        renderExpanded={(r) => <CycleBills row={r} />}
        emptyTitle={
          report.dateError
            ? 'Complete the reporting period'
            : pending
              ? 'No trucks in this scope'
              : 'No confirmed full-to-full cycle closed in this period'
        }
        emptyHint="A partial refill or a MAIN register row is not automatically a full tank. Try a wider period or inspect open tanks."
      />
    </ReportFrame>
  );
}

export default function FuelReportPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('fuelView') === 'bill' ? 'bill' : 'day',
    billView = ['purchases', 'slips'].includes(params.get('billView'))
      ? params.get('billView')
      : 'full';
  const change = (values) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };
  const navigation = <FuelViews view={view} billView={billView} change={change} />;
  if (view === 'day') return <DayReport navigation={navigation} />;
  if (billView === 'slips') return <SlipToSlipReport navigation={navigation} />;
  return billView === 'purchases' ? (
    <PurchaseSummary navigation={navigation} />
  ) : (
    <FullTankReport navigation={navigation} />
  );
}
