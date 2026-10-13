import { SEVERE_OVER_KMH } from './overspeedHelpers.js';

export default function MapLegend({ limit }) {
  return (
    <div className="ov chipcard ovs-legend">
      <div className="legend">
        <span>
          <i className="dot" style={{ background: '#C2323A' }} />
          Peak over {limit + SEVERE_OVER_KMH} km/h
        </span>
        <span>
          <i className="dot" style={{ background: '#F0AA48' }} />
          {limit}–{limit + SEVERE_OVER_KMH} km/h
        </span>
        <span>Bigger dot = longer event</span>
      </div>
    </div>
  );
}
