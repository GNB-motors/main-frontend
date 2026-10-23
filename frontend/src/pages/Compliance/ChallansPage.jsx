import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCw, Search, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import ExportButton from '@/components/ui/ExportButton';
import EnterprisePagination from '@/components/ui/EnterprisePagination';
import { Button } from '@/components/ui/button';
import { formatINR, formatNum } from '@/utils/formatters';
import {
  fetchChallans,
  fetchChallanSummary,
  fetchChallansPerVehicle,
  deleteChallan,
  syncChallansNow,
  oldestOpenAgeDays,
} from '../../services/challanService';
import { TONE_TEXT, statusMeta } from './challanStatus';
import ChallanStatusBadge from './ChallanStatusBadge';
import ChallanFormDialog from './ChallanFormDialog';
import KpiTile from './KpiTile';
import Skel from '../DefLedger/Skel';

/**
 * ChallansPage — the Compliance / Docs surface for traffic challans.
 *
 * Two views over one dataset:
 *   • By vehicle  (default) — one row per plate: open/paid counts, open
 *     amount, and the age of the oldest still-open challan. This is the
 *     view an owner actually works from: which truck is blocking me.
 *   • All challans — the flat list, with edit/delete on each row.
 *
 * The open-vs-paid tile is driven by /challans/summary so it counts the
 * WHOLE org, not just the current page or filter.
 *
 * Export reuses the app-wide ExportButton → lib/exportTable path (same
 * columns definition, same file shape) — no second CSV writer here.
 */

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'PAID', label: 'Paid' },
  { id: 'DISPUTED', label: 'Disputed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const VEHICLE_EXPORT_COLUMNS = [
  { key: 'vehicleNumber', label: 'Vehicle' },
  { key: 'total', label: 'Total Challans', type: 'number' },
  { key: 'open', label: 'Open', type: 'number' },
  { key: 'paid', label: 'Paid', type: 'number' },
  { key: 'openAmount', label: 'Open Amount (INR)', type: 'number' },
  { key: 'totalAmount', label: 'Total Amount (INR)', type: 'number' },
  { key: 'oldestOpenDays', label: 'Oldest Open (days)', type: 'number' },
];

const CHALLAN_EXPORT_COLUMNS = [
  { key: 'challanNo', label: 'Challan No' },
  { key: 'vehicleNumber', label: 'Vehicle' },
  { key: 'state', label: 'State' },
  { key: 'offenseDateLabel', label: 'Offense Date' },
  { key: 'offenseDescription', label: 'Offence' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'amount', label: 'Amount (INR)', type: 'number' },
  { key: 'paidAmount', label: 'Paid Amount (INR)', type: 'number' },
  { key: 'source', label: 'Source' },
  { key: 'notes', label: 'Notes' },
];

const PAGE_SIZE = 15;
const SKEL_ROWS = 8;

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/** Age column: how long the worst open challan on this vehicle has sat. */
function ageCell(dateValue) {
  const days = oldestOpenAgeDays(dateValue);
  if (days == null) return <span className="text-slate-400">—</span>;
  const tone =
    days > 180
      ? 'text-rose-600 dark:text-rose-400'
      : days > 90
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-700 dark:text-slate-300';
  return (
    <span className={`font-mono font-semibold ${tone}`}>
      {days} d{days >= 365 ? ' +' : ''}
    </span>
  );
}

