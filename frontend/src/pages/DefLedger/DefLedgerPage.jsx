import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  TrendingDown,
  TrendingUp,
  Info,
  Droplet,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import SlideOver from '../../components/cluster/SlideOver';
import ExportButton from '../../components/ui/ExportButton';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { formatLitres, formatNum, formatINR, formatPct } from '../../utils/formatters';
import { formatDateTimeIST, formatDateIST } from '../../utils/dateUtils';

const TONE = {
  ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  bad: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// Mirrors defLedger.service statusOf(), most urgent first.
const STATUS = {
  FLAGGED: { label: 'Needs review', tone: 'bad', Icon: AlertTriangle },
  DEFICIT: { label: 'Unlogged burn', tone: 'warn', Icon: AlertTriangle },
  LOW_DOSING: { label: 'Low dosing', tone: 'warn', Icon: TrendingDown },
  HIGH_DOSING: { label: 'High dosing', tone: 'warn', Icon: TrendingUp },
  COMPLIANT: { label: 'In band', tone: 'ok', Icon: CheckCircle2 },
  NOT_REPORTED: { label: 'DEF not reported', tone: 'muted', Icon: Info },
  NO_DATA: { label: 'No telemetry', tone: 'muted', Icon: Info },
};

const STATUS_NOTE = {
  FLAGGED:
    'The CAN DEF level dropped by more than the engine burned, or a logged fill is larger than the tank. Check the tank, cap and lines, and the logged fills.',
  DEFICIT:
    'The truck burned more DEF than the AdBlue logged for it. Either fills are not being logged or a logged fill is wrong.',
  LOW_DOSING:
    'DEF is running below the normal share of diesel. Low dosing on a BS-VI truck can mean a faulty or bypassed SCR system.',
  HIGH_DOSING:
    'DEF is running above the normal share of diesel. Check for a leak or a faulty dosing unit.',
  COMPLIANT: 'DEF dosing is within the normal share of diesel burned.',
  NOT_REPORTED:
    "This truck's telematics sends 0 DEF on every hour despite real diesel burn, so dosing cannot be judged from it.",
  NO_DATA: 'No hourly FleetEdge telemetry has arrived for this vehicle yet.',
};

const CHIPS = [
  { id: 'all', label: 'All vehicles', match: () => true },
  { id: 'review', label: 'Needs review', match: (v) => v.status === 'FLAGGED' },
  {
    id: 'deficit',
    label: 'Unlogged burn',
    match: (v) => v.status === 'DEFICIT',
    needsClaims: true,
  },
  {
    id: 'dosing',
    label: 'Dosing out of band',
    match: (v) => v.status === 'LOW_DOSING' || v.status === 'HIGH_DOSING',
  },
  { id: 'compliant', label: 'In band', match: (v) => v.status === 'COMPLIANT' },
  { id: 'notReported', label: 'DEF not reported', match: (v) => v.status === 'NOT_REPORTED' },
  { id: 'noData', label: 'No telemetry', match: (v) => v.status === 'NO_DATA' },
];

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'claimedAdblueL', label: 'Logged AdBlue (L)', type: 'number' },
  { key: 'telemetryDefL', label: 'DEF burned (L)', type: 'number' },
  { key: 'sensorFillL', label: 'Sensor fills (L)', type: 'number' },
  { key: 'expectedBalanceL', label: 'Balance (L)', type: 'number' },
  { key: 'dosingRatioPct', label: 'DEF % of diesel', type: 'number' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'flagCount', label: 'Flags', type: 'number' },
];

const Skel = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-block align-middle rounded bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`}
  />
);

const SKEL_ROWS = 8;

// Same cells and alignment as a real row, so the table doesn't jump when data lands.
function LedgerRowSkeleton() {
  return (
    <tr aria-hidden="true">
      <td className="py-3 px-4">
        <Skel className="h-5 w-24" />
      </td>
      {['w-14', 'w-14', 'w-14', 'w-12'].map((width, i) => (
        <td key={i} className="py-3 px-4 text-right">
          <Skel className={`h-3.5 ${width}`} />
        </td>
      ))}
      <td className="py-3 px-4 text-center">
        <Skel className="h-5 w-12" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-5 w-28 rounded-full" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-3.5 w-10" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-6 w-24" />
      </td>
    </tr>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.NO_DATA;
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${TONE[meta.tone]}`}
    >
      <Icon className="w-3 h-3" />
      <span>{meta.label}</span>
    </span>
  );
}

