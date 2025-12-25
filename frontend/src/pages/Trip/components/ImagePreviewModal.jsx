/**
 * ImagePreviewModal Component
 * 
 * Full-screen modal for previewing images with zoom capability
 */

import React, { useState, useCallback } from 'react';
import { X, Plus, Minus, RotateCw } from 'lucide-react';
import './ImagePreviewModal.css';

const ImagePreviewModal = ({ imageSrc, title, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  return (
    <div className="image-preview-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="preview-container">
            <img
              src={imageSrc}
              alt={title}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="controls">
            <button
              className="btn-control small"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
            <button
              className="btn-control small"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <div className="separator"></div>
            <button
              className="btn-control small"
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
            <button
              className="btn-control small secondary"
              onClick={handleReset}
              title="Reset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
