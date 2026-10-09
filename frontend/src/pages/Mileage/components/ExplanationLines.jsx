import React from 'react';

/** The figures behind a verdict: label on the left, value on the right. */
export default function ExplanationLines({ lines }) {
  return (
    <dl className="mhub-calc">
      {lines.map(([k, v]) => (
        <div key={k} className="mhub-calc-row">
          <dt>{k}</dt>
          <dd className="num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
