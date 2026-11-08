import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useId, useMemo } from 'react';
/**
 * A labelled select over {id, label} options; `noneLabel` adds an empty choice.
 * Uses the shared searchable control while keeping ids and optional empty choices.
 */
export default function PickSelect({ label, value, onChange, options = [], noneLabel, disabled }) {
  const labelId = useId();
  const items = useMemo(
    () => [
      ...(noneLabel
        ? [
            {
              value: null,
              label: noneLabel,
            },
          ]
        : []),
      ...options.map((o) => ({
        value: o.id,
        label: o.label,
      })),
    ],
    [noneLabel, options],
  );
  return (
    <div className="atx-field">
      <span className="atx-field-label" id={labelId}>
        {label}
      </span>
      <SearchableSelect
        value={value || null}
        onValueChange={(v) => onChange(v || '')}
        disabled={disabled}
        className="h-9 w-full text-sm"
        aria-labelledby={labelId}
        placeholder={noneLabel || 'Pick one'}
      >
        {!noneLabel ? (
          <option value="" disabled>
            Pick one
          </option>
        ) : null}
        {items.map((it) => (
          <option key={it.value ?? ''} value={it.value}>
            {it.label}
          </option>
        ))}
      </SearchableSelect>
    </div>
  );
}
