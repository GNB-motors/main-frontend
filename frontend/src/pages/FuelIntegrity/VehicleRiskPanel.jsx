import { ChevronRight } from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import { Panel, StatusPill } from '../Overview/components/overview.primitives.jsx';
import { RISK_TONE } from './fiData.js';

export default function VehicleRiskPanel({ isLoading, riskVehicles, onDrill }) {
  return (
    <Panel
      eyebrow="Vehicle integrity"
      question="Which vehicles carry the most risk?"
      action={<span className="text-dim text-xs">sorted by risk</span>}
    >
      {isLoading ? (
        <div className="ov-inset h-40 animate-pulse" />
      ) : riskVehicles.length === 0 ? (
        <div className="text-dim py-10 text-center text-sm">No fuel data in this window.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th className="text-right">Fuel</th>
                <th className="text-right">Unexpl. loss</th>
                <th className="text-right">Est. loss</th>
                <th className="text-right">DEF flags</th>
                <th className="text-right">Bill issues</th>
                <th>Risk</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {riskVehicles.map((v) => (
                <tr
                  key={v.registrationNumber}
                  className="fi-row-click"
                  onClick={() => onDrill(v.registrationNumber)}
                >
                  <td>
                    <span className="reg-plate">{v.registrationNumber}</span>
                  </td>
                  <td className="num text-right">{formatLitres(v.fillsLitres)}</td>
                  <td
                    className="num text-right"
                    style={{
                      color:
                        v.siphonSuspectedLossL > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)',
                    }}
                  >
                    {formatLitres(v.siphonSuspectedLossL)}
                  </td>
                  <td
                    className="num text-right"
                    style={{
                      color:
                        v.siphonSuspectedLossInr > 0
                          ? 'var(--critical)'
                          : 'var(--cluster-text-dim)',
                    }}
                  >
                    {formatINR(v.siphonSuspectedLossInr)}
                  </td>
                  <td className="text-right">
                    {v.defFlagCount > 0 ? (
                      <span className="ov-pill ov-pill--caution">{v.defFlagCount}</span>
                    ) : (
                      <span className="num text-dim">0</span>
                    )}
                  </td>
                  <td className="text-right">
                    {v.billFlagCount > 0 ? (
                      <span className="ov-pill ov-pill--caution">{v.billFlagCount}</span>
                    ) : (
                      <span className="num text-dim">0</span>
                    )}
                  </td>
                  <td>
                    <StatusPill tone={RISK_TONE[v.risk]}>{v.risk}</StatusPill>
                  </td>
                  <td className="text-right">
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-semibold"
                      style={{ color: 'var(--gnb-400)' }}
                    >
                      Drill down <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
