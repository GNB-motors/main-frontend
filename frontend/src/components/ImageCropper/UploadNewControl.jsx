import React from 'react';

const UploadNewControl = ({ handleUploadNew }) => (
  <div className="upload-controls">
    <button className="upload-new-button" onClick={handleUploadNew}>
      <svg width="14.5" height="15.5" viewBox="0 0 15 16" fill="none">
        <path
          d="M10 5L7.5 2.5L5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 2.5V10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 10.5V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Upload new</span>
    </button>
  </div>
);

export default UploadNewControl;
