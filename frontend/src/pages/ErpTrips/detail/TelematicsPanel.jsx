import Facts from './Facts';
import { km, stamp } from './tripFormat';

// Human labels for the telematics reconciliation flags surfaced from the backend.
const TELEMATICS_FLAGS = {
  EXTRA_KM: 'Extra km',
  UNLOAD_DATE_MISMATCH: 'Unload date mismatch',
  GHOST_KM_NEARBY: 'Unexplained km nearby',
  RECONCILE_GAP: 'Odometer gap',
  ROUTE_DEVIATION: 'Route deviation',
  ARRIVAL_MISMATCH: 'Arrival mismatch',
};

// Where the trip's fuel figure came from. SINK is FleetEdge's own hourly fuel-used
// (edge hours pro-rated); SNAPSHOT is our estimate from fuel-level drops, used only
// when the sink does not cover the trip window.
const FUEL_SOURCE_NOTE = {
  SINK: 'FleetEdge',
  SNAPSHOT: 'estimated from fuel level',
};

const TELEMATICS_UNAVAILABLE = {
  NO_TELEMATICS: 'No telematics for this vehicle',
  NO_DATA: 'No GPS data in the trip window',
  PENDING: 'Awaiting trip close',
  FAILED: 'Telematics computation failed',
};

/**
 * Pillar 3 — actual-vs-planned reconciliation from FleetEdge, computed at trip close.
 * Renders "unavailable + reason" (HIRE / unlinked / no data) rather than an error.
 */
const TelematicsPanel = ({ telematics, plannedKm, onRecompute, recomputing }) => {
  const t = telematics;
  const status = t?.status || 'PENDING';
  const ready = status === 'COMPUTED';
  const reason = t?.statusReason ? ` (${t.statusReason})` : '';
  const a = t?.actual || {};
  const v = t?.variance || {};

  return (
    <section className="trip360-panel">
      <div className="trip360-panel-head trip360-panel-head--action">
        <span>Telematics</span>
        <button
          type="button"
          className="trip360-btn ghost trip360-btn--xs"
          onClick={onRecompute}
          disabled={recomputing}
        >
          {recomputing ? 'Recomputing…' : 'Recompute'}
        </button>
      </div>
      <div className="trip360-panel-body">
        {!ready ? (
          <p className="trip360-muted">
            {(TELEMATICS_UNAVAILABLE[status] || 'Telematics unavailable') + reason}
          </p>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Actual distance', value: km(a.totalTripKm) },
                { label: 'Planned distance', value: km(plannedKm) },
                {
                  label: 'Extra',
                  value:
                    v.extraKm != null
                      ? `${km(v.extraKm)}${v.extraKmPct != null ? ` (${v.extraKmPct}%)` : ''}`
                      : '—',
                },
                {
                  label: 'Laden / Approach / Return',
                  value: `${km(a.ladenKm)} / ${km(a.approachKm)} / ${km(a.returnKm)}`,
                },
                a.fuelDetourKm
                  ? { label: 'of which fuel detour', value: km(a.fuelDetourKm) }
                  : null,
                a.serviceKmExcluded
                  ? { label: 'Service (excluded)', value: km(a.serviceKmExcluded) }
                  : null,
                a.fuelConsumedL != null
                  ? {
                      label: 'Fuel used',
                      value: `${a.fuelConsumedL} L${FUEL_SOURCE_NOTE[a.fuelSource] ? ` · ${FUEL_SOURCE_NOTE[a.fuelSource]}` : ''}`,
                    }
                  : null,
                a.lastMovementAt ? { label: 'GPS arrival', value: stamp(a.lastMovementAt) } : null,
                t.confidence ? { label: 'Confidence', value: t.confidence } : null,
              ]}
            />
            {Array.isArray(t.flags) && t.flags.length > 0 && (
              <div className="trip360-flags">
                {t.flags.map((f) => (
                  <span key={f} className="trip360-chip trip360-chip--warn">
                    {TELEMATICS_FLAGS[f] || f}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TelematicsPanel;
