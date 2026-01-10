import React, { useState, useRef, useEffect } from "react";
import "./SearchableDropdown.css";

const SearchableDropdown = ({
    options = [],
    selectedOption = "",
    selectedOptions = [],
    onSelect,
    onAddNew,
    onRemove,
    onRequestAddNew, // new: callback to open map modal
    onDeleteOption, // new: callback to delete an option
    placeholder = "Select option",
    addNewLabel = "Create new",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    const handleSelect = (option) => {
        onSelect(option);
        if (!selectedOptions || selectedOptions.length === 0) {
            setIsOpen(false);
        }
    };

    const handleAddNewClick = () => {
        if (onRequestAddNew) {
            onRequestAddNew(searchTerm, () => setSearchTerm(""));
        } else if (onAddNew) {
            if (searchTerm && !options.includes(searchTerm)) {
                onAddNew(searchTerm);
                setSearchTerm("");
            }
        }
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Support both string and object options
    const getOptionLabel = (option) => typeof option === 'string' ? option : option.name;
    const filteredOptions = options.filter((option) =>
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canCreateNew =
        searchTerm && !options.some((opt) => getOptionLabel(opt).toLowerCase() === searchTerm.toLowerCase());

    return (
        <div className="searchable-dropdown-container" ref={dropdownRef}>
            <div className="searchable-dropdown-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="searchable-dropdown-content">
                    {selectedOptions && selectedOptions.length > 0
                        ? selectedOptions.map((tag) => (
                              <span key={getOptionLabel(tag)} className="searchable-selected-tag">
                                  {getOptionLabel(tag)}
                                  {onRemove && (
                                      <div className="searchable-remove-tag">
                                          <span
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  onRemove(tag);
                                              }}
                                          >
                                              <svg
                                                  width={12}
                                                  height={12}
                                                  viewBox="0 0 12 12"
                                                  fill="none"
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  style={{ display: "block" }}
                                              >
                                                  <path
                                                      d="M2 2L10 10M10 2L2 10"
                                                      stroke="#454547"
                                                      strokeWidth="1.5"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                  />
                                              </svg>
                                          </span>
                                      </div>
                                  )}
                              </span>
                          ))
                        : selectedOption || (
                              <span className="searchable-placeholder">{placeholder}</span>
                          )}
                </div>
                <span className={`searchable-chevron-icon ${isOpen ? "open" : ""}`}>
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                        <path
                            d="M4 6L8 10L12 6"
                            stroke="#454547"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>
            {isOpen && (
                <div className="searchable-dropdown-list-container">
                    <div className="searchable-search-container">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="searchable-search-input"
                        />
                        <div className="searchable-search-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M7.33333 12.6667 10.2789 12.6667 12.6667 10.2789 12.6667 7.33333 12.6667 4.38781 10.2789 2 7.33333 2 4.38781 2 2 4.38781 2 7.33333 2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                                    stroke="#8B8B8C"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M14 14L11.1 11.1"
                                    stroke="#8B8B8C"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="searchable-options-list">
                        {canCreateNew && (
                            <div
                                className="searchable-dropdown-item searchable-add-new-option"
                                onClick={handleAddNewClick}
                            >
                                + {addNewLabel} "{searchTerm}"
                            </div>
                        )}
                        {filteredOptions.length === 0 && !canCreateNew ? (
                            <div className="searchable-dropdown-item searchable-no-results">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={getOptionLabel(option)}
                                    className="searchable-dropdown-item"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <span
                                        style={{ flex: 1, cursor: 'pointer' }}
                                        onClick={() => handleSelect(option)}
                                    >
                                        {getOptionLabel(option)}
                                    </span>
                                    {onDeleteOption && (
                                        <span
                                            className="searchable-delete-option"
                                            title="Delete location"
                                            style={{ marginLeft: 8, cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Delete icon clicked for option:', option);
                                                onDeleteOption(option);
                                            }}
                                        >
                                            <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                                                <path d="M2 4h10M4.5 4V3a1.5 1.5 0 011.5-1.5h2.5A1.5 1.5 0 0110 3v1m1 0v8a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 013 12V4h8z" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
