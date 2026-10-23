import { Fuel, ShieldCheck, ShieldAlert, ArrowRight, Gauge, Activity, Layers } from 'lucide-react';
import { formatINR, formatLitres } from '../../../utils/formatters';

/** Fleet mass balance: fuel in, engine burn and tank change, and what is left unexplained. */
const MassBalancePipeline = ({
  lossL,
  pricePerL,
  totalEngineBurnL,
  totalFillsLitres,
  totalNetTankDeltaL,
  windowDays,
}) => (
  <div className="fi-flow-pipeline">
    <div className="fi-pipeline-header">
      <div className="fi-pipeline-title-group">
        <Layers size={15} className="text-blue-600 dark:text-blue-400" />
        <span className="fi-pipeline-title">Autonomous Mass-Balance Flow Reconciliation</span>
        <span className="fi-pipeline-formula">
          Pump Inflow − Engine Burn − ΔTank Level = Unaccounted Loss
        </span>
      </div>
      <div className="text-xs text-slate-500 font-medium">
        Window:{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {windowDays ? `Last ${windowDays} Days` : 'Last 7 Days'}
        </span>
      </div>
    </div>

    <div className="fi-pipeline-steps">
      {/* Step 1: Dispensed Inflow */}
      <div className="fi-step-card">
        <div className="fi-step-head">
          <span className="fi-step-label">1. Pump Dispensed</span>
          <Fuel size={14} className="text-blue-500" />
        </div>
        <div className="fi-step-val text-blue-600 dark:text-blue-400">
          +{formatLitres(totalFillsLitres)}
        </div>
        <div className="fi-step-sub">≈ {formatINR(totalFillsLitres * pricePerL)} invoiced</div>
      </div>

      <div className="fi-step-arrow">
        <ArrowRight size={16} />
      </div>

      {/* Step 2: Engine Consumed */}
      <div className="fi-step-card">
        <div className="fi-step-head">
          <span className="fi-step-label">2. Engine Consumed</span>
          <Activity size={14} className="text-emerald-500" />
        </div>
        <div className="fi-step-val text-slate-800 dark:text-slate-100">
          {formatLitres(totalEngineBurnL)}
        </div>
        <div className="fi-step-sub">
          {totalEngineBurnL > 0 ? 'CAN bus engine burn' : 'Awaiting CAN data'}
        </div>
      </div>

      <div className="fi-step-arrow">
        <ArrowRight size={16} />
      </div>

      {/* Step 3: Net Tank Delta */}
      <div className="fi-step-card">
        <div className="fi-step-head">
          <span className="fi-step-label">3. Net Tank Reserve</span>
          <Gauge size={14} className="text-indigo-500" />
        </div>
        <div className="fi-step-val text-indigo-600 dark:text-indigo-400">
          {totalNetTankDeltaL >= 0 ? '+' : ''}
          {formatLitres(totalNetTankDeltaL)}
        </div>
        <div className="fi-step-sub">Fleet tank level balance</div>
      </div>

      <div className="fi-step-arrow">
        <ArrowRight size={16} />
      </div>

      {/* Step 4: Siphon Loss Defense */}
      <div
        className="fi-step-card"
        style={{
          borderColor: lossL > 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.4)',
          background: lossL > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.06)',
        }}
      >
        <div className="fi-step-head">
          <span className="fi-step-label">4. Unaccounted Loss</span>
          {lossL > 0 ? (
            <ShieldAlert size={14} className="text-red-500" />
          ) : (
            <ShieldCheck size={14} className="text-emerald-500" />
          )}
        </div>
        <div
          className="fi-step-val"
          style={{
            color: lossL > 0 ? 'var(--critical, #dc2626)' : 'var(--ok, #10b981)',
          }}
        >
          {lossL > 0 ? `−${formatLitres(lossL)}` : '0.0 L (₹0)'}
        </div>
        <div className="fi-step-sub">
          {lossL > 0 ? `Leakage: ${formatINR(lossL * pricePerL)}` : '🛡️ 100% Intact · Zero Theft'}
        </div>
      </div>
    </div>
  </div>
);

export default MassBalancePipeline;
