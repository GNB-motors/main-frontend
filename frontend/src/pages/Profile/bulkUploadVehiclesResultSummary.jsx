import React from 'react';

/** Post-submit upload summary: created/error counts plus the first errors. */
const BulkUploadVehiclesResultSummary = ({ result }) => {
  if (!result) return null;

  const created = result.createdCount ?? result.data?.createdCount ?? 0;
  const errors = result.errors ?? result.data?.errors ?? [];

  const handleDownloadErrors = () => {
    if (errors.length === 0) return;

    const csvHeader = 'Registration Number,Error\n';
    const csvContent = errors
      .map((err) => {
        const reg = err.registrationNumber || err.registration_no || '-';
        const msg = err.error || err.message || JSON.stringify(err);
        return `"${reg}","${msg.replace(/"/g, '""')}"`;
      })
      .join('\n');

    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'upload_errors.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="upload-result-summary" style={{ marginTop: 16 }}>
      <div
        style={{ padding: 12, background: '#fff', border: '1px solid #e6e7eb', borderRadius: 8 }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Upload Summary</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            Created: <strong>{created}</strong>
          </div>
          <div>
            Errors: <strong>{errors.length}</strong>
          </div>
        </div>
        {errors.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>Errors</div>
              <button
                type="button"
                onClick={handleDownloadErrors}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download Errors CSV
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.slice(0, 10).map((err, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <strong>{err.registrationNumber || err.registration_no || '-'}</strong>:{' '}
                  {err.error || err.message || JSON.stringify(err)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadVehiclesResultSummary;
