import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Form dropdown built on the shared Select primitive — never a native <select>,
 * so the list matches the app's popovers instead of the OS widget.
 *
 * base-ui has no "empty" value, so an explicit sentinel stands in for
 * "nothing picked" and is translated back to '' for the caller.
 */
export const NONE = '__none__';

const SelectField = ({
  label,
  required,
  hint,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  /** Set when the field lives inside a Dialog, so the list clears the modal. */
  inDialog = false,
  className,
}) => {
  // Without an `items` store, SelectValue would print the raw "__none__"
  // sentinel, so the resolved label is passed in explicitly.
  const selectedLabel = value ? options.find((o) => o.value === value)?.label || value : placeholder;

  return (
  <div className={className}>
    {label && (
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
    )}
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger
        className={cn(
          'h-9 w-full justify-between rounded-lg border border-input px-3',
          !value && 'text-muted-foreground',
        )}
      >
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent positionerClassName={inDialog ? 'z-[10060]' : undefined}>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
  );
};

export default SelectField;
