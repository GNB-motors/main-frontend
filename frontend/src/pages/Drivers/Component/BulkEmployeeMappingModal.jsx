import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import "./BulkEmployeeMappingModal.css";

const FIELD_TARGETS = [
  { key: "name", label: "Name", required: true, description: "Full name (will be split into first/last)" },
  { key: "phone", label: "Phone Number", required: true, description: "Mobile number (E.164 format)" },
  { key: "email", label: "Email", required: false, description: "Email address (optional)" },
  { key: "role", label: "Role", required: false, description: "DRIVER or MANAGER (defaults to DRIVER)" },
  { key: "location", label: "Location", required: false, description: "Location (defaults to Kolkata)" },
];

const BulkEmployeeMappingModal = ({ isOpen, fileColumns, onSave, onClose }) => {
  const [mapping, setMapping] = useState({});

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
    }
  }, [isOpen, fileColumns]);

  const handleMappingChange = (targetKey, fileColumn) => {
    setMapping((prev) => ({
      ...prev,
      [targetKey]: fileColumn || undefined,
    }));
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

  if (!isOpen) return null;

  return (
    <div className="mapping-modal-overlay">
      <div className="mapping-modal-content">
        <div className="mapping-modal-header">
          <h3>Map File Columns</h3>
          <button onClick={onClose} className="mapping-close-btn">
            <X size={20} />
          </button>
        </div>

        <p className="mapping-description">
          Map your file columns to the required employee fields. Required fields must be mapped.
        </p>

        <form onSubmit={handleSubmit} className="mapping-form">
          {FIELD_TARGETS.map((target) => (
            <div key={target.key} className="mapping-field-group">
              <label htmlFor={target.key}>
                {target.label}
                {target.required && <span className="required">*</span>}
                <span className="field-description">{target.description}</span>
              </label>
              <select
                id={target.key}
                value={mapping[target.key] || ""}
                onChange={(e) => handleMappingChange(target.key, e.target.value)}
                required={target.required}
                className="mapping-select"
              >
                <option value="">-- Select column --</option>
                {fileColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="mapping-modal-actions">
            <button type="button" onClick={onClose} className="mapping-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="mapping-btn-primary">
              <Check size={16} />
              Apply Mapping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEmployeeMappingModal;