export default function ChallansPage() {
  const [view, setView] = useState('vehicles'); // 'vehicles' | 'all'
  const [statusId, setStatusId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [vehicles, setVehicles] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [perVehicle, sum] = await Promise.all([
        fetchChallansPerVehicle(),
        fetchChallanSummary(),
      ]);
      setVehicles(perVehicle || []);
      setSummary(sum);

      const params = { page, limit: 200 };
      if (statusId !== 'all') params.status = statusId;
      const list = await fetchChallans(params);
      setRows(list?.rows || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load challans');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [page, statusId]);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.toLowerCase().trim();

  const filteredVehicles = useMemo(
    () =>
      vehicles
        .filter((v) => !q || (v.vehicleNumber || '').toLowerCase().includes(q))
        .map((v) => ({ ...v, oldestOpenDays: oldestOpenAgeDays(v.oldestOpenDate) })),
    [vehicles, q],
  );

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => !q || (r.vehicleNumber || '').toLowerCase().includes(q))
        .map((r) => ({
          ...r,
          statusLabel: statusMeta(r.status).label,
          offenseDateLabel: fmtDate(r.offenseDate),
        })),
    [rows, q],
  );

  const paginatedVehicles = useMemo(
    () => filteredVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredVehicles, page],
  );
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page],
  );

  const totalItems = view === 'vehicles' ? filteredVehicles.length : filteredRows.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  const open = summary?.OPEN || { count: 0, amount: 0 };
  const paid = summary?.PAID || { count: 0, amount: 0 };
  const firstLoad = loading && !summary;

  const onSync = async () => {
    if (syncing) return;
    setSyncing(true);
    // Pull the plates currently visible — the operator is looking at them,
    // so that is what they want refreshed.
    const plates = [...new Set(filteredVehicles.map((v) => v.vehicleNumber))].slice(0, 25);
    if (!plates.length) {
      toast.info('No vehicles to pull yet — add a challan or register a vehicle first.');
      setSyncing(false);
      return;
    }
    let written = 0;
    try {
      for (const plate of plates) {
        // Sequential on purpose: provider rate limits are per-key, and a
        // burst of parallel pulls is exactly how you get one throttled.
        const r = await syncChallansNow(plate);
        written += r?.rowsWritten || 0;
      }
      if (written > 0) {
        toast.success(
          `${written} challan row${written === 1 ? '' : 's'} updated from the provider`,
        );
      } else {
        toast.info('Provider returned nothing new for these vehicles.');
      }
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Provider pull failed');
    } finally {
      setSyncing(false);
    }
  };

  const onDelete = async (row) => {
    try {
      await deleteChallan(row._id);
      toast.success(`Challan ${row.challanNo} removed`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove the challan');
    }
  };

  const exportRows = view === 'vehicles' ? filteredVehicles : filteredRows;
  const exportColumns = view === 'vehicles' ? VEHICLE_EXPORT_COLUMNS : CHALLAN_EXPORT_COLUMNS;

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Challans
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Traffic challans across your fleet — what is still open, what it costs, and how long it
            has been sitting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            rows={exportRows}
            columns={exportColumns}
            filename={view === 'vehicles' ? 'challans-by-vehicle' : 'challans'}
            disabled={!exportRows.length}
          />
          <Button variant="outline" size="sm" onClick={onSync} disabled={syncing || refreshing}>
            <RefreshCw className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Pulling…' : 'Pull from provider'}
          </Button>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
            title="Refresh Challans"
            aria-label="Refresh challans"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add challan
          </Button>
        </div>
      </div>

      {/* ── KPI tiles: open vs paid ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile
          label="Open challans"
          loading={firstLoad}
          value={formatNum(open.count)}
          valueClass={TONE_TEXT.rose}
          note={`${formatINR(open.amount || 0)} outstanding`}
        />
        <KpiTile
          label="Paid challans"
          loading={firstLoad}
          value={formatNum(paid.count)}
          valueClass={TONE_TEXT.emerald}
          note={`${formatINR(paid.amount || 0)} settled`}
        />
        <KpiTile
          label="Vehicles affected"
          loading={firstLoad}
          value={formatNum(vehicles.filter((v) => v.open > 0).length)}
          valueClass="text-slate-900 dark:text-white"
          note={`of ${formatNum(vehicles.length)} with any challan`}
        />
        <KpiTile
          label="Oldest open"
          loading={firstLoad}
          value={<OldestOpenTile vehicles={filteredVehicles} />}
          valueClass="text-slate-900 dark:text-white"
          note="across the vehicles in view"
        />
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'vehicles', label: 'By vehicle' },
            { id: 'all', label: 'All challans' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setView(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                view === tab.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatusId(f.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusId === f.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {f.label}
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

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {view === 'vehicles' ? (
            <VehicleTable
              rows={paginatedVehicles}
              firstLoad={firstLoad}
              hasAny={vehicles.length > 0}
              onPick={(plate) => {
                setSearch(plate);
                setView('all');
                setPage(1);
              }}
            />
          ) : (
            <ChallanTable
              rows={paginatedRows}
              firstLoad={firstLoad}
              hasAny={rows.length > 0}
              onEdit={(row) => {
                setEditing(row);
                setFormOpen(true);
              }}
              onDelete={onDelete}
            />
          )}
        </div>

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <ChallanFormDialog
        open={formOpen}
        challan={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={load}
      />
    </div>
  );
}

/** Small helper so the "Oldest open" tile can render a JSX value. */
function OldestOpenTile({ vehicles }) {
  const worst = vehicles.reduce(
    (acc, v) => (v.oldestOpenDays != null && v.oldestOpenDays > acc ? v.oldestOpenDays : acc),
    0,
  );
  return worst > 0 ? `${worst} d` : '—';
}

function VehicleTable({ rows, firstLoad, hasAny, onPick }) {
  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
          <th className="py-3 px-4">Vehicle No</th>
          <th className="py-3 px-4 text-right">Total</th>
          <th className="py-3 px-4 text-right">Open</th>
          <th className="py-3 px-4 text-right">Paid</th>
          <th className="py-3 px-4 text-right">Open amount</th>
          <th className="py-3 px-4 text-center">Oldest open</th>
          <th className="py-3 px-4 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800" aria-busy={firstLoad}>
        {firstLoad ? (
          Array.from({ length: SKEL_ROWS }, (_, i) => (
            <tr key={i}>
              <td colSpan={7} className="py-3 px-4">
                <Skel className="h-4 w-full" />
              </td>
            </tr>
          ))
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="py-12 text-center text-slate-400">
              {hasAny
                ? 'No vehicles found matching current filter.'
                : 'No challans recorded yet. Add one manually, or point ECHALLAN_PROVIDER_BASE_URL at a provider to pull automatically.'}
            </td>
          </tr>
        ) : (
          rows.map((v) => (
            <tr
              key={v.vehicleNumber}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
            >
              <td className="py-3 px-4">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[12px]">
                  {v.vehicleNumber}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                {v.total}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                {v.open > 0 ? (
                  <span className={TONE_TEXT.rose}>{v.open}</span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                {v.paid}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                {formatINR(v.openAmount || 0)}
              </td>
              <td className="py-3 px-4 text-center">{ageCell(v.oldestOpenDate)}</td>
              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onPick(v.vehicleNumber)}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  View challans
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function ChallanTable({ rows, firstLoad, hasAny, onEdit, onDelete }) {
  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
          <th className="py-3 px-4">Challan No</th>
          <th className="py-3 px-4">Vehicle</th>
          <th className="py-3 px-4">Offence</th>
          <th className="py-3 px-4">Date</th>
          <th className="py-3 px-4 text-right">Amount</th>
          <th className="py-3 px-4 text-center">Status</th>
          <th className="py-3 px-4 text-center">Source</th>
          <th className="py-3 px-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800" aria-busy={firstLoad}>
        {firstLoad ? (
          Array.from({ length: SKEL_ROWS }, (_, i) => (
            <tr key={i}>
              <td colSpan={8} className="py-3 px-4">
                <Skel className="h-4 w-full" />
              </td>
            </tr>
          ))
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-12 text-center text-slate-400">
              {hasAny
                ? 'No challans found matching current filter.'
                : 'No challans recorded yet. Add one with “Add challan”.'}
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
              <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                {r.challanNo}
              </td>
              <td className="py-3 px-4">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[12px]">
                  {r.vehicleNumber}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                {r.offenseDescription || '—'}
              </td>
              <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                {fmtDate(r.offenseDate)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                {formatINR(r.amount || 0)}
              </td>
              <td className="py-3 px-4 text-center">
                <ChallanStatusBadge status={r.status} />
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {r.source === 'PROVIDER' ? 'Provider' : 'Manual'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    aria-label={`Edit challan ${r.challanNo}`}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    aria-label={`Delete challan ${r.challanNo}`}
                    className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
