import Skel from '../DefLedger/Skel';

/**
 * KpiTile — the open-vs-paid totals tile. Same shape and class strings as
 * DefLedger's KpiTile so the two ledgers read as one system.
 */
export default function KpiTile({
  label,
  loading,
  value,
  valueClass,
  note,
  noteClass = 'text-slate-400',
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      {loading ? (
        <>
          <Skel className="h-8 w-24" />
          <Skel className="h-3 w-32" />
        </>
      ) : (
        <>
          <span className={`text-2xl font-bold font-mono ${valueClass}`}>{value}</span>
          <span className={`text-[11px] ${noteClass}`}>{note}</span>
        </>
      )}
    </div>
  );
}
