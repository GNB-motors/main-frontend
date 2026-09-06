import { CalendarDays, RefreshCw, Download } from 'lucide-react';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

/**
 * Operational controls for the PageShell actions slot: the date-range
 * selector, refresh, and export. Title/subtitle/freshness are owned by the
 * shell itself.
 */
export default function OverviewActions({
  selectedDays,
  onRangeChange,
  onRefresh,
  onExport,
  refreshing,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
  );
}
