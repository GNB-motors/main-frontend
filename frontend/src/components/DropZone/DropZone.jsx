/**
 * DropZone Component
 * 
 * Reusable drag-and-drop component for file uploads
 * Provides visual feedback during drag operations
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import './DropZone.css';

const DropZone = ({
  onDrop,
  acceptedFormats = ['image/*'],
  maxFiles = 1,
  multiple = false,
  label = 'Drop files here',
  isCompact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback(
    (files) => {
      // Filter files by accepted formats
      const validFiles = files.filter(file => {
        return acceptedFormats.some(format => {
          if (format === 'image/*') {
            return file.type.startsWith('image/');
          }
          return file.type === format;
        });
      });

      if (validFiles.length === 0) {
        alert('No valid files selected. Please upload images.');
        return;
      }

      if (!multiple && validFiles.length > maxFiles) {
        alert(`Please upload no more than ${maxFiles} file(s)`);
        return;
      }

      onDrop(validFiles);
    },
    [acceptedFormats, maxFiles, multiple, onDrop]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''} ${isCompact ? 'compact' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileInputChange}
        accept={acceptedFormats.join(',')}
        style={{ display: 'none' }}
      />

      <div className="dropzone-content">
        <Upload size={isCompact ? 20 : 32} className="upload-icon" />
        <p className="dropzone-label">{label}</p>
        {!isCompact && <p className="dropzone-hint">Or click to select files</p>}
      </div>
    </div>
  );
};

export default DropZone;
