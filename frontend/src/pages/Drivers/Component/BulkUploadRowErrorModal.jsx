import React from 'react';
import { X } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

const formatFieldLabel = (field) =>
  field.charAt(0).toUpperCase() +
  field
    .slice(1)
    .replace(/([A-Z])/g, ' $1')
    .trim();

/**
 * Modal shown when a reviewer clicks an invalid row in the review table:
 * employee details, the validation errors, and the original file data.
 */
const BulkUploadRowErrorModal = ({ selected, onClose }) => {
  if (!selected) return null;

  const { row, error, index } = selected;

  return (
    <div className="mapping-modal-overlay" onClick={onClose}>
      <div className="mapping-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mapping-modal-header">
          <h3>Row {index + 1} - Validation Errors</h3>
          <button onClick={onClose} className="mapping-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              Employee Details
            </h4>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 16px',
              }}
            >
              <div style={{ fontWeight: '600', color: '#6b7280' }}>Name:</div>
              <div>
                {row.firstName} {row.lastName}
              </div>
              <div style={{ fontWeight: '600', color: '#6b7280' }}>Email:</div>
              <div>{row.email || '-'}</div>
              <div style={{ fontWeight: '600', color: '#6b7280' }}>Phone:</div>
              <div>{row.mobileNumber || '-'}</div>
              <div style={{ fontWeight: '600', color: '#6b7280' }}>Role:</div>
              <div>{row.role}</div>
              <div style={{ fontWeight: '600', color: '#6b7280' }}>Location:</div>
              <div>{row.location}</div>
            </div>
          </div>

          <div>
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#dc2626',
              }}
            >
              Validation Errors
            </h4>
            {Object.keys(error).length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  color: '#166534',
                  fontSize: '14px',
                }}
              >
                No errors found. This row is valid.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(error).map(([field, message]) => (
                  <div
                    key={field}
                    style={{
                      padding: '12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                      {formatFieldLabel(field)}
                    </div>
                    <div style={{ color: '#b91c1c' }}>{message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {row._rawRow && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Original File Data
              </h4>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(row._rawRow, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mapping-modal-actions">
          <NewButton variant="secondary" size="md" type="button" text="Close" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default BulkUploadRowErrorModal;
