import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/**
 * Select over [{ value, label }]. Base UI's trigger shows the raw value unless
 * it gets `items`, so labels go there too; '' (nothing picked) maps to null.
 * Its popup sits above the full-screen support dialog (z 10060 > 10051).
 */
export default function SupportSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select',
  className = '',
  disabled = false,
  invalid = false,
}) {
  const items = options.map((o) => ({ value: o.value === '' ? null : o.value, label: o.label }));
  return (
    <Select
      items={items}
      value={value || null}
      onValueChange={(v) => onChange(v || '')}
      disabled={disabled}
    >
      <SelectTrigger
        className={`h-9 text-sm ${className}`.trim()}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-(--anchor-width) max-w-[360px]">
        {items.map((it) => (
          <SelectItem key={it.value ?? ''} value={it.value}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
