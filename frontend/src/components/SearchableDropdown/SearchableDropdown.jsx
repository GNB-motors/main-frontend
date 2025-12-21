import React, { useState, useRef, useEffect } from "react";
import "./SearchableDropdown.css";

const SearchableDropdown = ({
    options = [],
    selectedOption = "",
    selectedOptions = [],
    onSelect,
    onAddNew,
    onRemove,
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
        if (searchTerm && !options.includes(searchTerm)) {
            onAddNew(searchTerm);
            setSearchTerm("");
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

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canCreateNew =
        searchTerm && !options.some((opt) => opt.toLowerCase() === searchTerm.toLowerCase());

    return (
        <div className="searchable-dropdown-container" ref={dropdownRef}>
            <div className="searchable-dropdown-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="searchable-dropdown-content">
                    {selectedOptions && selectedOptions.length > 0
                        ? selectedOptions.map((tag) => (
                              <span key={tag} className="searchable-selected-tag">
                                  {tag}
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
                                    d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
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
                                    key={option}
                                    className="searchable-dropdown-item"
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
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
