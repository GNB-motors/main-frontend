import React from 'react';
import { Clock3, Users } from 'lucide-react';
import { formatBand, confidenceText, distributionText, delayVsUsual } from '../../lib/etaBand';

/**
 * EtaBand — the corridor arrival estimate (audit §4).
 * Always a band, always with its sample size. A bare ETA with no sample
 * count is a bug, not a simplification.
 *
 *   <EtaBand stats={{ sampleSize, p25, p75, median, max }} />
 *   <EtaBand stats={stats} actualHours={45} />   // adds delay-vs-usual line
 */
export default function EtaBand({ stats, actualHours = null }) {
  if (!stats || !Number.isFinite(Number(stats.sampleSize)) || stats.sampleSize < 1) {
    return (
      <div className="etab etab--none" role="status">
        <Clock3 size={14} aria-hidden="true" />
        <span>Not enough trips on this corridor to estimate an arrival yet.</span>
      </div>
    );
  }

  const band = formatBand(stats.p25, stats.p75);
  const basis = confidenceText(stats.sampleSize);
  const distribution = distributionText(stats);
  const delay = actualHours === null ? null : delayVsUsual(actualHours, stats.median);

  return (
    <div className="etab">
      {band && <strong className="etab-band">{band}</strong>}
      {basis && (
        <span className="etab-basis">
          <Users size={12} aria-hidden="true" />
          {basis}
        </span>
      )}
      {distribution && <span className="etab-dist">{distribution}</span>}
      {delay && <span className="etab-delay">{delay}</span>}
    </div>
  );
}
