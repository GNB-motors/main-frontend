import React from "react";
import { X, Download } from "lucide-react";
import "./BulkEmployeeMappingSidePanel.css";

const BulkUploadResultsSidePanel = ({
  isOpen,
  uploadResult,
  passwordMap,
  onDownloadCredentials,
  onClose
}) => {
  if (!isOpen || !uploadResult) return null;

  const createdCount = uploadResult.createdCount || 0;
  const errorCount = uploadResult.errorCount || (uploadResult.errors?.length || 0);

  return (
    <div className="bem-sidepanel-overlay" onClick={onClose}>
      <div className="bem-sidepanel-container" onClick={(e) => e.stopPropagation()}>
        <div className="bem-sidepanel-header">
          <h3>Upload Results</h3>
          <button onClick={onClose} className="bem-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="bem-matching-container">
          <div className="bem-matching-body" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280',
                fontFamily: 'Inter'
              }}>
                <strong>{createdCount}</strong> employees created,{' '}
                <strong>{errorCount}</strong> errors
              </p>
            </div>

            {uploadResult.created && uploadResult.created.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: 'Inter'
                }}>
                  Created Employees
                </h4>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    fontFamily: 'Inter'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151' }}>Phone</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151' }}>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.created.map((created) => {
                        const password = passwordMap.get(created.clientRowId) || 'N/A';
                        return (
                          <tr key={created.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px', color: '#111827' }}>
                              {created.firstName} {created.lastName}
                            </td>
                            <td style={{ padding: '12px', color: '#111827' }}>
                              {created.email || '-'}
                            </td>
                            <td style={{ padding: '12px', color: '#111827' }}>
                              {created.mobileNumber}
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#111827' }}>
                              {password}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={onDownloadCredentials}
                  className="bem-btn-primary"
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  <Download size={16} />
                  Download Credentials CSV
                </button>
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#dc2626',
                  fontFamily: 'Inter'
                }}>
                  Errors
                </h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {uploadResult.errors.map((error, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Inter'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: '#991b1b'
                      }}>
                        Row {error.index + 1}: {error.code || 'ERROR'}
                      </div>
                      <div style={{ color: '#b91c1c' }}>{error.error}</div>
                      {error.field && (
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginTop: '4px'
                        }}>
                          Field: {error.field}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bem-sidepanel-actions">
          <button
            type="button"
            onClick={onClose}
            className="bem-btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadResultsSidePanel;