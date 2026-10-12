import { X } from 'lucide-react';

export default function Frame({ icon, title, eyebrow, label, onClose, children, footer }) {
  return (
    <aside className="ph-panel" aria-label={label || (typeof title === 'string' ? title : eyebrow)}>
      <header className="ph-panel-head">
        {icon}
        <div className="ph-panel-titles">
          {eyebrow && <span className="ph-eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        <button type="button" className="ph-icon-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>
      <div className="ph-panel-body">{children}</div>
      {footer && <footer className="ph-panel-foot">{footer}</footer>}
    </aside>
  );
}
