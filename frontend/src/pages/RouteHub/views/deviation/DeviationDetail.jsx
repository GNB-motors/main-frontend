import Ico from '../../routeHubIcons.jsx';
import { inr } from '../../routeHubFormat';
import { isCircuitousDetour } from './deviationRules.js';

export default function DeviationDetail({ selected, go, containerRef }) {
  return (
    <div className="card detailmap">
      <div className="card-head">
        {selected ? (
          <>
            <span className="plate">{selected.registrationNumber}</span>
            <h3>Deviation detail</h3>
            <span className="sp" />
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => go('replay', { v: selected.registrationNumber })}
            >
              <Ico n="play" s={12} />
              Replay trip
            </button>
          </>
        ) : (
          <h3>No trip selected</h3>
        )}
      </div>
      {selected && isCircuitousDetour(selected) && (
        <div
          style={{
            margin: '0 16px 12px 16px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: '#b91c1c',
          }}
        >
          <Ico n="alert" s={16} />
          <div>
            <strong>Circuitous Detour Detected:</strong> Asset deviated from corridor adding{' '}
            <strong>+{selected.extraKmEstimate || 15} km</strong>. Estimated fuel penalty:{' '}
            <strong>
              ~{((selected.extraKmEstimate || 15) / 3.8).toFixed(1)} L (
              {inr(selected.estimatedExtraCostInr || 1200)})
            </strong>
            .
          </div>
        </div>
      )}
      <div className="mapbox" style={{ minHeight: 420 }}>
        <div className="lmap" ref={containerRef} />
        <div className="ov chipcard legend" style={{ bottom: 14, left: 14 }}>
          <span>
            <i style={{ background: '#9A9AA5' }} />
            Planned corridor
          </span>
          <span>
            <i style={{ background: '#C2323A' }} />
            Actual path
          </span>
        </div>
      </div>
      {selected ? (
        <div className="perkm" style={{ margin: 0 }}>
          <div>
            <div className="k">Max off corridor</div>
            <div className="v">{Number(selected.maxOffKm || 0).toFixed(2)} km</div>
          </div>
          <div>
            <div className="k">Extra distance</div>
            <div className="v">+{selected.extraKmEstimate ?? '—'} km</div>
          </div>
          <div>
            <div className="k">Est. cost</div>
            <div className="v" style={{ color: '#C2323A' }}>
              {inr(selected.estimatedExtraCostInr || 0)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
