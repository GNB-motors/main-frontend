import ManufacturerFilter from '../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../hooks/useManufacturerFilter';
import React, { useEffect, useMemo, useState } from 'react';
import { RotateCw, Search, Plus, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import ExportButton from '../../components/ui/ExportButton';
import PageShell from '../../components/ui/PageShell';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { formatLitres, formatNum, formatINR, formatPct } from '../../utils/formatters';
import { formatInIST } from '../../utils/dateUtils';
import { STATUS } from './defLedgerStatus';
import SearchableSelect from '../../components/SearchableDropdown/SearchableSelect';
import {
  signedLitres,
  defFreshness,
  FRESHNESS_LABEL,
  freshnessBucket,
  coverageRange,
} from './defLedgerFormat';
import DataFreshness from './DataFreshness';
import LedgerRowSkeleton from './LedgerRowSkeleton';
import StatusBadge from './StatusBadge';
import DosingBadge from './DosingBadge';
import DefDetailDrawer from './DefDetailDrawer';
import KpiTile from './KpiTile';

const CHIPS = [
  { id: 'all', label: 'All vehicles', match: () => true },
  { id: 'review', label: 'Needs review', match: (v) => v.status === 'FLAGGED' },
  { id: 'heldBack', label: 'Held back', match: (v) => v.alertsSuppressed === true },
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
  { id: 'notAssessed', label: 'Not assessed', match: (v) => v.status === 'NOT_ASSESSED' },
  { id: 'notApplicable', label: 'Not applicable', match: (v) => v.status === 'NOT_APPLICABLE' },
  { id: 'compliant', label: 'In band', match: (v) => v.status === 'COMPLIANT' },
  { id: 'notReported', label: 'DEF not reported', match: (v) => v.status === 'NOT_REPORTED' },
  { id: 'noData', label: 'No telemetry', match: (v) => v.status === 'NO_DATA' },
];

const FRESHNESS_FILTERS = [
  { id: 'all', label: 'All telemetry', match: () => true },
  { id: 'fresh', label: 'Fresh', match: (v) => freshnessBucket(v) === 'fresh' },
  { id: 'stale', label: 'Stale', match: (v) => freshnessBucket(v) === 'stale' },
  { id: 'none', label: 'No telemetry', match: (v) => freshnessBucket(v) === 'none' },
];

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
const sumKey = (list, key) => list.reduce((s, v) => s + (v[key] || 0), 0);

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'claimedAdblueL', label: 'Logged AdBlue (manual, L)', type: 'number' },
  { key: 'telemetryDefL', label: 'DEF burned (L)', type: 'number' },
  { key: 'sensorFillL', label: 'Sensor fills (L)', type: 'number' },
  { key: 'expectedBalanceL', label: 'Balance (L)', type: 'number' },
  { key: 'dosingRatioPct', label: 'DEF % of diesel', type: 'number' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'flagCount', label: 'Flags', type: 'number' },
  { key: 'alertState', label: 'Alert state' },
  { key: 'telemetryAsOf', label: 'Telemetry data as of (IST)' },
  { key: 'freshnessLabel', label: 'Data freshness' },
  { key: 'calculatedAt', label: 'Calculated on (IST)' },
];

const SKEL_ROWS = 8;

