import React from 'react';
import { pct } from '../commandCenterFormat';

function SegBar({ parts, total }) {
  return (
    <>
      <div className="seg">
        {parts.map((p) => (
          <i key={p.label} style={{ width: pct(p.value, total), background: p.color }} />
        ))}
      </div>
      <div className="segleg">
        {parts.map((p) => (
          <span key={p.label} style={{ '--c': p.color }}>
            {p.legend ?? p.label}
          </span>
        ))}
      </div>
    </>
  );
}

export default SegBar;
