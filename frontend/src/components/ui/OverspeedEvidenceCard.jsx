import React from 'react';
import { Gauge, Building2 } from 'lucide-react';
import { eventLine, comparisonFromCounts, sourcesDisagree } from '../../lib/overspeedEvidence';
import PlaceLabel from './PlaceLabel';

/**
 * OverspeedEvidenceCard — one overspeed event with the evidence visible
 * (audit §3). Reads "78 km/h for 6 minutes on NH-19 near Dankuni" — speed,
 * duration, place. Below it, both sources with provenance, never averaged:
 * "Our calculation: 4 events, 22 min over. device-reported: 31 events."
 *
 *   <OverspeedEvidenceCard
 *     event={{ maxSpeedKmh, durationSec, startLat, startLng }}
 *     corroboratingCount={31}
 *     computedTotal={4}
 *     computedOverMinutes={22}
 *     thresholds={{ speedThresholdKmh: 80, durationSec: 180 }}
 *   />
 */
export default function OverspeedEvidenceCard({
  event,
  computedTotal = null,
  computedOverMinutes = null,
  corroboratingCount = 0,
  thresholds = null,
}) {
  const line = eventLine(event);
  const compare = comparisonFromCounts({ computedCount: computedTotal, computedOverMinutes, corroboratingCount });
  const disagree = sourcesDisagree(
    Array.from({ length: computedTotal || 0 }),
    Array.from({ length: corroboratingCount }),
  );

  if (!line && !compare) return null;

  return (
    <article className="osc">
      {line && (
        <p className="osc-line">
          <Gauge size={15} aria-hidden="true" />
          <strong>{line}</strong>
          {event?.startLat != null && event?.startLng != null && (
            <span className="osc-place">
              on <PlaceLabel lat={event.startLat} lng={event.startLng} />
            </span>
          )}
        </p>
      )}
      {thresholds && (
        <p className="osc-thresholds">
          Threshold: {thresholds.speedThresholdKmh} km/h sustained {Math.round(thresholds.durationSec / 60)} min
          (yours to set — events recompute when you change it)
        </p>
      )}
      {compare && (
        <p className={`osc-compare ${disagree ? 'osc-compare--disagree' : ''}`}>
          <Building2 size={13} aria-hidden="true" />
          {compare}
          {disagree && (
            <em> The two sources count differently — the device fires on an instantaneous
              sample, we require sustained speed. Shown side by side, not merged.</em>
          )}
        </p>
      )}
    </article>
  );
}
