import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import './ImageCropperModal.css';

const MIN_ZOOM_PERCENT = 50;
const MAX_ZOOM_PERCENT = 200;
const DEFAULT_MAX_OUTPUT_MB = 4.5;

const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * ImageCropperModal - A reusable image cropping component
 * @param {number} aspectRatio - Aspect ratio for the crop box. Use 0 for free crop (no aspect ratio restriction)
 * @param {boolean} circularCrop - Enable circular crop mode (forces 1:1 aspect ratio)
 */
const ImageCropperModal = ({
  src,
  onCropComplete,
  onCancel,
  onImageUpdate,
  aspectRatio = 9 / 16,
  title = 'Crop image',
  circularCrop = false,
  contextId = 'default',
  isOpen,
  isUploading = false,
  maxOutputSizeMB = DEFAULT_MAX_OUTPUT_MB
}) => {
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const [zoomPercent, setZoomPercent] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const clearPendingPreview = useCallback(() => {
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl);
    }
  }, [pendingImageUrl]);

  useEffect(() => {
    return () => {
      clearPendingPreview();
    };
  }, [clearPendingPreview]);

  useEffect(() => {
    if (isOpen) {
      setCurrentSrc(src);
      setErrorMessage('');
      setZoomPercent(100);
      setRotation(0);
      setImageLoaded(false);
    } else {
      clearPendingPreview();
      setPendingFile(null);
      setPendingImageUrl(null);
      if (containerRef.current) {
        containerRef.current.classList.remove('circular-mode');
      }
    }
  }, [src, isOpen, contextId, clearPendingPreview]);

  const applyCircularDecorations = useCallback(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    if (!circularCrop) {
      root.classList.remove('circular-mode');
      return;
    }

    root.classList.add('circular-mode');
  }, [circularCrop]);

  const handleZoomChange = (delta) => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      return;
    }

    const targetZoom = Math.min(Math.max(zoomPercent + delta, MIN_ZOOM_PERCENT), MAX_ZOOM_PERCENT);
    if ((delta > 0 && zoomPercent >= MAX_ZOOM_PERCENT) || (delta < 0 && zoomPercent <= MIN_ZOOM_PERCENT)) {
      setZoomPercent(targetZoom);
      return;
    }

    cropper.zoom(delta > 0 ? 0.1 : -0.1);
    setZoomPercent(targetZoom);
  };

  const handleRotate = (angle) => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      return;
    }

    cropper.rotate(angle);
    setRotation((prev) => prev + angle);
  };

  const handleUploadNew = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size should be less than 10MB.');
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    clearPendingPreview();

    setPendingFile(file);
    setPendingImageUrl(nextUrl);
    setCurrentSrc(nextUrl);
    setImageLoaded(false);
    setZoomPercent(100);
    setRotation(0);
    setErrorMessage('');
  };

  const resetStateAndClose = () => {
    setZoomPercent(100);
    setRotation(0);
    setImageLoaded(false);
    setPendingFile(null);
    clearPendingPreview();
    setPendingImageUrl(null);
    setErrorMessage('');
    if (containerRef.current) {
      containerRef.current.classList.remove('circular-mode');
    }
    onCancel();
  };

  const compressIfNeeded = (blob, resolve) => {
    const currentSizeMB = blob.size / (1024 * 1024);
    if (currentSizeMB <= maxOutputSizeMB) {
      resolve(blob);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const scaleFactor = Math.sqrt(maxOutputSizeMB / currentSizeMB);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(image.width * scaleFactor);
      canvas.height = Math.floor(image.height * scaleFactor);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((compressedBlob) => {
        resolve(compressedBlob || blob);
      }, 'image/jpeg', 0.75);
    };

    image.onerror = () => resolve(blob);
    image.src = URL.createObjectURL(blob);
  };

  const applyCircularMask = (canvas) => {
    if (!circularCrop) {
      return canvas;
    }

    const size = Math.min(canvas.width, canvas.height);
    const masked = document.createElement('canvas');
    masked.width = size;
    masked.height = size;

    const ctx = masked.getContext('2d');
    if (!ctx) {
      return canvas;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(canvas, (size - canvas.width) / 2, (size - canvas.height) / 2);
    ctx.restore();

    return masked;
  };

  const handleCropApply = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');

      const outputCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (!outputCanvas) {
        setErrorMessage('Unable to crop this image. Please try a different file.');
        setIsProcessing(false);
        return;
      }

      const canvasToExport = applyCircularMask(outputCanvas);

      const blob = await new Promise((resolve, reject) => {
        canvasToExport.toBlob((result) => {
          if (!result) {
            reject(new Error('Failed to generate image data.'));
            return;
          }
          compressIfNeeded(result, resolve);
        }, 'image/jpeg', 0.85);
      });

      if (pendingFile && onImageUpdate && pendingImageUrl) {
        onImageUpdate(pendingImageUrl, pendingFile);
        clearPendingPreview();
        setPendingFile(null);
        setPendingImageUrl(null);
      }

      onCropComplete(blob);
      setIsProcessing(false);
    } catch (error) {
      console.error('Image crop failed', error);
      setErrorMessage('Something went wrong while processing the image. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCropReady = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      return;
    }

    try {
      const imageData = cropper.getImageData();
      if (imageData?.naturalWidth) {
        setZoomPercent(Math.round((imageData.zoom || 1) * 100));
      }
    } catch (error) {
      setZoomPercent(100);
    }

    setImageLoaded(true);
    applyCircularDecorations();
  }, [applyCircularDecorations]);

  const handleZoomEvent = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      return;
    }
    try {
      const imageData = cropper.getImageData();
      if (imageData && imageData.naturalWidth) {
        const ratio = imageData.width / imageData.naturalWidth;
        setZoomPercent(Math.round(ratio * 100));
      }
      applyCircularDecorations();
    } catch (error) {
      // ignore zoom sync errors
    }
  };

  const displayedRotation = ((rotation % 360) + 360) % 360;

  return (
    <Dialog
      open={Boolean(isOpen)}
      onClose={resetStateAndClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: 820,
          maxWidth: '90vw'
        }
      }}
      aria-labelledby="image-cropper-dialog"
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          {title}
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={resetStateAndClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box ref={containerRef} className="gnb-cropper-modal">
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="gnb-cropper-hidden-input"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadNew}
            >
              Upload new
            </Button>
          </Stack>

          <Box className="gnb-cropper-stage">
            <Cropper
              ref={cropperRef}
              src={currentSrc || ''}
              style={{ height: 420, width: '100%' }}
              viewMode={1}
              dragMode="move"
              aspectRatio={circularCrop ? 1 : (aspectRatio === 0 || aspectRatio === undefined ? NaN : aspectRatio)}
              autoCropArea={0.9}
              guides={!circularCrop}
              background={false}
              responsive
              checkOrientation={false}
              zoomOnWheel={true}
              zoomOnTouch={true}
              movable
              scalable={true}
              ready={handleCropReady}
              cropend={applyCircularDecorations}
              cropmove={handleZoomEvent}
              zoom={handleZoomEvent}
            />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mt: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleZoomChange(-10)}
                disabled={zoomPercent <= MIN_ZOOM_PERCENT || !imageLoaded}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48, textAlign: 'center' }}>
                {zoomPercent}%
              </Typography>
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleZoomChange(10)}
                disabled={zoomPercent >= MAX_ZOOM_PERCENT || !imageLoaded}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleRotate(-90)}
                disabled={!imageLoaded}
              >
                <RotateLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleRotate(90)}
                disabled={!imageLoaded}
              >
                <RotateRightIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {displayedRotation}°
              </Typography>
            </Stack>
          </Stack>

          {pendingFile && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected file: {pendingFile.name} ({formatFileSize(pendingFile.size)})
            </Typography>
          )}

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={resetStateAndClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCropApply}
          disabled={!imageLoaded || isUploading || isProcessing}
        >
          {isUploading || isProcessing ? 'Processing…' : 'Done'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImageCropperModal.propTypes = {
  src: PropTypes.string,
  onCropComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onImageUpdate: PropTypes.func,
  aspectRatio: PropTypes.number,
  title: PropTypes.string,
  circularCrop: PropTypes.bool,
  contextId: PropTypes.string,
  isOpen: PropTypes.bool,
  isUploading: PropTypes.bool,
  maxOutputSizeMB: PropTypes.number
};

export default ImageCropperModal;
