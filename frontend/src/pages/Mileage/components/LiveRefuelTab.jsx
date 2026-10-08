import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, ArrowUpDown, RotateCw } from 'lucide-react';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import apiClient from '../../../utils/axiosConfig';
import { toISTDateString, toISTTimeString } from '../../../utils/dateUtils';
import { formatINR, formatLitres } from '../../../utils/formatters';
import {
  CORRECTION_META,
  DATE_PRESETS,
  DEFAULT_PRESET,
  GLITCH_STATUS,
  ODOMETER_SOURCE_META,
  STATUS_FILTERS,
  VERIFICATION_META,
  calibrationHint,
  drawerFromLiveRow,
  mapUnifiedRow,
  presetRange,
  rangeToParams,
} from '../mileageRows';

const pillClass = (active) =>
  `px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
    active
      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  }`;

const coordsText = (c) => `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`;

/**
 * Where the fill happened. Inside a saved place it links to that place in
 * Place Hub, named if someone named it; an unnamed place still links, so it
 * can be named there.
 */
function LocationCell({ row }) {
  const { place } = row;
  if (place) {
    const label = place.name || row.location || 'Unnamed place';
    const hint = !place.name ? (row.location ? 'Unnamed place' : null) : null;
    return (
      <Link
        to={`/place-hub?place=${encodeURIComponent(place.hubId)}`}
        className="group flex items-start gap-1.5 max-w-[220px]"
        title={
          row.billLocation && row.billLocation !== label
            ? `Bill: ${row.billLocation} · Open in Place Hub`
            : 'Open in Place Hub'
        }
      >
        <MapPin className="w-3.5 h-3.5 mt-0.5 text-indigo-500 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
            {label}
          </span>
          {(hint || (!place.name && !row.location && row.coords)) && (
            <span className="block text-[11px] text-slate-400">
              {hint || coordsText(row.coords)}
            </span>
          )}
        </span>
      </Link>
    );
  }
  if (!row.location && !row.coords) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-1.5 max-w-[220px]" title={row.location || undefined}>
      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
        {row.location || coordsText(row.coords)}
      </span>
    </div>
  );
}

/**
 * Sensor litres as the hand-off says: the corrected figure ± the truck's band,
 * "Gauge rose X L" when the raw rise differs, and the correction badge. A
 * glitch shows only the struck-through raw rise.
 */
function SensorLitresCell({ row }) {
  if (row.status === 'SENSOR_GLITCH') {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="line-through text-slate-400">{formatLitres(row.rawLitres)}</span>
        <span className="text-[11px] text-slate-500">Not a refuel</span>
      </div>
    );
  }
  if (row.sensorLitres == null) return '—';
  const correction = CORRECTION_META[row.correction];
  const showRaw = row.rawLitres != null && row.rawLitres !== row.sensorLitres;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span>
        {formatLitres(row.sensorLitres)}
        {row.bandL != null && (
          <span className="ml-1 text-[11px] text-slate-400">± {row.bandL.toFixed(1)} L</span>
        )}
      </span>
      {showRaw && (
        <span className="text-[11px] text-slate-400">Gauge rose {formatLitres(row.rawLitres)}</span>
      )}
      {correction && (
        <span
          className={`mileage-badge mileage-badge-${correction.tone} !px-1.5 !py-0.5 !text-[10px]`}
          title={calibrationHint(row.gainBills)}
        >
          {correction.label}
        </span>
      )}
    </div>
  );
}

