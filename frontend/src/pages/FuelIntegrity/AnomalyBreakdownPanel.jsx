import { formatLitres } from '../../utils/formatters';
import { Panel } from '../Overview/components/overview.primitives.jsx';

export default function AnomalyBreakdownPanel({ defCount, billCount, lossL, affected, onDrill }) {
  return (
    <Panel eyebrow="Anomaly breakdown" question="What kind of anomaly, and where?">
      <div className="grid grid-cols-3 gap-2">
        <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
          <span
            className="num text-xl font-bold"
            style={{ color: defCount > 0 ? 'var(--caution)' : 'var(--cluster-text)' }}
          >
            {defCount}
          </span>
          <span className="text-dim text-[10px] uppercase tracking-wide">DEF flags</span>
        </div>
        <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
          <span
            className="num text-xl font-bold"
            style={{ color: billCount > 0 ? 'var(--caution)' : 'var(--cluster-text)' }}
          >
            {billCount}
          </span>
          <span className="text-dim text-[10px] uppercase tracking-wide">Bill mism.</span>
        </div>
        <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
          <span
            className="num text-xl font-bold"
            style={{ color: lossL > 0 ? 'var(--critical)' : 'var(--cluster-text)' }}
          >
            {formatLitres(lossL)}
          </span>
          <span className="text-dim text-[10px] uppercase tracking-wide">Loss</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-dim mb-1 text-[11px] font-semibold uppercase tracking-wide">
          Most affected vehicles
        </div>
        {affected.list.length === 0 ? (
          <div className="text-dim py-4 text-center text-xs">
            No anomalies attributed to any vehicle.
          </div>
        ) : (
          affected.list.map((v) => (
            <button
              key={v.reg}
              className="fi-affected w-full text-left"
              onClick={() => onDrill(v.reg)}
              title={`${v.def} DEF · ${v.bill} bill`}
            >
              <span className="reg-plate">{v.reg}</span>
              <span className="fi-affected-track">
                <span
                  className="fi-affected-fill"
                  style={{
                    width: `${(v.anomalies / affected.max) * 100}%`,
                    background: 'var(--caution)',
                  }}
                />
              </span>
              <span
                className="num w-6 text-right text-sm font-bold"
                style={{ color: 'var(--caution)' }}
              >
                {v.anomalies}
              </span>
            </button>
          ))
        )}
      </div>
    </Panel>
  );
}
