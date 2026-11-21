import React from 'react';
import { SOURCE_LABEL } from './performanceCells';

/**
 * How to read the numbers — one line, in the briefing.
 *
 * A plain number is a reading from the truck, so only the other sources get a
 * tag, and the legend only names the tags that are actually on screen.
 */
export default function SourceLegend({ present = new Set() }) {
  return (
    <div className="pf-legend" role="note" aria-label="How to read the numbers">
      <span>Plain numbers are read from the truck.</span>
      {present.has('vendor') ? (
        <span>
          <span className="psrc-tag psrc-tag--vendor">{SOURCE_LABEL.vendor}</span>
          computed by iALERT, never merged with ours.
        </span>
      ) : null}
      {present.has('estimated') ? (
        <span>
          <span className="psrc-tag psrc-tag--estimated">{SOURCE_LABEL.estimated}</span>
          modelled from the truck’s own history, ± its uncertainty.
        </span>
      ) : null}
      <span>— means there is no number we can stand behind; open the row to see why.</span>
    </div>
  );
}
