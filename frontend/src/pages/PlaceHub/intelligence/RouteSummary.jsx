import { summaryChips } from './model/deliveryRoutesModel';

/** Compact counts strip; the SAP chips double as the SAP status filter. */
export default function RouteSummary({ totals, showSap, sapStatus, onFilter }) {
  const chips = summaryChips(totals, showSap);
  if (!chips.length) return null;
  return (
    <div className="ud-summary" aria-label="Route summary">
      {chips.map((c) =>
        c.filter ? (
          <button
            key={c.key}
            type="button"
            className={`ud-chip ud-chip--${c.tone}`}
            aria-pressed={sapStatus === c.filter}
            onClick={() => onFilter(sapStatus === c.filter ? '' : c.filter)}
          >
            <strong>{c.value}</strong> {c.label}
          </button>
        ) : (
          <span key={c.key} className="ud-chip">
            <strong>{c.value}</strong> {c.label}
          </span>
        ),
      )}
    </div>
  );
}
