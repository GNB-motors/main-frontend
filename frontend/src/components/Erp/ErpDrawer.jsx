import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ErpDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '600px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="erp-drawer-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        className="erp-drawer"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
      >
        <div className="erp-drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="erp-subtitle" style={{ margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        <div className="erp-drawer-body">
          {children}
        </div>

        {footer && (
          <div className="erp-drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ErpDrawer;
