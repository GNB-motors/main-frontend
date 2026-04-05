import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';

/* All styles are inline to guarantee they apply regardless of CSS cascade */

const S = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99999,
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    width: '100%', maxWidth: '700px', maxHeight: '88vh',
    animation: 'none',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9',
    background: '#ffffff',
    flexShrink: 0,
    gap: '12px',
  },
  titleRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    minWidth: 0,
  },
  titleIcon: { color: '#2563eb', flexShrink: 0 },
  title: {
    fontSize: '14px', fontWeight: 700, color: '#0f172a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  closeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px', flexShrink: 0,
    border: 'none', background: '#f1f5f9', borderRadius: '8px',
    color: '#475569', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  body: {
    flex: 1, overflow: 'hidden',
    background: '#f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '320px',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  stage: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', padding: '24px', boxSizing: 'border-box',
  },
  img: {
    maxWidth: '100%', maxHeight: '520px',
    objectFit: 'contain',
    borderRadius: '6px',
    userSelect: 'none',
    display: 'block',
  },
  toolbar: {
    padding: '12px 18px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: '#ffffff',
    flexShrink: 0,
  },
  controls: {
    display: 'flex', alignItems: 'center', gap: '4px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '5px 10px',
  },
  ctrlBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px',
    border: 'none', background: 'transparent',
    color: '#475569', borderRadius: '7px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500,
  },
  zoomLabel: {
    fontSize: '12px', fontWeight: 700, color: '#334155',
    minWidth: '40px', textAlign: 'center',
  },
  divider: {
    width: '1px', height: '20px',
    background: '#e2e8f0', margin: '0 4px', flexShrink: 0,
  },
  resetBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: '32px', padding: '0 12px',
    border: 'none', background: 'transparent',
    color: '#64748b', borderRadius: '7px',
    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
  },
};

const ImagePreviewModal = ({ imageSrc, title, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const zoomIn  = useCallback(() => setZoom(p => Math.min(p + 0.25, 4)), []);
  const zoomOut = useCallback(() => setZoom(p => Math.max(p - 0.25, 0.5)), []);
  const rotate  = useCallback(() => setRotation(p => (p + 90) % 360), []);
  const reset   = useCallback(() => { setZoom(1); setRotation(0); }, []);

  return ReactDOM.createPortal(
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.titleRow}>
            <Maximize2 size={15} style={S.titleIcon} />
            <span style={S.title}>{title}</span>
          </div>
          <button style={S.closeBtn} onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Image stage */}
        <div style={S.body}>
          <div style={S.stage}>
            <img
              src={imageSrc}
              alt={title}
              style={{
                ...S.img,
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Controls toolbar */}
        <div style={S.toolbar}>
          <div style={S.controls}>
            <button style={S.ctrlBtn} onClick={zoomOut} title="Zoom out">
              <ZoomOut size={16} />
            </button>
            <span style={S.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button style={S.ctrlBtn} onClick={zoomIn} title="Zoom in">
              <ZoomIn size={16} />
            </button>
            <div style={S.divider} />
            <button style={S.ctrlBtn} onClick={rotate} title="Rotate 90°">
              <RotateCw size={16} />
            </button>
            <button style={S.resetBtn} onClick={reset} title="Reset view">
              Reset
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ImagePreviewModal;
