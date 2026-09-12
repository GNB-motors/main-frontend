import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  DISABLED: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  AUTH_FAILED: 'bg-red-50 text-red-600 ring-1 ring-red-200',
};

const STATUS_ICONS = {
  ACTIVE: <CheckCircle size={12} />,
  DISABLED: <XCircle size={12} />,
  AUTH_FAILED: <AlertTriangle size={12} />,
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.DISABLED}`}
    >
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
}
