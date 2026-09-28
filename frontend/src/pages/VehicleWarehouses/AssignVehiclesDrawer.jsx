import React, { useEffect, useMemo, useState } from 'react';
import { X, Truck, Check } from 'lucide-react';

/**
 * Bulk assign vehicles to a yard. Shows where each vehicle is currently based so
 * an operator can see they are moving it, rather than assigning blind.
 */
export default function AssignVehiclesDrawer({
  open,
  warehouse,
  vehicles,
  warehousesById,
  onClose,
  onAssign,
}) {
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPicked(new Set());
      setQuery('');
    }
  }, [open]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (vehicles || [])
      .filter(
        (v) =>
          !q ||
          String(v.registrationNumber || '')
            .toLowerCase()
            .includes(q),
      )
      .map((v) => ({
        ...v,
        currentWarehouseName: v.homeWarehouseId
          ? warehousesById.get(String(v.homeWarehouseId))?.name || 'Another yard'
          : null,
        isHere: String(v.homeWarehouseId || '') === String(warehouse?._id || ''),
      }));
  }, [vehicles, query, warehousesById, warehouse]);

  if (!open || !warehouse) return null;

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    if (!picked.size) return;
    setSaving(true);
    try {
      await onAssign([...picked]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vwh-drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="vwh-drawer vwh-drawer--narrow">
        <header className="vwh-drawer-head">
          <h2>Assign vehicles to {warehouse.name}</h2>
          <button type="button" className="vwh-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="vwh-drawer-body">
          <input
            className="vwh-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search registration…"
            aria-label="Search registration"
          />
          <ul className="vwh-pick-list">
            {rows.map((v) => (
              <li key={v._id}>
                <button
                  type="button"
                  className={`vwh-pick${picked.has(v._id) ? ' is-picked' : ''}${v.isHere ? ' is-here' : ''}`}
                  onClick={() => !v.isHere && toggle(v._id)}
                  disabled={v.isHere}
                >
                  <span className="vwh-pick-check">
                    {picked.has(v._id) || v.isHere ? <Check size={14} /> : <Truck size={14} />}
                  </span>
                  <span className="vwh-pick-reg">{v.registrationNumber}</span>
                  <span className="vwh-pick-note">
                    {v.isHere
                      ? 'Already based here'
                      : v.currentWarehouseName
                        ? `Moving from ${v.currentWarehouseName}`
                        : 'No yard yet'}
                  </span>
                </button>
              </li>
            ))}
            {!rows.length && <li className="vwh-empty-row">No vehicles match.</li>}
          </ul>
        </div>

        <footer className="vwh-drawer-foot">
          <button type="button" className="vwh-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="vwh-btn vwh-btn--primary"
            onClick={submit}
            disabled={saving || !picked.size}
          >
            {saving ? 'Assigning…' : `Assign ${picked.size || ''}`.trim()}
          </button>
        </footer>
      </aside>
    </div>
  );
}
