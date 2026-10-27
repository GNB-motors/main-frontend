import React from 'react';
import { SOURCE_LABEL } from './performanceCells';

const LEGEND = [
  {
    source: 'measured',
    title: 'Read from the truck',
    text: 'the OBU reported it. Our source of truth.',
  },
  {
    source: 'vendor',
    title: 'Computed by iALERT',
    text: 'from the same OBU. Graded against ours, never merged with it.',
  },
  {
    source: 'estimated',
    title: 'Modelled by us',
    text: "from that truck's own history. Always carries its uncertainty.",
  },
  {
    source: 'not_comparable',
    title: 'Cannot be compared',
    text: 'and is shown struck through, with the reason — never as a zero.',
  },
];

/**
 * "Where every number comes from" — the legend the mockup puts above the fleet.
 * It is the same vocabulary the API contract uses, so a badge on screen always
 * means exactly one of these four things.
 */
export default function SourceLegend() {
  return (
    <section className="pf-legend" aria-label="Where every number comes from">
      <h2 className="pf-legend-title">Where every number comes from</h2>
      <div className="pf-legend-items">
        {LEGEND.map((item) => (
          <div className="pf-legend-item" key={item.source}>
            <span className={`psrc-badge psrc-badge--${item.source}`}>
              {SOURCE_LABEL[item.source]}
            </span>
            <p>
              <strong>{item.title}</strong> {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
