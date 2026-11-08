import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsService } from '../../ReportsService';

const MODULES = [
  { value: 'DRIVER', label: 'Driver' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'TRIP', label: 'Trip & Mileage' },
  { value: 'ADBLUE', label: 'AdBlue' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'OTHER', label: 'Other' },
];

export default function RequestFieldModal({
  isOpen,
  onClose,
  onSuccess,
  initialModuleName = 'OTHER',
}) {
  const [fieldName, setFieldName] = useState('');
  const [module, setModule] = useState(initialModuleName);
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [exampleOutput, setExampleOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fieldName.trim() || !description.trim() || !reason.trim()) {
      setError('Please fill in the field name, description, and business reason.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await ReportsService.createFieldRequest({
        fieldName: fieldName.trim(),
        module,
        description: description.trim(),
        reason: reason.trim(),
        exampleOutput: exampleOutput.trim(),
      });
      toast.success('Field request submitted successfully for review.');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to submit field request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-backdrop" role="dialog" aria-modal="true">
      <div className="custom-modal-content">
        <div className="custom-modal-header">
          <h3>Request Additional Field</h3>
          <button type="button" className="col-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="custom-modal-body">
            {error ? (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="builder-field-group">
              <label htmlFor="rf-field-name">Field Name *</label>
              <input
                id="rf-field-name"
                aria-label="Field Name"
                type="text"
                className="builder-input"
                placeholder="e.g. Over-Speed Violations Count, Fuel Pump State"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
              />
            </div>

            <div className="builder-field-group">
              <label htmlFor="rf-module">Related Module *</label>
              <SearchableSelect
                id="rf-module"
                aria-label="Related Module"
                className="builder-select"
                value={module}
                onChange={(e) => setModule(e.target.value)}
              >
                {MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </SearchableSelect>
            </div>

            <div className="builder-field-group">
              <label htmlFor="rf-description">Information Description *</label>
              <textarea
                id="rf-description"
                aria-label="Information Description"
                className="builder-textarea"
                rows={3}
                placeholder="Describe what data this field represents and how it should be captured."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="builder-field-group">
              <label htmlFor="rf-reason">Why is this field required? *</label>
              <textarea
                id="rf-reason"
                aria-label="Why is this field required?"
                className="builder-textarea"
                rows={2}
                placeholder="Explain the business reporting or operational need."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="builder-field-group">
              <label htmlFor="rf-example-output">Example Expected Output (Optional)</label>
              <input
                id="rf-example-output"
                aria-label="Example Expected Output (Optional)"
                type="text"
                className="builder-input"
                placeholder="e.g. '3 incidents' or 'West Bengal'"
                value={exampleOutput}
                onChange={(e) => setExampleOutput(e.target.value)}
              />
            </div>
          </div>

          <div className="custom-modal-footer">
            <button
              type="button"
              className="btn-secondary-action"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={submitting}>
              <Send size={15} />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
