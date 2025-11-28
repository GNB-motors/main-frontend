import React from "react";
import { X, Save, FileText } from "lucide-react";
import "./EditRowModal.css";

const EditRowModal = ({ isOpen, row, columns, onSave, onClose, errors, rawData }) => {
  if (!isOpen || !row) return null;

  const [formData, setFormData] = React.useState(row);
  const [showRaw, setShowRaw] = React.useState(false);

  React.useEffect(() => {
    setFormData(row);
    setShowRaw(false);
  }, [row]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Row Details</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        {errors && errors.length > 0 && (
          <div className="modal-errors">
            <h4>Validation Errors:</h4>
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {rawData && (
          <div className="raw-data-toggle">
            <button
              type="button"
              className="tertiary"
              onClick={() => setShowRaw((prev) => !prev)}
            >
              <FileText size={16} />
              {showRaw ? "Hide Original File Data" : "Show Original File Data"}
            </button>
            {showRaw && (
              <pre className="raw-json">{JSON.stringify(rawData, null, 2)}</pre>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {columns.map((col) => (
            <div key={col.key} className="form-group">
              <label htmlFor={col.key}>
                {col.label}
                {col.required && <span className="required">*</span>}
              </label>
              <input
                id={col.key}
                type="text"
                value={formData[col.key] || ""}
                placeholder={col.placeholder}
                onChange={(e) => handleChange(col.key, e.target.value)}
              />
            </div>
          ))}
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
            <button type="submit" className="primary">
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRowModal;