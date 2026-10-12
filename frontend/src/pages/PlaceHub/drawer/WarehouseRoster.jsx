import { Truck } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import PlaceHubService from '../PlaceHubService.js';

export default function WarehouseRoster({ id }) {
  const { data, loading } = useApi(() => PlaceHubService.warehouseRoster(id), [id]);
  const inside = data?.inside || [];
  return (
    <section className="ph-section">
      <h3>Inside now</h3>
      {loading ? (
        <span className="ph-shimmer ph-ghost-line" />
      ) : inside.length ? (
        <div className="ph-truck-chips">
          {inside.slice(0, 24).map((v) => (
            <span
              key={v.vehicleId}
              className="ph-truck-chip"
              title={v.isHomeWarehouse ? 'Based here' : 'Based elsewhere'}
            >
              <Truck size={11} /> {v.registrationNumber || 'Truck'}
            </span>
          ))}
        </div>
      ) : (
        <p className="ph-muted">No truck is inside right now.</p>
      )}
    </section>
  );
}
