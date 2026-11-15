import { AlertTriangle, ShieldAlert, Truck } from 'lucide-react';
import { formatNum } from '../../utils/formatters';

/**
 * The three numbers the owner reads: open critical alerts, open warnings and
 * the trucks the critical ones are about. All from the server's `meta.counts`
 * over the whole filter — never counted from the rows on this page.
 */
export default function OwnerAlertsSummary({ counts }) {
  if (!counts) return null;
  const critical = counts.critical ?? 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        className="ov-kpi"
        style={{ borderLeft: critical > 0 ? '4px solid #e11d48' : '4px solid #cbd5e1' }}
      >
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Critical</span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${critical > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-500'}`}
          >
            <ShieldAlert size={14} />
          </span>
        </div>
        <span className="ov-kpi-value" style={critical > 0 ? { color: '#e11d48' } : undefined}>
          {formatNum(critical)}
        </span>
        <span className="ov-kpi-sub">open, to review</span>
      </div>

      <div className="ov-kpi" style={{ borderLeft: '4px solid #d97706' }}>
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Warnings</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle size={14} />
          </span>
        </div>
        <span className="ov-kpi-value">{formatNum(counts.warning ?? 0)}</span>
        <span className="ov-kpi-sub">open, worth a look</span>
      </div>

      <div className="ov-kpi" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Trucks affected</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Truck size={14} />
          </span>
        </div>
        <span className="ov-kpi-value">
          {counts.trucks == null ? '—' : formatNum(counts.trucks)}
        </span>
        <span className="ov-kpi-sub">with a critical alert</span>
      </div>
    </div>
  );
}
