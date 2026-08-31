import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * SlideOver — right-hand drawer for evidence/detail views.
 * Esc closes; backdrop click closes; body scroll is locked while open.
 */
export default function SlideOver({ open, onClose, title, subtitle, children, width = 440 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(4, 8, 16, 0.55)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 flex flex-col shadow-2xl"
        style={{
          width: `min(${width}px, 94vw)`,
          background: 'var(--cluster-panel)',
          borderLeft: '1px solid var(--hairline)',
          color: 'var(--cluster-text)',
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--hairline)' }}>
          <div>
            <h2 className="cluster-title text-base">{title}</h2>
            {subtitle ? <p className="text-dim mt-0.5 text-xs">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--cluster-text-dim)' }}
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
