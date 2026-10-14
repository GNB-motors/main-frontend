import React from 'react';

/** Zoom out / zoom level / zoom in, and the two rotate buttons. */
const CropperControls = ({
  zoom,
  handleZoomOut,
  handleZoomIn,
  handleRotateRight,
  handleRotateLeft,
}) => (
  <div className="controls-container">
    <div className="zoom-controls">
      <button
        className="icon-container"
        onClick={handleZoomOut}
        disabled={zoom <= 50}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <span className="zoom-value">{zoom}%</span>
      <button
        className="icon-container"
        onClick={handleZoomIn}
        disabled={zoom >= 200}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 5V15M5 10H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>

    <div className="rotate-controls">
      <button className="icon-container" onClick={handleRotateRight} aria-label="Rotate right">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M14.5 5.5C13.2 4.2 11.4 3.5 9.5 3.5C5.9 3.5 3 6.4 3 10C3 13.6 5.9 16.5 9.5 16.5C12.5 16.5 15 14.4 15.7 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 5.5H14.5V8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button className="icon-container" onClick={handleRotateLeft} aria-label="Rotate left">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5.5 5.5C6.8 4.2 8.6 3.5 10.5 3.5C14.1 3.5 17 6.4 17 10C17 13.6 14.1 16.5 10.5 16.5C7.5 16.5 5 14.4 4.3 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M8 5.5H5.5V8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
);

export default CropperControls;
