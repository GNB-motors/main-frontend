import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Fuel bill photo, framed: the image on a white rounded border with the close
 * button on its corner, over a dimmed page. Styles are inline so the popup
 * looks the same on any page, whatever stylesheets it loaded. z-index clears
 * the side sheet (10051) so it can open from inside a drawer.
 */
export default function FuelBillPopup({ imageSrc, title = 'Fuel Bill', onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          aria-label="Close bill"
          title="Close (Esc)"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-14px',
            right: '-14px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            color: '#4b5563',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>
        <img
          src={imageSrc}
          alt={title}
          style={{
            maxWidth: '100%',
            maxHeight: '88vh',
            objectFit: 'contain',
            borderRadius: '16px',
            background: 'white',
            padding: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            display: 'block',
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
