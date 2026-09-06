import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, Download, ReceiptText } from 'lucide-react';
import { timeAgo } from '../../../utils/formatters';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

/**
 * Overview header — title, one-line purpose, and the operational controls:
 * a clear date-range selector, refresh, export, plus a freshness stamp.
 */
export default function DashboardHeader({ selectedDays, onRangeChange, onRefresh, onExport, refreshing, lastUpdated }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="cluster-title text-2xl">Overview</h1>
        <p className="text-dim mt-1 text-sm">Fleet performance and operational health</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/whatsapp-approvals" className="ov-btn gap-2" style={{ textDecoration: 'none' }}>
          <ReceiptText size={15} />
          WhatsApp Approvals
        </Link>
        {lastUpdated && (
          <span className="text-dim mr-1 hidden text-xs sm:inline">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
        <label className="ov-btn cursor-pointer gap-2 pr-2">
          <CalendarDays size={15} className="text-dim" />
          <select
            value={selectedDays}
            onChange={(e) => onRangeChange(Number(e.target.value))}
            className="cursor-pointer border-0 bg-transparent text-sm font-semibold outline-none"
            style={{ color: 'var(--cluster-text)' }}
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ov-btn" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button type="button" className="ov-btn ov-btn--primary" onClick={onExport}>
          <Download size={15} />
          Export
        </button>
      </div>
    </div>
  );
}
