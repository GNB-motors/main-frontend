import { AlertTriangle, ShieldAlert, Bell, Truck } from 'lucide-react';
import { formatNum } from '../../utils/formatters';

export default function OwnerAlertsSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="ov-kpi" style={{ borderLeft: '4px solid #d97706' }}>
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">To review</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle size={14} />
          </span>
        </div>
        <span className="ov-kpi-value" style={{ color: '#b45309' }}>
          {formatNum(summary.toReview)}
        </span>
        <span className="ov-kpi-sub">unacknowledged alerts</span>
      </div>

      <div
        className="ov-kpi"
        style={{ borderLeft: summary.critical > 0 ? '4px solid #e11d48' : '4px solid #cbd5e1' }}
      >
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Critical</span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${summary.critical > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-500'}`}
          >
            <ShieldAlert size={14} />
          </span>
        </div>
        <span
          className="ov-kpi-value"
          style={summary.critical > 0 ? { color: '#e11d48' } : undefined}
        >
          {formatNum(summary.critical)}
        </span>
        <span className="ov-kpi-sub">critical alerts on page</span>
      </div>

      <div className="ov-kpi" style={{ borderLeft: '4px solid #2563eb' }}>
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Subscription</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            <Bell size={14} />
          </span>
        </div>
        <span className="ov-kpi-value">{formatNum(summary.subscription)}</span>
        <span className="ov-kpi-sub">plan issues on this page</span>
      </div>

      <div className="ov-kpi" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div className="flex items-center justify-between">
          <span className="ov-kpi-label">Vehicles</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Truck size={14} />
          </span>
        </div>
        <span className="ov-kpi-value">{formatNum(summary.vehicles)}</span>
        <span className="ov-kpi-sub">affected on this page</span>
      </div>
    </div>
  );
}
