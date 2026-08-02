import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import { MaintenanceService } from '../MaintenanceService.jsx';

/**
 * Small modal that lives on top of the Add Service / Add Repair page. Saves a
 * new workshop / service-type / repair-type to the org's options list and
 * returns the saved value via `onSaved(value)` so the parent can select it.
 */
const AddOptionModal = ({ open, onClose, category, title, placeholder, initialValue = '', onSaved }) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Pre-fill with whatever the user typed in the dropdown's search box so
      // they don't retype it inside the modal.
      setValue(initialValue || '');
      setSubmitting(false);
    }
  }, [open, initialValue]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      toast.error('Please enter a value');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      await MaintenanceService.addOption(token, category, v);
      toast.success('Added');
      onSaved?.(v);
      onClose?.();
    } catch (err) {
      toast.error(err?.detail || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 420,
          borderRadius: 14,
          boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 18 }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              color: '#0f172a',
              outline: 'none',
            }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOptionModal;
