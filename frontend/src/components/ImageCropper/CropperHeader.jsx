import React from 'react';

const CropperHeader = ({ title, handleCancel }) => (
  <div className="cropper-header">
    <div className="header-title-container">
      <div className="cropper-title">{title}</div>
    </div>
    <button className="close-button" onClick={handleCancel} aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M12 4L4 12"
          stroke="#121214"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 4L12 12"
          stroke="#121214"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
);

export default CropperHeader;
