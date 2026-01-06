/**
 * ImageViewer Component
 * 
 * Display image with zoom and rotation transformations
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye } from 'lucide-react';
import './ImageViewer.css';

const ImageViewer = ({ imageSource, zoom = 1, rotation = 0, onPreviewClick }) => {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    if (zoom <= 1) return; // Only pan when zoomed in
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle mouse move for panning
  const handleMouseMove = (e) => {
    if (!isPanning || !containerRef.current) return;

    const container = containerRef.current;
    const maxPanX = (container.offsetWidth * zoom - container.offsetWidth) / 2;
    const maxPanY = (container.offsetHeight * zoom - container.offsetHeight) / 2;

    let newX = e.clientX - startPan.x;
    let newY = e.clientY - startPan.y;

    // Clamp pan values
    newX = Math.max(-maxPanX, Math.min(maxPanX, newX));
    newY = Math.max(-maxPanY, Math.min(maxPanY, newY));

    setPan({ x: newX, y: newY });
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset pan when zoom or rotation changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [zoom, rotation]);

  return (
    <div
      className="image-viewer"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: zoom > 1 && isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
    >
      <img
        src={imageSource}
        alt="Weight Slip"
        className="viewer-image"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center'
        }}
      />
      {onPreviewClick && (
        <button
          className="btn-preview-image"
          onClick={onPreviewClick}
          title="Open Full Preview"
        >
          <Eye size={24} />
        </button>
      )}
    </div>
  );
};

export default ImageViewer;
