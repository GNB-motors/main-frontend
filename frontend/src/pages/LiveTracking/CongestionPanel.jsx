import React from 'react';
import { legendOf, gapsOf, summaryOf, topEdges, hourLabel, colorFor } from '../../lib/congestion';

/**
 * The coverage panel under the congestion pill (00_PLAN.md item 5).
 *
 * Its job is to stop the coloured lines on the map from being read as a claim they cannot support. It
 * prints, in order: what the colours MEAN (which quantile, of which roads, at which hour, learned from how
 * many edges, measured when), how many edges could not be rated and WHY, and then the handful of numbers
 * behind the worst edges. Where the map is thin, this says so instead of letting the user assume the
 * network is clear.
 */
export default function CongestionPanel({ congestion, notice }) {
  const rows = congestion?.rows || [];
  const coverage = congestion?.coverage || null;
  if (!coverage) {
    return notice ? <p className="lp-congestion__note">{notice}</p> : null;
  }
  const legend = legendOf(coverage);
  const gaps = gapsOf(coverage);
  const top = topEdges(rows, 5);
  const store = coverage.store === 'CLICKHOUSE' ? 'ClickHouse' : 'the org edge index';
  return (
    <div className="lp-congestion" data-testid="congestion-panel">
      <p className="lp-congestion__summary">{summaryOf(coverage, rows)}</p>
      {coverage.truncated && (
        <p className="lp-congestion__warn">
          This read hit its row cap, so the list is partial. Fewer edges than the fleet has driven.
        </p>
      )}

      <ul className="lp-congestion__legend">
        {legend.map((l) => (
          <li key={l.label}>
            <span className="lp-congestion__swatch" style={{ background: l.color }} />
            <span>
              <strong>{l.label}</strong> — {l.detail}
            </span>
          </li>
        ))}
      </ul>

      {gaps.length > 0 && (
        <div className="lp-congestion__gaps" data-testid="congestion-gaps">
          <strong>Not drawn, because we cannot support a colour:</strong>
          <ul>
            {gaps.map((g) => (
              <li key={g.reason}>{g.text}</li>
            ))}
          </ul>
        </div>
      )}

      {top.length > 0 && (
        <table className="lp-congestion__table" aria-label="Worst rated edges at this hour">
          <thead>
            <tr>
              <th scope="col">Road</th>
              <th scope="col">×free flow</th>
              <th scope="col">Ours</th>
              <th scope="col">Map</th>
              <th scope="col">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <tr key={r.edgeKey} data-testid="congestion-row">
                <td>
                  <span className="lp-congestion__dot" style={{ background: colorFor(r) }} /> {r.roadClass}
                </td>
                <td>
                  {r.index}
                  {r.band != null && (
                    <span className="lp-congestion__band" title={`boundary from ${r.bandEdges} edges`}>
                      {' '}
                      / {r.band}
                    </span>
                  )}
                </td>
                <td>{r.ours?.speedKmh != null ? `${r.ours.speedKmh} km/h` : '—'}</td>
                <td>{r.network?.engineKmh != null ? `${r.network.engineKmh} km/h` : '—'}</td>
                <td className="lp-congestion__evidence">
                  {r.sample?.nightRows != null ? `${r.sample.nightRows} night rows` : '—'}
                  {r.sample?.crossings != null ? ` · ${r.sample.crossings} crossings` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="lp-congestion__foot">
        Hour {hourLabel(coverage.how)} · read from {store}. Ours is what our trucks measured on this road;
        the map figure is the road engine&rsquo;s own speed for the same edge. They are shown side by side
        and never averaged into one number.
      </p>
      {notice && <p className="lp-congestion__note">{notice}</p>}
    </div>
  );
}