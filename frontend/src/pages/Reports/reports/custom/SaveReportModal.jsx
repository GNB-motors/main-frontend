import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsService } from '../../ReportsService';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General Fleet' },
  { value: 'FUEL', label: 'Fuel Management' },
  { value: 'DRIVER', label: 'Driver Analytics' },
  { value: 'TRIP', label: 'Trips & Mileage' },
  { value: 'ADBLUE', label: 'AdBlue Telemetry' },
  { value: 'COMPLIANCE', label: 'Vehicle Compliance' },
];

export default function SaveReportModal({
  isOpen,
  onClose,
  onSuccess,
  initialConfig = {},
  currentSavedId = null,
}) {
  const [name, setName] = useState(initialConfig.name || '');
  const [description, setDescription] = useState(initialConfig.description || '');
  const [category, setCategory] = useState(initialConfig.category || 'GENERAL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialConfig.name) setName(initialConfig.name);
    if (initialConfig.description) setDescription(initialConfig.description);
    if (initialConfig.category) setCategory(initialConfig.category);
  }, [initialConfig]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Report name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        dataset: initialConfig.dataset,
        fields: initialConfig.fields,
        filters: initialConfig.filters,
        sorting: initialConfig.sorting,
        aggregations: initialConfig.aggregations,
      };

      if (currentSavedId) {
        await ReportsService.updateSavedCustomReport(currentSavedId, payload);
        toast.success('Custom report updated and resubmitted for approval.');
      } else {
        const saved = await ReportsService.createSavedCustomReport(payload);
        toast.success('Custom report submitted for Super Admin approval.');
        onSuccess?.(saved._id || saved.id);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to submit report configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="custom-modal-backdrop" role="dialog" aria-modal="true">
      <div className="custom-modal-content">
        <div className="custom-modal-header">
          <h3>
            {currentSavedId
              ? 'Update & Resubmit Custom Report'
              : 'Submit Custom Report for Approval'}
          </h3>
          <button type="button" className="col-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="custom-modal-body">
            {error ? (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 p-2.5 rounded-md flex items-start gap-2">
              <ShieldCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Super Admin Approval Required:</strong> Submitted custom reports are
                reviewed by the Super Admin before they can be officially executed or shared. You
                can track their live status under Requested Reports.
              </div>
            </div>

            <div className="builder-field-group">
              <label htmlFor="sr-report-name">Report Name *</label>
              <input
                id="sr-report-name"
                aria-label="Report Name"
                type="text"
                className="builder-input"
                placeholder="e.g. Monthly High Fuel Spenders, West Bengal Fleet Compliance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="builder-field-group">
              <label htmlFor="sr-category">Category</label>
              <SearchableSelect
                id="sr-category"
                aria-label="Category"
                className="builder-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </SearchableSelect>
            </div>

            <div className="builder-field-group">
              <label htmlFor="sr-description">Description (Optional)</label>
              <textarea
                id="sr-description"
                aria-label="Description (Optional)"
                className="builder-textarea"
                rows={3}
                placeholder="Add notes about what this report is used for or who reads it."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded">
              <strong>Notice:</strong> This submits the dynamic query definition (dataset, fields,
              filters, aggregations). When executed after approval, it will fetch real-time live
              fleet data.
            </div>
          </div>

          <div className="custom-modal-footer">
            <button
              type="button"
              className="btn-secondary-action"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={saving}>
              <Send size={15} />
              {saving
                ? 'Submitting...'
                : currentSavedId
                  ? 'Update & Resubmit'
                  : 'Submit for Super Admin Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
