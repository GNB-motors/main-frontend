/**
 * Telematics-provider surfacing for Vehicle 360 (iALERT F1).
 *
 * The backend (vehicleProfile B9) returns `telematicsProvider` ('FLEETEDGE' |
 * 'IALERT' | null) and an `ialert` block ({ isBs6, … }) for vehicles in the
 * customer's iALERT directory. A dual-reported truck stays 'FLEETEDGE'.
 */

const BS6_NORM = /BS[\s-]?(VI|6)\b/i;

/** True only on a positive signal: iALERT says BS-VI, or the FleetEdge norm names it. */
export function isBs6Vehicle(ialert, fleetEdge) {
  return ialert?.isBs6 === true || BS6_NORM.test(fleetEdge?.emissionNorm || '');
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
