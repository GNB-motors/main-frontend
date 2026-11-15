/**
 * LegendToggle — one row of the Track legend.
 *
 * A single click toggles the group; a double click shows only that group.
 * When the row is off the dot is hollow and the row is dimmed, so the state
 * is readable without reading a word.
 *
 * The optional `info` node sits OUTSIDE the button: a button inside a
 * button is invalid HTML and breaks keyboard use.
 */
export default function LegendToggle({
  label,
  count = null,
  color,
  icon = null,
  on,
  onToggle,
  onOnly,
  disabled = false,
  disabledReason = null,
  info = null,
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-pressed={on}
        disabled={disabled}
        title={disabledReason || undefined}
        onClick={onToggle}
        onDoubleClick={onOnly}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-[var(--rd-radius-xs)] px-1 py-1 text-left transition-colors ${
          disabled
            ? 'cursor-not-allowed opacity-45'
            : 'hover:bg-[var(--rd-card-2)] active:bg-[var(--rd-card-2)]'
        }`}
      >
        {icon ? (
          <span
            aria-hidden="true"
            className="flex size-4 shrink-0 items-center justify-center rounded-full"
            style={{ color, backgroundColor: on ? `${color}1f` : 'transparent' }}
          >
            {icon}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full border-2 ${
              on ? 'border-transparent' : 'bg-transparent'
            }`}
            style={on ? { backgroundColor: color } : { borderColor: color }}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${on ? 'text-[var(--rd-ink)]' : 'text-[var(--rd-ink-3)]'}`}
        >
          {label}
        </span>
        {count !== null ? (
          <span className="shrink-0 text-[13px] text-[var(--rd-ink-2)] tabular-nums">{count}</span>
        ) : null}
        {disabledReason && disabledReason !== 'Coming soon' ? (
          <span className="shrink-0 text-[10px] text-[var(--rd-ink-3)]">{disabledReason}</span>
        ) : null}
      </button>
      {info}
    </div>
  );
}