export default function DefLedgerPage() {
  const navigate = useNavigate();
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  useEffect(() => {
    setSelectedVehicle(null);
    setPage(1);
  }, [manufacturer]);
  const [search, setSearch] = useState('');
  const [chipId, setChipId] = useState('all');
  const [freshId, setFreshId] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, loading, refetch } = useApi(
    (signal) => FleetDataService.getDefLedger(signal, manufacturer ? { manufacturer } : {}),
    [manufacturer],
    { scopeKey: manufacturer },
  );
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
        alertState: v.alertsSuppressed ? 'Held back' : 'Not held back',
        telemetryAsOf: formatInIST(defFreshness(v).asOf, 'D MMM YYYY, h:mm a'),
        freshnessLabel: FRESHNESS_LABEL[defFreshness(v).status],
        calculatedAt: formatInIST(v.lastComputedAt, 'D MMM YYYY, h:mm a'),
      })),
    [data],
  );
  const staleCount = vehicles.filter((v) => freshnessBucket(v) === 'stale').length;

  // Headline DEF-burn and dosing are computed over FRESH telemetry only, so a
  // truck whose feed went silent weeks ago no longer skews the fleet number.
  // The window banner and the "Stale" filter make the excluded trucks findable.
  const freshVehicles = useMemo(
    () => vehicles.filter((v) => freshnessBucket(v) === 'fresh'),
    [vehicles],
  );
  const freshDefBurnedL = round1(sumKey(freshVehicles, 'telemetryDefL'));
  const freshDosed = freshVehicles.filter((v) => v.dosingRatioPct != null);
  const freshDosedFuelL = sumKey(freshDosed, 'fuelUsedL');
  const freshDosingPct =
    freshDosedFuelL > 0
      ? Math.round((sumKey(freshDosed, 'telemetryDefL') / freshDosedFuelL) * 1000) / 10
      : null;
  const coverageWindow = useMemo(() => coverageRange(vehicles), [vehicles]);

  const currentSelectedVehicle = selectedVehicle
    ? vehicles.find((v) => v.registrationNumber === selectedVehicle.registrationNumber) || null
    : null;

  const chips = CHIPS.filter((c) => !c.needsClaims || claimsTracked).map((c) => ({
    ...c,
    count: vehicles.filter(c.match).length,
  }));
  const activeChip = chips.find((c) => c.id === chipId) || chips[0];

  const freshnessFilters = FRESHNESS_FILTERS.map((f) => ({
    ...f,
    count: vehicles.filter(f.match).length,
  }));
  const activeFresh = freshnessFilters.find((f) => f.id === freshId) || freshnessFilters[0];

  const filteredVehicles = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vehicles.filter(
      (v) =>
        activeChip.match(v) &&
        activeFresh.match(v) &&
        (!q || (v.registrationNumber || '').toLowerCase().includes(q)),
    );
  }, [vehicles, search, activeChip, activeFresh]);

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, page, pageSize]);

  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;

  return (
    <>
      <PageShell
        title="DEF & AdBlue"
        subtitle="Your registered vehicles: DEF burned against diesel, AdBlue logged against AdBlue the tank sensor saw going in, and drains the engine burn cannot explain."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/def-ledger/log')}
              className="pshell-btn pshell-btn--primary"
              title="Log an AdBlue purchase (upload the bill)"
            >
              <Plus size={16} />
              Log AdBlue
            </button>
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
          </>
        }
        filters={
          <div className="manufacturer-scope-row">
            <ManufacturerFilter
              value={manufacturer}
              onChange={(value) => {
                setSelectedVehicle(null);
                setPage(1);
                setManufacturer(value);
              }}
            />
          </div>
        }
      >
        {/* ── KPI Tiles ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Registered vehicles"
            loading={firstLoad}
            value={formatNum(totals.vehicles)}
            valueClass="text-slate-900 dark:text-white"
            note={`${formatNum(totals.withData)} with telemetry${staleCount > 0 ? ` · ${staleCount} stale` : ''}`}
          />
          <KpiTile
            label="AdBlue logged (manual)"
            loading={firstLoad}
            value={claimsTracked ? formatLitres(totals.claimedAdblueL) : '—'}
            valueClass={
              claimsTracked
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-slate-500'
            }
            note={
              claimsTracked && price
                ? `~${formatINR(Math.round((totals.claimedAdblueL || 0) * price))} at ₹${price}/L · sensors saw ${formatLitres(totals.sensorFillL)}`
                : `No AdBlue bills logged · sensors saw ${formatLitres(totals.sensorFillL)} go in`
            }
          />
          <KpiTile
            label="DEF burned (fresh telemetry)"
            loading={firstLoad}
            value={formatLitres(freshDefBurnedL)}
            valueClass="text-emerald-600 dark:text-emerald-400"
            note={
              freshVehicles.length === 0
                ? staleCount > 0
                  ? `No fresh telemetry · ${staleCount} stale truck${staleCount === 1 ? '' : 's'} excluded`
                  : 'Fleet dosing —'
                : `Fleet dosing ${freshDosingPct != null ? formatPct(freshDosingPct, { decimals: 1 }) : '—'} of diesel${data?.defBand ? ` (normal ${data.defBand.min}–${data.defBand.max}%)` : ''}${staleCount > 0 ? ` · ${staleCount} stale excluded` : ''}`
            }
            noteClass="text-emerald-600 dark:text-emerald-400 font-semibold"
          />
          <KpiTile
            label="Needs review"
            loading={firstLoad}
            value={formatNum(totals.flagged ?? 0)}
            unit="vehicles"
            valueClass="text-slate-900 dark:text-white"
            note="Drains beyond engine burn or impossible fills"
            noteDot
          />
        </div>

        {!firstLoad && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xs flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Telemetry window
              </span>
              {coverageWindow.from && coverageWindow.to ? (
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {formatInIST(coverageWindow.from, 'D MMM YYYY')} –{' '}
                  {formatInIST(coverageWindow.to, 'D MMM YYYY')}
                </span>
              ) : (
                <span className="text-slate-500">No telemetry yet</span>
              )}
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                each truck covers its own span
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {data?.freshness?.staleAfterHours != null &&
                `Telemetry older than ${data.freshness.staleAfterHours}h is marked stale. `}
              {staleCount > 0
                ? `${staleCount} ${staleCount === 1 ? 'truck is' : 'trucks are'} stale and left out of the DEF-burned total — use the Stale filter to see them. `
                : 'All trucks with telemetry are fresh. '}
              Balances need each truck’s own AdBlue logs; missing logs are not zero purchases.
            </p>
          </div>
        )}

        {/* ── Filters Bar ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <label
                htmlFor="def-status-filter"
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>
              <SearchableSelect
                id="def-status-filter"
                value={chipId}
                onValueChange={(v) => {
                  setChipId(v);
                  setPage(1);
                }}
                className="h-9 min-w-[200px] text-sm"
              >
                {chips.map((chip) => (
                  <option key={chip.id} value={chip.id}>
                    {`${chip.label} (${chip.count})`}
                  </option>
                ))}
              </SearchableSelect>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="def-freshness-filter"
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Freshness
              </label>
              <SearchableSelect
                id="def-freshness-filter"
                value={freshId}
                onValueChange={(v) => {
                  setFreshId(v);
                  setPage(1);
                }}
                className="h-9 min-w-[180px] text-sm"
              >
                {freshnessFilters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {`${f.label} (${f.count})`}
                  </option>
                ))}
              </SearchableSelect>
            </div>
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

        {/* ── Legend: what each column means ──────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            <strong className="text-indigo-600 dark:text-indigo-400">Logged</strong> = AdBlue bills
            you enter (manual)
          </span>
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400">DEF Burned</strong> &{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">Sensor Fills</strong> = truck
            telemetry (automatic)
          </span>
          <span>
            <strong>Balance</strong> = Logged − DEF Burned
          </span>
          <span>
            <BadgeCheck className="inline w-3 h-3 text-emerald-600" /> <strong>Verified</strong> =
            bill logged and nothing off
          </span>
        </div>

        {/* ── Main Data Table ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4">Data freshness</th>
                  <th className="py-3 px-4 text-right">AdBlue Logged (manual)</th>
                  <th className="py-3 px-4 text-right">DEF Burned</th>
                  <th className="py-3 px-4 text-right">Sensor Fills</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">DEF % of Diesel</th>
                  <th className="py-3 px-4 text-center">Status</th>
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
                      <td className="py-3 px-4">
                        <DataFreshness vehicle={v} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {v.claimsTracked ? (
                          <div className="flex flex-col items-end gap-1">
                            <span>{formatLitres(v.claimedAdblueL)}</span>
                            {v.flagCount === 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                <BadgeCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
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
                          v.claimsTracked && v.expectedBalanceL != null && v.expectedBalanceL < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {v.claimsTracked ? signedLitres(v.expectedBalanceL) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <DosingBadge vehicle={v} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          aria-label={`Log AdBlue for ${v.registrationNumber}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/def-ledger/log?vehicleId=${v.vehicleId}`);
                          }}
                          className="pshell-btn pshell-btn--primary"
                          style={{ height: 32, minHeight: 32, padding: '0 14px', fontSize: 12.5 }}
                        >
                          <Plus size={14} /> Log
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
      </PageShell>

      <DefDetailDrawer vehicle={currentSelectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </>
  );
}
