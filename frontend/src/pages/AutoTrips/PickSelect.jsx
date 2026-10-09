import { useId, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * A labelled select over {id, label} options; `noneLabel` adds an empty choice.
 * Base UI's trigger shows the raw value unless it is handed `items`, so the
 * labels go there too — and "nothing picked" is null, not a sentinel string.
 */
export default function PickSelect({ label, value, onChange, options = [], noneLabel, disabled }) {
  const labelId = useId();
  const items = useMemo(
    () => [
      ...(noneLabel ? [{ value: null, label: noneLabel }] : []),
      ...options.map((o) => ({ value: o.id, label: o.label })),
    ],
    [noneLabel, options],
  );
  return (
    <div className="atx-field">
      <span className="atx-field-label" id={labelId}>
        {label}
      </span>
      <Select
        items={items}
        value={value || null}
        onValueChange={(v) => onChange(v || '')}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-full text-sm" aria-labelledby={labelId}>
          <SelectValue placeholder={noneLabel || 'Pick one'} />
        </SelectTrigger>
        <SelectContent align="start" className="w-auto max-w-[420px] min-w-(--anchor-width)">
          {items.map((it) => (
            <SelectItem key={it.value ?? ''} value={it.value}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
