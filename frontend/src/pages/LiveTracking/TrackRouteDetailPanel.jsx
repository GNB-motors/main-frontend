import DeliveryRouteDetail from '../PlaceHub/intelligence/DeliveryRouteDetail.jsx';

/**
 * TrackRouteDetailPanel — the route the owner clicked on the map.
 *
 * The detail itself is Place Hub's, so the route reads the same here as it
 * does in Place Hub.
 */
export default function TrackRouteDetailPanel({ id, onChanged, onClose }) {
  if (!id) return null;
  return (
    <section
      role="dialog"
      aria-label="Route detail"
      className="absolute bottom-4 left-1/2 z-[1200] w-[min(720px,92vw)] -translate-x-1/2 overflow-y-auto rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 shadow-[var(--rd-shadow-float)]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">Route detail</h3>
        <button type="button" className="ph-btn ph-btn--sm" onClick={onClose}>
          Close
        </button>
      </div>
      <DeliveryRouteDetail id={id} onChanged={onChanged} />
    </section>
  );
}
