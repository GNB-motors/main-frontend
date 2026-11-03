import { Search, X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * MapSearchBox — the floating search field at the top-left of the map.
 *
 * It holds the same search state as the fleet list, so "/" still focuses it
 * from anywhere. On a narrow screen it collapses to an icon that expands,
 * because the map needs the room.
 */
export default function MapSearchBox({
  value = '',
  onChange,
  inputRef = null,
  placeholder = 'Search truck or place',
  compact = false,
}) {
  // On a phone the field is narrow, so the placeholder is shortened to fit.
  const isPhone = useMediaQuery('(max-width: 600px)');
  return (
    <div
      className={`ov-search flex h-10 items-center gap-2 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-3 shadow-[var(--rd-shadow-float)] ${
        compact ? 'ov-search--compact justify-center' : ''
      }`}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-[var(--rd-ink-3)]" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={isPhone ? 'Search' : placeholder}
        autoComplete="off"
        aria-label="Search truck or place"
        className={`min-w-0 flex-1 bg-transparent text-[13px] text-[var(--rd-ink)] outline-hidden placeholder:text-[var(--rd-ink-3)] ${
          compact ? 'w-6' : 'w-full'
        }`}
      />
      {value && !compact ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="shrink-0 rounded p-0.5 text-[var(--rd-ink-3)] transition-colors hover:text-[var(--rd-ink-2)]"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
