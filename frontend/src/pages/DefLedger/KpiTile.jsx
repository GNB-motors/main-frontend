import Skel from './Skel';

/**
 * One figure with its unit and a one-line note.
 *
 * The value keeps its own colour so a number is never shouted about; a red
 * mark belongs on the small dot beside the note, not on the figure itself.
 */
function KpiTile({
  label,
  loading,
  value,
  valueClass,
  unit = null,
  note,
  noteClass = 'text-slate-400',
  noteDot = false,
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
          <span className={`text-2xl font-bold tabular-nums ${valueClass || ''}`}>
            {value}
            {unit ? (
              <small className="ml-1.5 text-[13px] font-medium text-slate-500">{unit}</small>
            ) : null}
          </span>
          <span className={`flex items-center gap-1.5 text-[11px] ${noteClass}`}>
            {noteDot ? (
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
              />
            ) : null}
            {note}
          </span>
        </>
      )}
    </div>
  );
}

export default KpiTile;
