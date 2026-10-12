import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, Warehouse, Hexagon, Flame } from 'lucide-react';
import { KIND_META } from '../placeHubModel.js';
import { styleOfType } from '../placeHubStyle.js';

const KIND_ICON = { WAREHOUSE: Warehouse, ZONE: Hexagon, HOTSPOT: Flame };

export default function AddMenu({ allowHotspot, onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const kinds = Object.keys(KIND_META).filter((k) => k !== 'HOTSPOT' || allowHotspot);
  return (
    <div className="ph-menu-wrap" ref={ref}>
      <button
        type="button"
        className="ph-btn ph-btn--primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Plus size={15} /> Add place <ChevronDown size={14} />
      </button>
      {open && (
        <div className="ph-menu" role="menu">
          {kinds.map((k) => {
            const Icon = KIND_ICON[k];
            const { color } = styleOfType(k);
            return (
              <button
                key={k}
                type="button"
                role="menuitem"
                className="ph-menu-item"
                onClick={() => {
                  setOpen(false);
                  onAdd(k);
                }}
              >
                <span className="ph-menu-icon" style={{ color, background: `${color}1a` }}>
                  <Icon size={15} />
                </span>
                <span>
                  <strong>{KIND_META[k].label}</strong>
                  <small>{KIND_META[k].hint}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
