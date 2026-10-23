import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

const ReceiptPreviewModal = ({ isOpen, onClose, receiptUrl, title = 'Receipt Preview' }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const isPdf =
    receiptUrl &&
    (receiptUrl.toLowerCase().endsWith('.pdf') || receiptUrl.toLowerCase().includes('/pdf'));
  const hasReceipt = Boolean(receiptUrl);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-gray-50/80">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <FileText className="h-5 w-5 text-rose-500" />
            ) : (
              <ImageIcon className="h-5 w-5 text-indigo-600" />
            )}
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasReceipt && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
                Open
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 min-h-[360px] max-h-[70vh] bg-gray-100 flex items-center justify-center overflow-auto p-4 select-none">
          {!hasReceipt ? (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 p-8 text-center">
              <FileText size={48} className="opacity-40" />
              <p className="text-sm font-medium text-gray-600">No receipt attached</p>
              <p className="text-xs text-gray-400 max-w-xs">
                This transaction does not have an attached receipt image or bill document.
              </p>
            </div>
          ) : isPdf ? (
            <iframe
              src={receiptUrl}
              title="Receipt Document"
              className="w-full h-[65vh] rounded border border-gray-300 bg-white"
            />
          ) : (
            <div className="flex items-center justify-center overflow-auto w-full h-full">
              <img
                src={receiptUrl}
                alt="Receipt Document"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[60vh] max-w-full object-contain rounded shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Footer controls for images */}
        {hasReceipt && !isPdf && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 bg-gray-50 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 font-medium hover:bg-gray-100"
                title="Zoom in"
              >
                <ZoomIn size={14} />
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 font-medium hover:bg-gray-100"
                title="Zoom out"
              >
                <ZoomOut size={14} />
                Zoom Out
              </button>
              <button
                onClick={handleRotate}
                className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 font-medium hover:bg-gray-100"
                title="Rotate 90°"
              >
                <RotateCw size={14} />
                Rotate
              </button>
              <button
                onClick={handleReset}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-medium hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
            <a
              href={receiptUrl}
              download="receipt"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
