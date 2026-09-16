import { useMemo } from 'react';
import { Fuel } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { formatINR, formatLitres, formatNum } from '../../utils/formatters';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { Panel } from '../Overview/components/overview.primitives.jsx';

/**
 * Pump Short-Delivery Ledger (#7). Per-pump rollup of reconciled fills — where
 * the billed litres exceeded the measured tank rise. ₹ figures are estimates;
 * a flag means "please review", never an accusation.
 */
export default function PumpLedgerPanel({ from, to }) {
  const params = useMemo(() => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [from, to]);

  const { data, loading, error } = useApi(
    (signal) => FuelIntegrityService.getPumpLedger(params, { signal }),
    [JSON.stringify(params)],
  );

  const pumps = data?.pumps || [];

  return (
    <Panel
      className="min-w-0"
      eyebrow="Pump short-delivery ledger"
      question="Which pumps bill more than the tank actually rose?"
    >
      {error && (
        <div className="text-dim py-4 text-center text-xs">Could not load the pump ledger.</div>
      )}

      {!error && loading && pumps.length === 0 && (
        <div className="text-dim py-6 text-center text-xs">Loading pump ledger…</div>
      )}

      {!error && !loading && pumps.length === 0 && (
        <div className="text-dim flex flex-col items-center gap-2 py-6 text-center text-xs">
          <Fuel size={18} className="opacity-60" />
          <span>No reconciled fills in this window — nothing to compare yet.</span>
        </div>
      )}

      {pumps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dim text-left text-[11px] uppercase tracking-wide">
                <th className="py-1.5 pr-2">Pump</th>
                <th className="py-1.5 px-2 text-right">Fills</th>
                <th className="py-1.5 px-2 text-right">Short</th>
                <th className="py-1.5 px-2 text-right">Short %</th>
                <th className="py-1.5 pl-2 text-right">Est. loss</th>
              </tr>
            </thead>
            <tbody>
              {pumps.map((p) => (
                <tr key={p.pump} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-1.5 pr-2">
                    <span className="font-medium">{p.pump}</span>
                    {p.flaggedFills > 0 && (
                      <span
                        className="num ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          background: 'color-mix(in srgb, var(--caution) 14%, transparent)',
                          color: 'var(--caution)',
                        }}
                      >
                        {p.flaggedFills} flagged
                      </span>
                    )}
                  </td>
                  <td className="num py-1.5 px-2 text-right">{formatNum(p.fills)}</td>
                  <td className="num py-1.5 px-2 text-right">{formatLitres(p.shortfallLitres)}</td>
                  <td
                    className="num py-1.5 px-2 text-right font-semibold"
                    style={{ color: p.shortfallPct > 0 ? 'var(--caution)' : 'var(--cluster-text)' }}
                  >
                    {p.shortfallPct}%
                  </td>
                  <td
                    className="num py-1.5 pl-2 text-right font-bold"
                    style={{
                      color: p.estimatedLossInr > 0 ? 'var(--critical)' : 'var(--cluster-text)',
                    }}
                  >
                    {formatINR(p.estimatedLossInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-dim mt-3 text-[10px]">{data?.disclaimer}</p>
        </div>
      )}
    </Panel>
  );
}
