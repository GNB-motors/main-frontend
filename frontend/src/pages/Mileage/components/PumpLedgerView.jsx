import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatINR, formatLitres, formatNum } from '../../../utils/formatters';
import { DATE_PRESETS, DEFAULT_PRESET, presetRange, rangeToParams } from '../mileageRows';

const pillClass = (active) =>
  `px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
    active
      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  }`;

/**
 * GET /api/fuel-integrity/pump-ledger — short delivery per pump over bills
 * that were matched to a tank rise. ₹ is an estimate at the configured diesel
 * price; the server's disclaimer goes under the table.
 */
export default function PumpLedgerView() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PRESET));

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await apiClient.get('/api/fuel-integrity/pump-ledger', {
          params: rangeToParams(range),
        });
        if (isMounted) setData(res.data?.data || null);
      } catch {
        if (isMounted) {
          setData(null);
          setLoadError(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [range, reloadKey]);

  const pumps = data?.pumps || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <p className="text-xs text-slate-500">
          Per pump: litres billed against what reached the tank, over matched bills.
          {data?.fuelPriceInrPerL != null &&
            ` Loss estimated at ${formatINR(data.fuelPriceInrPerL, { decimals: 2 })}/L.`}
        </p>
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

      <div className="mileage-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Pump</th>
              <th className="py-3 px-4 text-right">Fills</th>
              <th className="py-3 px-4 text-right">Billed</th>
              <th className="py-3 px-4 text-right">Reached tank</th>
              <th className="py-3 px-4 text-right">Short</th>
              <th className="py-3 px-4 text-right">Short %</th>
              <th className="py-3 px-4 text-right">Est. loss</th>
              <th className="py-3 px-4">Last fill (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                  Loading pump ledger...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <span>Couldn&apos;t load the pump ledger.</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </td>
              </tr>
            ) : pumps.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No matched bills in this range.
                </td>
              </tr>
            ) : (
              pumps.map((p) => (
                <tr
                  key={p.pump}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {p.pump || '—'}
                    {p.flaggedFills > 0 && (
                      <span className="mileage-badge mileage-badge-variance ml-2 !px-1.5 !py-0.5 !text-[10px]">
                        {p.flaggedFills} flagged
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatNum(p.fills)}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatLitres(p.claimedLitres)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatLitres(p.actualLitres)}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatLitres(p.shortfallLitres)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${
                      p.shortfallPct > 0 ? 'text-amber-600 dark:text-amber-400' : ''
                    }`}
                  >
                    {p.shortfallPct != null ? `${p.shortfallPct}%` : '—'}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      p.estimatedLossInr > 0 ? 'text-rose-600 dark:text-rose-400' : ''
                    }`}
                  >
                    {formatINR(p.estimatedLossInr)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {p.lastFillAt ? formatDateTimeIST(p.lastFillAt) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.disclaimer && (
          <p className="px-4 py-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
            {data.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}
