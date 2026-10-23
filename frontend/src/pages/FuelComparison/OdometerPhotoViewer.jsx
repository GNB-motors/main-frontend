import { Gauge, ZoomIn, ZoomOut, RotateCw, ExternalLink } from 'lucide-react';

/** Odometer slip photo with zoom, rotate and open-in-tab controls. */
const OdometerPhotoViewer = ({ task, zoom, setZoom, rotation, setRotation }) => (
  <div>
    <div className="fc-section-title">
      <Gauge size={14} /> Odometer Slip Photo Proof
    </div>
    <div className="fc-photo-box">
      <div className="fc-photo-tools">
        <span className="text-xs font-semibold text-slate-500">Document Image</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="fc-drawer__icon-btn"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            title="Zoom Out"
            aria-label="Zoom out photo"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs fc-mono px-1 font-semibold text-slate-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="fc-drawer__icon-btn"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Zoom In"
            aria-label="Zoom in photo"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="fc-drawer__icon-btn"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Rotate Clockwise"
            aria-label="Rotate photo"
          >
            <RotateCw size={14} />
          </button>
          <a
            href={task.odometerDoc.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fc-drawer__icon-btn"
            title="Open full image in new tab"
            aria-label="Open image in new tab"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="fc-photo-canvas">
        <img
          src={task.odometerDoc.publicUrl}
          alt="Odometer verification slip"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {task.odometerDoc?.ocrData && (
        <div className="fc-photo-meta">
          <span>
            OCR Status: <strong>{task.odometerDoc.ocrData.processingStatus || 'COMPLETED'}</strong>
          </span>
          {task.odometerDoc.ocrData.confidence != null && (
            <span className="fc-mono">
              Confidence: <strong>{task.odometerDoc.ocrData.confidence}%</strong>
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

export default OdometerPhotoViewer;
