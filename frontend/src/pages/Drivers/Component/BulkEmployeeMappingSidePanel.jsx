import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Check } from "lucide-react";
import ChevronIcon from "../../Trip/assets/ChevronIcon.jsx";
import "./BulkEmployeeMappingSidePanel.css";

const FIELD_TARGETS = [
  { key: "name", label: "Name", required: true, description: "Full name (will be split into first/last)" },
  { key: "phone", label: "Phone Number", required: true, description: "Mobile number (E.164 format)" },
  { key: "email", label: "Email", required: false, description: "Email address (optional)" },
  { key: "role", label: "Role", required: false, description: "DRIVER or MANAGER (defaults to DRIVER)" },
  { key: "location", label: "Location", required: false, description: "Location (defaults to Kolkata)" },
];

const BulkEmployeeMappingSidePanel = ({ isOpen, fileColumns, onSave, onClose }) => {
  const [mapping, setMapping] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const mappingBodyRef = useRef(null);

  useEffect(() => {
    if (isOpen && fileColumns && fileColumns.length > 0) {
      // Auto-detect common column names
      const autoMapping = {};
      const lowerColumns = fileColumns.map((col) => col.toLowerCase());

      FIELD_TARGETS.forEach((target) => {
        const key = target.key.toLowerCase();
        // Try exact match first
        const exactIndex = lowerColumns.indexOf(key);
        if (exactIndex !== -1) {
          autoMapping[target.key] = fileColumns[exactIndex];
        } else {
          // Try partial matches
          const partialMatch = fileColumns.find((col) => {
            const lower = col.toLowerCase();
            if (target.key === "name" && (lower.includes("name") || lower.includes("full"))) return true;
            if (target.key === "phone" && (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact"))) return true;
            if (target.key === "email" && lower.includes("email")) return true;
            if (target.key === "role" && lower.includes("role")) return true;
            if (target.key === "location" && (lower.includes("location") || lower.includes("city") || lower.includes("base"))) return true;
            return false;
          });
          if (partialMatch) {
            autoMapping[target.key] = partialMatch;
          }
        }
      });

      setMapping(autoMapping);
      setSelectedOptions(autoMapping);
    }
  }, [isOpen, fileColumns]);

  const handleMappingChange = (targetKey, fileColumn) => {
    const newMapping = {
      ...mapping,
      [targetKey]: fileColumn || undefined,
    };
    const newSelectedOptions = {
      ...selectedOptions,
      [targetKey]: fileColumn || "",
    };

    setMapping(newMapping);
    setSelectedOptions(newSelectedOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required mappings
    const requiredFields = FIELD_TARGETS.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !mapping[f.key]);

    if (missing.length > 0) {
      alert(`Please map the following required fields: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    onSave(mapping);
  };

  const getDisabledOptions = (currentFieldKey) => {
    return Object.entries(selectedOptions)
      .filter(([fieldKey, selected]) => fieldKey !== currentFieldKey && selected)
      .map(([_, selected]) => selected);
  };

  const scrollToDropdown = (dropdownElement) => {
    if (!mappingBodyRef.current || !dropdownElement) return;

    let rowElement = dropdownElement.parentElement;
    while (rowElement && !rowElement.classList.contains('bem-matching-row')) {
      rowElement = rowElement.parentElement;
    }

    if (!rowElement) return;

    const container = mappingBodyRef.current;
    const containerRect = container.getBoundingClientRect();
    const rowRect = rowElement.getBoundingClientRect();

    const dropdownHeight = 200;
    const padding = 20;

    const rowTopRelativeToContainer = rowRect.top - containerRect.top + container.scrollTop;
    const rowBottomRelativeToContainer = rowRect.bottom - containerRect.top + container.scrollTop;
    const dropdownBottom = rowBottomRelativeToContainer + dropdownHeight;

    const visibleTop = container.scrollTop;
    const visibleBottom = container.scrollTop + containerRect.height;

    if (dropdownBottom > visibleBottom) {
      const targetScroll = Math.min(
        dropdownBottom - containerRect.height + padding,
        container.scrollHeight - containerRect.height
      );
      container.scrollTop = targetScroll;
    } else if (rowTopRelativeToContainer < visibleTop) {
      const targetScroll = Math.max(0, rowTopRelativeToContainer - padding);
      container.scrollTop = targetScroll;
    }
  };

  const MatchDropdown = ({ options, selectedOption, onSelect, disabledOptions = [], placeholder = "Select option", onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSelect = (option) => {
      onSelect(option === "__none__" ? "" : option);
      setIsOpen(false);
    };

    const handleToggle = () => {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen && onOpen && dropdownRef.current) {
        setTimeout(() => {
          onOpen(dropdownRef.current);
        }, 0);
      }
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
    }, []);

    return (
      <div className="bem-dropdown-container" ref={dropdownRef}>
        <div className="bem-dropdown-header" onClick={handleToggle}>
          <span className={selectedOption ? "bem-selected-text" : "bem-placeholder"}>
            {selectedOption || placeholder}
          </span>
          <span className={`bem-chevron-icon ${isOpen ? "bem-open" : ""}`}>
            <ChevronIcon size={16} />
          </span>
        </div>
        {isOpen && (
          <div className="bem-dropdown-list-container">
            <div className="bem-options-list">
              <div
                className="bem-dropdown-item bem-none-option"
                onClick={() => handleSelect("__none__")}
              >
                None
              </div>
              {options.map((option) => {
                const isDisabled = disabledOptions.includes(option);
                return (
                  <div
                    key={option}
                    className={`bem-dropdown-item ${isDisabled ? "bem-disabled-option" : ""}`}
                    onClick={() => !isDisabled && handleSelect(option)}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="bem-sidepanel-overlay">
      <div className="bem-sidepanel-container">
        <div className="bem-sidepanel-header">
          <h3>Map File Columns</h3>
          <button onClick={onClose} className="bem-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="bem-matching-container">
          <div className="bem-matching-header">
            <span className="bem-matching-header-text">
              Map each column from your uploaded CSV file to the corresponding
              employee field. This ensures accurate employee import and alignment
              with your employee system.
            </span>
          </div>

          <div className="bem-matching-body" ref={mappingBodyRef}>
            <div className="bem-column-titles">
              <span className="bem-column-title">EMPLOYEE FIELDS</span>
              <span></span>
              <span className="bem-column-title">CSV COLUMNS</span>
            </div>

            {FIELD_TARGETS.map((target) => (
              <div className="bem-matching-row" key={target.key}>
                <div className="bem-employee-column">
                  <span className="bem-column-label">
                    {target.label}
                    {target.required && <span className="bem-required">*</span>}
                  </span>
                </div>
                <span className="bem-arrow">
                  →
                </span>
                <div className="bem-csv-column">
                  <MatchDropdown
                    options={fileColumns}
                    selectedOption={selectedOptions[target.key] || ""}
                    onSelect={(csvColumn) => handleMappingChange(target.key, csvColumn)}
                    disabledOptions={getDisabledOptions(target.key)}
                    placeholder="Choose column"
                    onOpen={scrollToDropdown}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bem-sidepanel-actions">
          <button type="button" onClick={onClose} className="bem-btn-secondary">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} className="bem-btn-primary">
            <Check size={16} />
            Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEmployeeMappingSidePanel;