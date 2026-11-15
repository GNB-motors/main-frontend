// Small presentational chips for the Trip Economics reports.
const TONES = {
  green: { bg: '#E7F6EC', fg: '#1B7F3B' },
  amber: { bg: '#FDF3E2', fg: '#A66300' },
  red: { bg: '#FCE9E9', fg: '#B42318' },
  blue: { bg: '#E8F0FE', fg: '#1A56C4' },
  grey: { bg: '#F0F1F3', fg: '#555' },
};

const STATUS_TONE = {
  OPEN: 'grey',
  CLOSED: 'blue',
  RECONCILED: 'green',
  UNRECONCILED_NO_LEDGER: 'amber',
  DEVIATION: 'red',
  APPROVED: 'green',
  APPROVED_LATE: 'amber',
  NOT_DEVIATION: 'grey',
};

export function StatusChip({ value }) {
  if (!value) return <span>—</span>;
  const t = TONES[STATUS_TONE[value]] || TONES.grey;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: t.bg,
        color: t.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {String(value).replace(/_/g, ' ')}
    </span>
  );
}

/**
 * The flags of a row, as chips.
 *
 * `labelFor` gives a flag its own words (the fuel cycles have flags that say
 * what was not measured). A flag with no word of its own keeps its code, so
 * a report that does not know a flag still shows something readable.
 */
export function FlagChips({ flags, labelFor }) {
  if (!Array.isArray(flags) || flags.length === 0) return <span>—</span>;
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {flags.map((f) => (
        <span
          key={f}
          style={{
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 11,
            background: TONES.amber.bg,
            color: TONES.amber.fg,
          }}
        >
          {labelFor ? labelFor(f) : f}
        </span>
      ))}
    </span>
  );
}
