import React from 'react';

/** Progress bar shown while a bulk upload's chunks are being sent. */
const BulkUploadProgress = ({ uploadProgress }) => (
  <div
    className="upload-progress-container"
    style={{
      marginTop: '20px',
      padding: '16px',
      background: 'var(--surface-color, #fff)',
      border: '1px solid var(--border-color, #eaeaea)',
      borderRadius: '8px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontWeight: '500', color: 'var(--text-color, #333)' }}>Uploading...</span>
      <span style={{ color: 'var(--text-secondary, #666)' }}>
        {uploadProgress.processed} / {uploadProgress.total}
      </span>
    </div>
    <div
      style={{
        width: '100%',
        height: '8px',
        background: 'var(--bg-secondary, #f0f0f0)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'var(--primary-color, #0056b3)',
          width: `${(uploadProgress.processed / uploadProgress.total) * 100}%`,
          transition: 'width 0.3s ease',
        }}
      ></div>
    </div>
  </div>
);

export default BulkUploadProgress;
