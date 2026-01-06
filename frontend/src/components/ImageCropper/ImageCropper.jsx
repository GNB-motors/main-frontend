import React, { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "react-cropper/node_modules/cropperjs/dist/cropper.css";
import "./ImageCropper.css";
import { toast } from 'react-toastify';

const ImageCropper = ({
    src,
    onCropComplete,
    onCancel,
    onImageUpdate,
    aspectRatio = NaN,  // NaN means free aspect ratio
    title = "Crop Image",
    circularCrop = false,
    isOpen,
    isUploading = false,
}) => {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingImageUrl, setPendingImageUrl] = useState(null);
    const cropperRef = useRef(null);

    const handleZoomIn = () => {
        if (cropperRef.current && cropperRef.current.cropper) {
            const newZoom = Math.min(zoom + 10, 200);
            setZoom(newZoom);
            cropperRef.current.cropper.zoom(0.1);
        }
    };

    const handleZoomOut = () => {
        if (cropperRef.current && cropperRef.current.cropper) {
            const newZoom = Math.max(zoom - 10, 50);
            setZoom(newZoom);
            cropperRef.current.cropper.zoom(-0.1);
        }
    };

    const handleRotateLeft = () => {
        if (cropperRef.current && cropperRef.current.cropper) {
            cropperRef.current.cropper.rotate(-90);
            setRotation((prev) => prev - 90);
        }
    };

    const handleRotateRight = () => {
        if (cropperRef.current && cropperRef.current.cropper) {
            cropperRef.current.cropper.rotate(90);
            setRotation((prev) => prev + 90);
        }
    };

    const handleCropApply = () => {
        if (!cropperRef.current || !cropperRef.current.cropper) {
            return;
        }

        try {
            const cropper = cropperRef.current.cropper;
            const canvas = cropper.getCroppedCanvas({
                width: circularCrop ? 240 : undefined,
                height: circularCrop ? 240 : undefined,
                fillColor: "transparent",
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "high",
            });

            if (!canvas) {
                return;
            }

            // Apply circular mask if needed
            if (circularCrop) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.save();
                    ctx.beginPath();
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const radius = Math.min(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    ctx.restore();
                }
            }

            const commitAndComplete = (finalBlob) => {
                if (pendingFile && onImageUpdate && pendingImageUrl) {
                    onImageUpdate(pendingImageUrl, pendingFile);
                    setPendingFile(null);
                    setPendingImageUrl(null);
                }
                onCropComplete(finalBlob);
            };

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const blobSizeMB = blob.size / (1024 * 1024);
                        if (blobSizeMB > 4.5) {
                            const img = new Image();
                            img.onload = () => {
                                const tempCanvas = document.createElement("canvas");
                                const scaleFactor = Math.sqrt(4.5 / blobSizeMB);
                                tempCanvas.width = Math.floor(img.width * scaleFactor);
                                tempCanvas.height = Math.floor(img.height * scaleFactor);

                                const ctx = tempCanvas.getContext("2d");
                                if (ctx) {
                                    ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                                    tempCanvas.toBlob(
                                        (compressedBlob) => {
                                            if (compressedBlob) {
                                                commitAndComplete(compressedBlob);
                                            } else {
                                                commitAndComplete(blob);
                                            }
                                        },
                                        "image/jpeg",
                                        0.7
                                    );
                                } else {
                                    commitAndComplete(blob);
                                }
                            };
                            img.src = URL.createObjectURL(blob);
                        } else {
                            commitAndComplete(blob);
                        }
                    } else {
                        toast.error("Failed to process the image. Please try again.");
                    }
                },
                "image/jpeg",
                0.8
            );
        } catch (error) {
            toast.error("An error occurred while processing the image. Please try again.");
        }
    };

    const handleUploadNew = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                const file = files[0];

                if (file.size > 5 * 1024 * 1024) {
                    toast.error("File size should be less than 5MB");
                    return;
                }

                const imageUrl = URL.createObjectURL(file);
                setCurrentSrc(imageUrl);
                setImageLoaded(false);
                setZoom(100);
                setRotation(0);
                setPendingFile(file);
                setPendingImageUrl(imageUrl);
            }
        };
        input.click();
    };

    const handleCancel = () => {
        setCurrentSrc(src);
        setZoom(100);
        setRotation(0);
        if (pendingImageUrl) {
            try {
                URL.revokeObjectURL(pendingImageUrl);
            } catch {}
        }
        setPendingFile(null);
        setPendingImageUrl(null);
        onCancel();
    };

    const setupCircularCropWithFourPoints = () => {
        if (!circularCrop || !cropperRef.current || !cropperRef.current.cropper) {
            return;
        }

        const cropBox = document.querySelector(".cropper-crop-box");
        if (cropBox) {
            cropBox.classList.add("circular-crop");
            cropBox.style.borderRadius = "50%";
            cropBox.style.overflow = "hidden";
        }

        const cropBoxUI = document.querySelector(".cropper-view-box");
        if (cropBoxUI) {
            cropBoxUI.style.border = "none";
            cropBoxUI.style.borderRadius = "50%";
            cropBoxUI.style.boxShadow = "0 0 0 1px #fff";
        }

        const cropperLines = document.querySelectorAll(".cropper-line");
        cropperLines.forEach((line) => {
            line.style.display = "none";
        });

        const cropperGrid = document.querySelector(".cropper-grid");
        if (cropperGrid) {
            cropperGrid.style.display = "none";
        }

        const cropperPoints = document.querySelectorAll(".cropper-point");
        cropperPoints.forEach((point) => {
            point.style.display = "none";
        });

        const northPoint = document.querySelector(".cropper-point.point-n");
        const eastPoint = document.querySelector(".cropper-point.point-e");
        const southPoint = document.querySelector(".cropper-point.point-s");
        const westPoint = document.querySelector(".cropper-point.point-w");

        [northPoint, eastPoint, southPoint, westPoint].forEach((point) => {
            if (point) {
                point.style.display = "block";
            }
        });
    };

    useEffect(() => {
        setCurrentSrc(src);
        setImageLoaded(false);
        setZoom(100);
        setRotation(0);
    }, [src]);

    useEffect(() => {
        if (cropperRef.current && cropperRef.current.cropper && currentSrc) {
            setTimeout(() => {
                try {
                    const imageData = cropperRef.current.cropper.getImageData();
                    const initialZoom = imageData?.zoom || 1;
                    setZoom(Math.round(initialZoom * 100));
                } catch (e) {
                    setZoom(100);
                }
                setImageLoaded(true);

                if (circularCrop) {
                    setupCircularCropWithFourPoints();
                }
            }, 200);
        }
    }, [currentSrc, circularCrop]);

    if (!isOpen) return null;

    return (
        <div className="cropper-container-overlay">
            <div className="cropper-wrapper">
                <div className="cropper-header">
                    <div className="header-title-container">
                        <div className="cropper-title">{title}</div>
                    </div>
                    <button className="close-button" onClick={handleCancel}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12" stroke="#121214" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 4L12 12" stroke="#121214" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                <div className="crop-area">
                    <div className="upload-controls">
                        <button className="upload-new-button" onClick={handleUploadNew}>
                            <svg width="14.5" height="15.5" viewBox="0 0 15 16" fill="none">
                                <path d="M10 5L7.5 2.5L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7.5 2.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13 10.5V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Upload new</span>
                        </button>
                    </div>

                    <div className="crop-area-inner">
                        <div style={{ position: "relative", width: "100%", height: "100%" }} className={circularCrop ? "circular-crop-container" : ""}>
                            <Cropper
                                ref={cropperRef}
                                src={currentSrc}
                                style={{ height: "417px", width: "100%" }}
                                viewMode={1}
                                dragMode="move"
                                minCropBoxHeight={200}
                                minCropBoxWidth={200}
                                aspectRatio={circularCrop ? 1 : aspectRatio} // NaN = free aspect ratio
                                guides={!circularCrop}
                                center={true}
                                highlight={false}
                                background={false}
                                autoCropArea={circularCrop ? 0.8 : 0.8}
                                responsive={true}
                                checkOrientation={false}
                                zoomable={true}
                                zoomOnTouch={false}
                                zoomOnWheel={false}
                                scalable={false}
                                ready={() => {
                                    setImageLoaded(true);
                                    if (!circularCrop) {
                                        const cropBox = document.querySelector(".cropper-crop-box");
                                        if (cropBox) {
                                            for (let i = 1; i <= 3; i++) {
                                                const vLine = document.createElement("div");
                                                vLine.className = `grid-line-v line-${i}`;
                                                cropBox.appendChild(vLine);
                                            }
                                            for (let i = 1; i <= 2; i++) {
                                                const hLine = document.createElement("div");
                                                hLine.className = `grid-line-h line-${i}`;
                                                cropBox.appendChild(hLine);
                                            }
                                        }
                                    }
                                    if (circularCrop) {
                                        setupCircularCropWithFourPoints();
                                    }
                                }}
                                cropstart={() => {
                                    if (circularCrop) setupCircularCropWithFourPoints();
                                }}
                                cropmove={() => {
                                    if (cropperRef.current && cropperRef.current.cropper) {
                                        try {
                                            const imageData = cropperRef.current.cropper.getImageData();
                                            if (imageData && imageData.zoom && !isNaN(imageData.zoom)) {
                                                setZoom(Math.round(imageData.zoom * 100));
                                            }
                                        } catch (error) {}
                                    }
                                    if (circularCrop) setupCircularCropWithFourPoints();
                                }}
                                zoom={() => {
                                    if (circularCrop) setupCircularCropWithFourPoints();
                                }}
                            />
                        </div>
                    </div>

                    <div className="controls-container">
                        <div className="zoom-controls">
                            <button className="icon-container" onClick={handleZoomOut} disabled={zoom <= 50} title="Zoom out">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </button>
                            <span className="zoom-value">{zoom}%</span>
                            <button className="icon-container" onClick={handleZoomIn} disabled={zoom >= 200} title="Zoom in">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className="rotate-controls">
                            <button className="icon-container" onClick={handleRotateRight}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M14.5 5.5C13.2 4.2 11.4 3.5 9.5 3.5C5.9 3.5 3 6.4 3 10C3 13.6 5.9 16.5 9.5 16.5C12.5 16.5 15 14.4 15.7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M12 5.5H14.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <button className="icon-container" onClick={handleRotateLeft}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5.5 5.5C6.8 4.2 8.6 3.5 10.5 3.5C14.1 3.5 17 6.4 17 10C17 13.6 14.1 16.5 10.5 16.5C7.5 16.5 5 14.4 4.3 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M8 5.5H5.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="cropper-footer">
                    <div className="button-controls">
                        <button className="cancel-button" onClick={handleCancel} disabled={!imageLoaded}>
                            Cancel
                        </button>
                        <button className="apply-button" onClick={handleCropApply} disabled={!imageLoaded || isUploading}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
