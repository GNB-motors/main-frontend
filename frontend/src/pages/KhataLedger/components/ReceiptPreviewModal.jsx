import { useState } from 'react';
import { FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import '../KhataLedger.css';
import './khataTransactions.css';

/** A receipt image or PDF, with zoom and rotate for images. Often opened from another dialog. */
const ReceiptPreviewModal = ({ isOpen, onClose, receiptUrl, title = 'Receipt' }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const lower = receiptUrl ? receiptUrl.toLowerCase() : '';
  const isPdf = lower.endsWith('.pdf') || lower.includes('/pdf');
  const hasReceipt = Boolean(receiptUrl);

  const close = () => {
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent forceBackdrop className="khata-dialog max-w-3xl overflow-hidden">
        <DialogHeader className="px-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {!hasReceipt ? (
              'No receipt attached'
            ) : (
              <>
                {isPdf ? 'PDF document' : 'Photo of the bill'} ·{' '}
                <a className="khata-link" href={receiptUrl} target="_blank" rel="noreferrer">
                  Open in a new tab →
                </a>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="khata-receipt-stage">
          {!hasReceipt ? (
            <div className="khata-empty">
              <FileText size={22} aria-hidden="true" />
              <strong>No receipt attached</strong>
              <p>This entry was saved without a bill photo or document.</p>
            </div>
          ) : isPdf ? (
            <iframe src={receiptUrl} title="Receipt document" />
          ) : (
            <img
              src={receiptUrl}
              alt="Receipt"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          )}
        </div>

        {hasReceipt && !isPdf ? (
          <div className="khata-receipt-tools">
            <div>
              <button
                type="button"
                className="khata-btn"
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              >
                <ZoomIn size={14} aria-hidden="true" />
                Zoom in
              </button>
              <button
                type="button"
                className="khata-btn"
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              >
                <ZoomOut size={14} aria-hidden="true" />
                Zoom out
              </button>
              <button
                type="button"
                className="khata-btn"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <RotateCw size={14} aria-hidden="true" />
                Rotate
              </button>
              {zoom !== 1 || rotation !== 0 ? (
                <button
                  type="button"
                  className="khata-btn khata-btn--ghost"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                >
                  Reset
                </button>
              ) : null}
            </div>
            <a
              className="khata-link"
              href={receiptUrl}
              download="receipt"
              target="_blank"
              rel="noreferrer"
            >
              Download →
            </a>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewModal;
