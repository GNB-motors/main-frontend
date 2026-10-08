import React, { useEffect, useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { DATE_PRESETS, dailyRollup, presetRange, rangeToParams } from '../mileageRows';

const pillClass = (active) =>
  `px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
    active
      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  }`;

const signed = (v, unit) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`);

/**
 * GET /api/fuel-model/expected — expected vs actual engine fuel for one truck
 * (fuelModel flag, OWNER/MANAGER). Expected is null when the truck has no
 * model yet (source NONE); that shows as "—", never as zero.
 */
export default function ExpectedFuelView() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [preset, setPreset] = useState('7DAYS');
  const [range, setRange] = useState(() => presetRange('7DAYS'));
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/api/vehicles', { params: { page: 1, limit: 1000 } })
      .then((res) => {
        if (!isMounted) return;
        const list = (res.data?.data || [])
          .filter((v) => v._id && v.registrationNumber)
          .sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber));
        setVehicles(list);
      })
      .catch(() => {
        if (isMounted) setVehicles([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!vehicleId) return undefined;
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/fuel-model/expected', {
          params: { vehicleId, ...rangeToParams(range) },
        });
        if (isMounted) setResult(res.data || null);
      } catch {
        if (isMounted) {
          setResult(null);
          setLoadError(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [vehicleId, range, reloadKey]);

  const days = useMemo(() => dailyRollup(result?.windows || []), [result]);
  const summary = result?.summary;
  const selected = vehicles.find((v) => v._id === vehicleId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2">
          <select
            aria-label="Vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">Choose a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber}
                {v.model ? ` · ${v.model}` : ''}
              </option>
            ))}
          </select>
          {selected && <span className="text-xs text-slate-500">{selected.model || '—'}</span>}
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPreset(p.key);
                setRange(presetRange(p.key));
              }}
              className={pillClass(preset === p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="mileage-kpi-grid !mb-0">
          <div className="mileage-kpi-card">
            <div className="mileage-kpi-top">
              <span>Windows scored</span>
            </div>
            <div className="mileage-kpi-value">
              {formatNum(summary.scoredCount)} / {formatNum(summary.count)}
            </div>
            <div className="mileage-kpi-sub">
              <span>Hours with an expected figure</span>
            </div>
          </div>
          <div className="mileage-kpi-card">
            <div className="mileage-kpi-top">
              <span>Actual − expected</span>
            </div>
            <div className="mileage-kpi-value">{signed(summary.totalDeviationL, ' L')}</div>
            <div className="mileage-kpi-sub">
              <span>+ means the truck burned more than expected</span>
            </div>
          </div>
          <div className="mileage-kpi-card">
            <div className="mileage-kpi-top">
              <span>Average deviation</span>
            </div>
            <div className="mileage-kpi-value">{signed(summary.avgDeviationPct, '%')}</div>
            <div className="mileage-kpi-sub">
              <span>Mean over scored windows</span>
            </div>
          </div>
        </div>
      )}

      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Day (IST)</th>
              <th className="py-3 px-4 text-right">Distance</th>
              <th className="py-3 px-4 text-right">Actual fuel</th>
              <th className="py-3 px-4 text-right">Expected fuel</th>
              <th className="py-3 px-4 text-right">Deviation</th>
              <th className="py-3 px-4">Expected from</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!vehicleId ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Choose a vehicle to compare its engine fuel with what it should have burned.
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                  Loading expected fuel...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load expected fuel.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : days.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No fuel windows for this truck in this range.
                </td>
              </tr>
            ) : (
              days.map((d) => (
                <tr
                  key={d.day}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {d.day}
                    <span className="ml-1.5 text-[11px] text-slate-400">{d.windows} h</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatKm(d.distanceKm)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatLitres(d.actualL)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatLitres(d.expectedL)}</td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${
                      d.deviationL > 0 ? 'text-rose-600 dark:text-rose-400' : ''
                    }`}
                  >
                    {signed(d.deviationL, ' L')}
                    {d.deviationPct != null && (
                      <span className="ml-1 text-[11px] font-normal text-slate-400">
                        ({signed(d.deviationPct, '%')})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