function DosingBadge({ vehicle }) {
  if (vehicle.dosingRatioPct == null) {
    return <span className="text-slate-400 text-[11px]">—</span>;
  }
  const { min, max } = vehicle.defBand || {};
  const inBand = vehicle.dosingRatioPct >= min && vehicle.dosingRatioPct <= max;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${inBand ? TONE.ok : TONE.warn}`}
      title={`Normal band ${min}–${max}% of diesel`}
    >
      {formatPct(vehicle.dosingRatioPct, { decimals: 1 })}
    </span>
  );
}

const signedLitres = (v) =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${formatNum(v, { decimals: 1 })} L`;

function humanizeFlagType(type) {
  if (type === 'DEF_DRAIN_SENSOR') return 'Drain beyond burn';
  if (type === 'IMPOSSIBLE_CLAIM') return 'Impossible fill';
  if (type === 'NEGATIVE_BALANCE') return 'Unlogged burn';
  const s = String(type || 'Flag')
    .toLowerCase()
    .replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function DefDetailDrawer({ vehicle, claimsTracked, onClose }) {
  if (!vehicle) return null;
  const flags = vehicle.flags || [];
  const fills = vehicle.fills || [];
  const band = vehicle.defBand || {};
  const coverage =
    vehicle.coverageFrom && vehicle.coverageTo
      ? `${formatDateIST(vehicle.coverageFrom)} – ${formatDateIST(vehicle.coverageTo)}`
      : null;
  const cells = [
    {
      label: 'Logged AdBlue',
      value: claimsTracked ? formatLitres(vehicle.claimedAdblueL) : 'Not logged',
    },
    { label: 'DEF burned', value: formatLitres(vehicle.telemetryDefL) },
    { label: 'Sensor fills', value: formatLitres(vehicle.sensorFillL) },
    {
      label: 'Balance',
      value: claimsTracked ? signedLitres(vehicle.expectedBalanceL) : '—',
      bad: vehicle.expectedBalanceL != null && vehicle.expectedBalanceL < 0,
    },
  ];

  return (
    <SlideOver
      open={Boolean(vehicle)}
      onClose={onClose}
      title={`DEF & AdBlue — ${vehicle.registrationNumber}`}
      subtitle={coverage ? `Telemetry ${coverage}` : 'No telemetry yet'}
    >
      <div className="flex flex-col gap-5 p-1">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={vehicle.status} />
            {vehicle.dosingRatioPct != null && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                DEF {formatPct(vehicle.dosingRatioPct, { decimals: 1 })} of{' '}
                {formatLitres(vehicle.fuelUsedL, { decimals: 0 })} diesel · normal {band.min}–
                {band.max}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            {cells.map((c) => (
              <div
                key={c.label}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {c.label}
                </span>
                <span
                  className={`font-mono text-base font-bold ${
                    c.bad
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {STATUS_NOTE[vehicle.status] || STATUS_NOTE.NO_DATA}
            {!claimsTracked &&
              ' No AdBlue purchases are logged for this organization, so there is no balance to reconcile.'}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2.5">
            Review flags ({vehicle.flagCount ?? flags.length})
          </h4>
          {flags.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              Nothing to review.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {flags.map((f, i) => (
                <div
                  key={`${f.type}-${f.at}-${i}`}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {humanizeFlagType(f.type)}
                    </span>
                    {f.litres != null && (
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formatLitres(f.litres)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {f.message}
                  </p>
                  <span className="font-mono text-[10px] text-slate-400">
                    {formatDateTimeIST(f.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2.5">
            Fills seen by the DEF sensor ({vehicle.sensorFillCount ?? fills.length})
          </h4>
          {fills.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              No fills detected on the CAN DEF level.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {fills.map((f, i) => (
                <div
                  key={`${f.at}-${i}`}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Droplet className="w-3.5 h-3.5 text-sky-500" />
                    {formatDateTimeIST(f.at)}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    +{formatLitres(f.litres)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

function KpiTile({ label, loading, value, valueClass, note, noteClass = 'text-slate-400' }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      {loading ? (
        <>
          <Skel className="h-8 w-24" />
          <Skel className="h-3 w-32" />
        </>
      ) : (
        <>
          <span className={`text-2xl font-bold font-mono ${valueClass}`}>{value}</span>
          <span className={`text-[11px] ${noteClass}`}>{note}</span>
        </>
      )}
    </div>
  );
}

export default function DefLedgerPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [search, setSearch] = useState('');
  const [chipId, setChipId] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, loading, refetch } = useApi((signal) => FleetDataService.getDefLedger(signal), []);
  // Only the first load shows placeholders; a refresh keeps the numbers on screen.
  const firstLoad = loading && !data;

  const claimsTracked = Boolean(data?.claimsTracked);
  const totals = data?.totals || {};
  const price = data?.defPriceInrPerL;
  const vehicles = useMemo(
    () =>
      (data?.vehicles || []).map((v) => ({
        ...v,
        statusLabel: (STATUS[v.status] || STATUS.NO_DATA).label,
      })),
    [data],
  );

  const chips = CHIPS.filter((c) => !c.needsClaims || claimsTracked).map((c) => ({
    ...c,
    count: vehicles.filter(c.match).length,
  }));
  const activeChip = chips.find((c) => c.id === chipId) || chips[0];

  const filteredVehicles = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vehicles.filter(
      (v) => activeChip.match(v) && (!q || (v.registrationNumber || '').toLowerCase().includes(q)),
    );
  }, [vehicles, search, activeChip]);

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, page, pageSize]);

  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DEF & AdBlue Governance Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your registered vehicles: DEF burned against diesel, AdBlue logged against AdBlue the
            tank sensor saw going in, and drains the engine burn cannot explain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            rows={filteredVehicles}
            columns={EXPORT_COLUMNS}
            filename="def-ledger-audit"
            disabled={!filteredVehicles.length}
          />
          <button
            type="button"
            onClick={refetch}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
            title="Refresh Ledger"
            aria-label="Refresh ledger"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile
          label="Registered vehicles"
          loading={firstLoad}
          value={formatNum(totals.vehicles)}
          valueClass="text-slate-900 dark:text-white"
          note={`${formatNum(totals.withData)} with telemetry`}
        />
        <KpiTile
          label="AdBlue logged"
          loading={firstLoad}
          value={claimsTracked ? formatLitres(totals.claimedAdblueL) : 'Not logged'}
          valueClass={
            claimsTracked
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }
          note={
            claimsTracked && price
              ? `~${formatINR(Math.round((totals.claimedAdblueL || 0) * price))} at ₹${price}/L · sensors saw ${formatLitres(totals.sensorFillL)}`
              : `Sensors saw ${formatLitres(totals.sensorFillL)} go in`
          }
        />
        <KpiTile
          label="DEF burned"
          loading={firstLoad}
          value={formatLitres(totals.telemetryDefL)}
          valueClass="text-emerald-600 dark:text-emerald-400"
          note={
            totals.dosingRatioPct != null
              ? `Fleet dosing ${formatPct(totals.dosingRatioPct, { decimals: 1 })} of diesel (normal ${data?.defBand?.min}–${data?.defBand?.max}%)`
              : 'Fleet dosing —'
          }
          noteClass="text-emerald-600 dark:text-emerald-400 font-semibold"
        />
        <KpiTile
          label="Needs review"
          loading={firstLoad}
          value={`${formatNum(totals.flagged ?? 0)} Vehicles`}
          valueClass="text-rose-600 dark:text-rose-400"
          note="Drains beyond engine burn or impossible fills"
          noteClass="text-rose-500 font-semibold"
        />
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setChipId(chip.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChip.id === chip.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {chip.label} {firstLoad ? <Skel className="h-3 w-5" /> : `(${chip.count})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vehicle plate..."
            aria-label="Search vehicle plate"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Vehicle No</th>
                <th className="py-3 px-4 text-right">AdBlue Logged</th>
                <th className="py-3 px-4 text-right">DEF Burned</th>
                <th className="py-3 px-4 text-right">Sensor Fills</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">DEF % of Diesel</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Flags</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody
              className="divide-y divide-slate-100 dark:divide-slate-800"
              aria-busy={firstLoad}
            >
              {firstLoad ? (
                Array.from({ length: SKEL_ROWS }, (_, i) => <LedgerRowSkeleton key={i} />)
              ) : paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    {vehicles.length === 0
                      ? 'No vehicles are registered to your organization yet.'
                      : 'No vehicles found matching current filter.'}
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((v) => (
                  <tr
                    key={v.vehicleId || v.registrationNumber}
                    onClick={() => setSelectedVehicle(v)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[12px]">
                        {v.registrationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {claimsTracked ? (
                        formatLitres(v.claimedAdblueL)
                      ) : (
                        <span className="font-sans font-normal text-slate-400">Not logged</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatLitres(v.telemetryDefL)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatLitres(v.sensorFillL)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        v.expectedBalanceL != null && v.expectedBalanceL < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {signedLitres(v.expectedBalanceL)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <DosingBadge vehicle={v} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {v.flagCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]">
                          {v.flagCount} {v.flagCount === 1 ? 'flag' : 'flags'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Clear</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(v);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        Audit Drawer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredVehicles.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <DefDetailDrawer
        vehicle={selectedVehicle}
        claimsTracked={claimsTracked}
        onClose={() => setSelectedVehicle(null)}
      />
    </div>
  );
}
