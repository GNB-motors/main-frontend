import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

/** A labelled select over {id, label} options; `noneLabel` adds an empty choice. */
export default function PickSelect({ label, value, onChange, options = [], noneLabel, disabled }) {
  const labelId = useId();
  return (
    <div className="atx-field">
      <span className="atx-field-label" id={labelId}>
        {label}
      </span>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 text-sm" aria-labelledby={labelId}>
          <SelectValue placeholder={noneLabel || 'Pick one'} />
        </SelectTrigger>
        <SelectContent align="start">
          {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
