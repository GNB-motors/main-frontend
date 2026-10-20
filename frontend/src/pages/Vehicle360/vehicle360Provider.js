/**
 * Telematics-provider surfacing for Vehicle 360 (iALERT F1).
 *
 * The backend (vehicleProfile B9) returns `telematicsProvider` ('FLEETEDGE' |
 * 'IALERT' | null) and an `ialert` block ({ isBs6, … }) for vehicles in the
 * customer's iALERT directory. A dual-reported truck stays 'FLEETEDGE'.
 */

// Exact allowlist after dropping case, spaces and hyphens — a vendor string
// that merely contains "BS6" (e.g. "BS6-ready") is not a positive signal.
const BS6_NORMS = new Set(['BS6', 'BSVI']);

/** True only on a positive signal: iALERT says BS-VI, or the FleetEdge norm names it. */
export function isBs6Vehicle(ialert, fleetEdge) {
  const norm = String(fleetEdge?.emissionNorm || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  return ialert?.isBs6 === true || BS6_NORMS.has(norm);
}

const PROVIDER_LABEL = { FLEETEDGE: 'FleetEdge', IALERT: 'iALERT' };

/** Pill props for the identity strip, or null when the provider is unknown. */
export function providerPill(telematicsProvider) {
  const label = PROVIDER_LABEL[telematicsProvider];
  return label ? { id: `tp-${telematicsProvider}`, tone: 'grey', label } : null;
}

export function providerLabel(telematicsProvider) {
  return PROVIDER_LABEL[telematicsProvider] || null;
}
