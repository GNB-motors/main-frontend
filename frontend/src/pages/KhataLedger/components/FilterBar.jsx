import React from 'react';
import { Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * base-ui's Select has no concept of "no value", so every filter carries an
 * explicit ALL sentinel that callers translate back to an empty query param.
 */
export const ALL = '__all__';

/**
 * Filter dropdown. Matches the search field's height and border so the whole bar
 * reads as one control strip, and goes solid when a value is applied — you can
 * see which filters are on without reading the chips.
 */
export const FilterSelect = ({ label, value, onChange, options, allLabel = 'All', className }) => {
  // SelectValue resolves its text from an `items` store we never populate, so
  // left alone it renders the raw sentinel ("__all__"). Pass the label directly.
  const selectedLabel = value ? options.find((o) => o.value === value)?.label || value : allLabel;

  return (
  <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
    <SelectTrigger
      size="default"
      aria-label={label}
      className={cn(
        'h-9 gap-2 rounded-lg border border-input px-3 text-sm',
        value && 'border-transparent bg-muted font-medium text-foreground',
        className,
      )}
    >
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <SelectValue>{selectedLabel}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={ALL}>{allLabel}</SelectItem>
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  );
};

/**
 * Search + the page's dropdowns on one row, with applied filters echoed back as
 * removable chips so a surprising result set is always explainable.
 *
 * activeFilters: [{ key, label, onClear }]
 */
const FilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  hideSearch = false,
  activeFilters = [],
  onClearAll,
  children,
}) => (
  <Card className="card-static p-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {!hideSearch && (
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            className="h-9 w-full rounded-lg border border-input bg-transparent py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {children && (
        <div className={cn('flex flex-wrap items-center gap-2', hideSearch && 'flex-1')}>
          {children}
        </div>
      )}
    </div>

    {activeFilters.length > 0 && (
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Filtered by</span>
        {activeFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={f.onClear}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {f.label}
            <X size={12} className="text-muted-foreground" />
          </button>
        ))}
        {onClearAll && (
          <Button variant="ghost" size="xs" onClick={onClearAll} className="text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>
    )}
  </Card>
);

export default FilterBar;
