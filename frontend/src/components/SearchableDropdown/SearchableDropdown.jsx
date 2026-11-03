import { useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Check, ChevronDown, Search, Trash2, X } from 'lucide-react';
import { optionLabel, optionKey, optionDisabled } from './dropdownOptions';
import './SearchableDropdown.css';

export default function SearchableDropdown({
  options = [],
  selectedOption = '',
  selectedOptions = [],
  onSelect,
  onAddNew,
  onRemove,
  onRequestAddNew,
  onDeleteOption,
  onClear,
  onSearchChange,
  getSearchText,
  getOptionLabel = optionLabel,
  getOptionKey = optionKey,
  isOptionDisabled = optionDisabled,
  isOptionSelected,
  renderOption,
  placeholder = 'Select option',
  addNewLabel = 'Create new',
  disabled = false,
  multiple,
  open: controlledOpen,
  onOpenChange,
  searchValue,
  searchPlaceholder = 'Search',
  searchLabel = 'Search options',
  filterOptions = true,
  loading = false,
  error = null,
  emptyMessage = 'No results found',
  footer,
  bare = false,
  className = '',
  triggerClassName = '',
  contentClassName = '',
  triggerRef: externalTriggerRef,
  ...triggerProps
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [active, setActive] = useState(-1);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const open = !disabled && (controlledOpen ?? localOpen);
  const query = searchValue ?? localQuery;
  const multi = multiple ?? Boolean(onRemove || selectedOptions.length);
  const filtered = filterOptions
    ? options.filter((option) =>
        String(getSearchText ? getSearchText(option) : getOptionLabel(option))
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : options;
  const enabled = filtered.filter((option) => !isOptionDisabled(option));
  const setQuery = (value) => {
    setLocalQuery(value);
    setActive(-1);
    onSearchChange?.(value);
  };
  const setOpen = (next) => {
    if (disabled && next) return;
    setLocalOpen(next);
    onOpenChange?.(next);
    if (next) setQuery('');
  };
  const selected = (option) =>
    isOptionSelected
      ? isOptionSelected(option)
      : multi
        ? selectedOptions.some((item) => getOptionKey(item) === getOptionKey(option))
        : Boolean(selectedOption) && getOptionLabel(option) === optionTextLabel;
  const optionTextLabel = typeof selectedOption === 'string' ? selectedOption : '';
  const choose = (option) => {
    if (disabled || isOptionDisabled(option)) return;
    if (!multi) setOpen(false);
    onSelect?.(option);
  };
  const addNew = () => {
    setOpen(false);
    if (onRequestAddNew) onRequestAddNew(query, () => setQuery(''));
    else if (onAddNew && query) {
      onAddNew(query);
      setQuery('');
    }
  };
  const canCreate =
    Boolean(onRequestAddNew || onAddNew) &&
    (!options.length ||
      (query &&
        !options.some((option) => getOptionLabel(option).toLowerCase() === query.toLowerCase())));
  const onSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index =
        event.key === 'ArrowDown'
          ? (active + 1) % Math.max(1, enabled.length)
          : active <= 0
            ? enabled.length - 1
            : active - 1;
      setActive(index);
      listRef.current
        ?.querySelectorAll('[role="option"]:not(:disabled)')
        ?.[index]?.scrollIntoView?.({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (enabled[active >= 0 ? active : 0]) choose(enabled[active >= 0 ? active : 0]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };
  const content = (
    <>
      {multi && selectedOptions.length > 0 && (
        <div className="searchable-tags">
          {selectedOptions.map((tag) => (
            <span key={getOptionKey(tag)} className="searchable-selected-tag">
              {getOptionLabel(tag)}
              {onRemove && (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${getOptionLabel(tag)}`}
                  onClick={() => onRemove(tag)}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <Popover.Trigger
        ref={externalTriggerRef}
        className={`searchable-dropdown-header ${triggerClassName}`.trim()}
        disabled={disabled}
        aria-disabled={disabled}
        aria-haspopup="listbox"
        onKeyDown={(event) => {
          triggerProps.onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        {...triggerProps}
      >
        <span className="searchable-dropdown-content">
          {selectedOption || <span className="searchable-placeholder">{placeholder}</span>}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="searchable-chevron-icon" />
      </Popover.Trigger>
      {onClear && selectedOption && (
        <button
          type="button"
          className="searchable-clear"
          disabled={disabled}
          aria-label="Clear selection"
          onClick={onClear}
        >
          <X size={14} />
        </button>
      )}
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={6}
          align="start"
          collisionPadding={8}
          className="searchable-dropdown-positioner"
        >
          <Popover.Popup
            initialFocus={searchRef}
            className={`searchable-dropdown-list-container ${contentClassName}`.trim()}
          >
            <div className="searchable-search-container">
              <Search size={16} aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                aria-label={searchLabel}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
                className="searchable-search-input"
              />
            </div>
            <div
              className="searchable-options-list"
              role="listbox"
              aria-label={searchLabel}
              aria-multiselectable={multi || undefined}
              ref={listRef}
            >
              {filtered.map((option, index) => {
                const highlighted = enabled[active] === option;
                return (
                  <div key={getOptionKey(option)}>
                    {option?.group && option.group !== filtered[index - 1]?.group && (
                      <div className="searchable-option-group">{option.group}</div>
                    )}
                    <div className="searchable-option-row">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected(option)}
                        disabled={isOptionDisabled(option)}
                        className={`searchable-dropdown-item${highlighted ? ' is-active' : ''}`}
                        onClick={() => choose(option)}
                      >
                        <span>{renderOption ? renderOption(option) : getOptionLabel(option)}</span>
                        {selected(option) && <Check size={14} aria-hidden="true" />}
                      </button>
                      {onDeleteOption && (
                        <button
                          type="button"
                          className="searchable-delete-option"
                          aria-label="Delete location"
                          title="Delete location"
                          onClick={() => onDeleteOption(option)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {loading && (
              <div className="searchable-note" role="status">
                Searching…
              </div>
            )}
            {error && (
              <div className="searchable-note is-error" role="alert">
                {typeof error === 'string' ? error : 'Could not load the list.'}
              </div>
            )}
            {!loading && !error && !filtered.length && !canCreate && (
              <div className="searchable-no-results">{emptyMessage}</div>
            )}
            {canCreate && (
              <button type="button" className="searchable-create" onClick={addNew}>
                {query ? `+ ${addNewLabel} "${query}"` : `+ ${addNewLabel}`}
              </button>
            )}
            {footer}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </>
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {bare ? (
        content
      ) : (
        <div className={`searchable-dropdown-container ${className}`.trim()}>{content}</div>
      )}
    </Popover.Root>
  );
}
