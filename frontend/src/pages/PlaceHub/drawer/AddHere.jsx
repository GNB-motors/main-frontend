import { Hexagon, Warehouse } from 'lucide-react';

export default function AddHere({ canEdit, onAdd, center, name }) {
  if (!canEdit) return null;
  return (
    <section className="ph-section">
      <h3>Trucks wait here for work?</h3>
      <p className="ph-muted">
        Idling inside a warehouse or zone counts as legit. Add this spot as a place and future
        idling here stops showing as excess.
      </p>
      <div className="ph-btn-row">
        <button type="button" className="ph-btn" onClick={() => onAdd('ZONE', { center, name })}>
          <Hexagon size={14} /> Add as zone
        </button>
        <button
          type="button"
          className="ph-btn"
          onClick={() => onAdd('WAREHOUSE', { center, name })}
        >
          <Warehouse size={14} /> Add as warehouse
        </button>
      </div>
    </section>
  );
}
