import { ChevronDown } from 'lucide-react';

/**
 * A labelled dropdown button that opens into a searchable list — the same
 * shape the vehicle and driver pickers on the AdBlue log form both need.
 * `renderItem(item)` returns `{ main, sub }` text for one list row.
 */
export const SearchableEntityDropdown = (props) => {
  const {
    label,
    placeholder,
    loadingLabel,
    loading,
    items,
    selected,
    onSelect,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    open,
    onToggle,
    renderItem,
  } = props;

  return (
    <div className="mileage-form-group">
      <label>{label}</label>
      <div className="dropdown-wrapper" style={{ zIndex: open ? 200 : undefined }}>
        <button
          type="button"
          className={`dropdown-button ${loading ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <span>{selected ? renderItem(selected).main : loading ? loadingLabel : placeholder}</span>
          <ChevronDown size={16} className={open ? 'rotated' : ''} />
        </button>
        {open && (
          <div className="dropdown-menu">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="dropdown-search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="dropdown-list">
              {items.map((item) => {
                const { main, sub } = renderItem(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`dropdown-item ${selected?.id === item.id ? 'selected' : ''}`}
                    onClick={() => onSelect(item)}
                  >
                    <div className="item-main">{main}</div>
                    <div className="item-sub">{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