export default function LiveRefuelTab({
  searchQuery = '',
  onOpenDrawer,
  fuelType = null,
  refreshKey = 0,
}) {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'earliest'
  const [statusFilter, setStatusFilter] = useState('all');
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PRESET));

  // A new search is a new result set: back to page 1 in the same render, so the
  // stale page number never reaches the request.
  const [searchedFor, setSearchedFor] = useState(searchQuery);
  if (searchedFor !== searchQuery) {
    setSearchedFor(searchQuery);
    setPage(1);
  }

  useEffect(() => {
    let isMounted = true;
    const fetchRefuels = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/fuel-logs/unified', {
          params: {
            page,
            limit: pageSize,
            ...rangeToParams(range),
            search: searchQuery || undefined,
            fuelType: fuelType || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            // desc is the API default; only the non-default goes on the wire.
            sort: sortOrder === 'earliest' ? 'asc' : undefined,
          },
        });
        if (!isMounted) return;
        setLogs((res.data?.data || []).map(mapUnifiedRow));
        setMeta(res.data?.meta || null);
      } catch {
        if (!isMounted) return;
        setLogs([]);
        setMeta(null);
        setLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRefuels();
    return () => {
      isMounted = false;
    };
  }, [
    page,
    pageSize,
    searchQuery,
    fuelType,
    statusFilter,
    sortOrder,
    range,
    reloadKey,
    refreshKey,
  ]);

  const choosePreset = (key) => {
    setPreset(key);
    setRange(presetRange(key));
    setPage(1);
  };

  const changeRange = (patch) => {
    const next = { ...range, ...patch };
    if (!next.from || !next.to) return;
    setPreset('CUSTOM');
    setRange(next);
    setPage(1);
  };

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages || 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Filters: date range, status, order */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => choosePreset(p.key)}
                className={pillClass(preset === p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              aria-label="From date"
              value={range.from}
              max={range.to}
              onChange={(e) => changeRange({ from: e.target.value })}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
            <span>→</span>
            <input
              type="date"
              aria-label="To date"
              value={range.to}
              min={range.from}
              onChange={(e) => changeRange({ to: e.target.value })}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSortOrder(sortOrder === 'latest' ? 'earliest' : 'latest');
            setPage(1);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>{sortOrder === 'latest' ? 'Newest first' : 'Oldest first'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const count = f.countKey
            ? meta?.[f.countKey]
            : meta
              ? (meta.verified || 0) +
                (meta.flagged || 0) +
                (meta.unverified || 0) +
                (meta.slipOnly || 0)
              : null;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                setPage(1);
              }}
              className={pillClass(statusFilter === f.key)}
            >
              {f.label}
              {count != null && <span className="ml-1.5 font-mono text-slate-400">{count}</span>}
            </button>
          );
        })}
        {/* Glitches are never in the main list or its totals — only here. */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(GLITCH_STATUS);
            setPage(1);
          }}
          className={pillClass(statusFilter === GLITCH_STATUS)}
          title="Gauge dipped and came back — not refuels"
        >
          Gauge glitches
          {meta?.sensorGlitch != null && (
            <span className="ml-1.5 font-mono text-slate-400">{meta.sensorGlitch}</span>
          )}
        </button>
      </div>

      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Vehicle No</th>
              <th className="py-3 px-4">Refuel Time (IST)</th>
              <th className="py-3 px-4 text-right">Bill Litres</th>
              <th className="py-3 px-4 text-right">Sensor (corrected)</th>
              <th className="py-3 px-4 text-center">Verification Status</th>
              <th className="py-3 px-4">Location (Pump / Station)</th>
              <th className="py-3 px-4 text-right">Rate (₹/L)</th>
              <th className="py-3 px-4 text-right">Total ₹</th>
              <th className="py-3 px-4 text-center">Odometer</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 font-mono">
                  Loading refuels...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load refuels.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No refuels in this range.
                </td>
              </tr>
            ) : (
              logs.map((row) => {
                const status = VERIFICATION_META[row.status];
                const odo = row.odometerSource ? ODOMETER_SOURCE_META[row.odometerSource] : null;
                const isTelematicsOdo = row.odometerSource === 'FLEETEDGE';
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="mileage-plate">{row.vehicleNo || '—'}</span>
                        <span className="text-[11px] text-slate-400">{row.model || '—'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {row.at ? (
                        <>
                          <div>{toISTDateString(row.at)}</div>
                          <div className="text-[11px] text-slate-400">
                            {toISTTimeString(row.at)}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatLitres(row.slipLitres)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      <SensorLitresCell row={row} />
                    </td>

                    <td className="py-3 px-4 text-center">
                      {status ? (
                        <span
                          className={`mileage-badge mileage-badge-${status.tone}`}
                          title={status.hint}
                        >
                          {status.label}
                        </span>
                      ) : (
                        '—'
                      )}
                      {row.billVarianceL != null && (
                        <div className="mt-1 text-[10px] font-mono text-slate-400">
                          {row.billVarianceL > 0 ? '+' : ''}
                          {row.billVarianceL.toFixed(1)} L
                          {row.billToleranceL != null &&
                            ` · allowed ±${row.billToleranceL.toFixed(1)} L`}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <LocationCell row={row} />
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {row.rate.value != null ? (
                        <span
                          title={
                            row.rate.provenance === 'CALCULATED' ? 'Amount ÷ litres' : 'From bill'
                          }
                        >
                          ₹{row.rate.value.toFixed(2)}
                          {row.rate.provenance === 'CALCULATED' && (
                            <span className="text-[10px] text-slate-400 block">(Calc)</span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatINR(row.totalAmount)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {row.odometer != null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isTelematicsOdo
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                          title={odo?.hint}
                        >
                          {Number(row.odometer).toLocaleString('en-IN')}
                          {odo?.suffix ? ` (${odo.suffix})` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        aria-label="View refuel detail"
                        title="View refuel detail"
                        onClick={() => onOpenDrawer?.(drawerFromLiveRow(row))}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
