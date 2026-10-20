import { fmtT } from '../../routeHubFormat';

export default function ReplayHud({ frame, limitKmh, erpTripId }) {
  return (
    <div className="ov hud">
      <div>
        <div className="k">Time</div>
        <div className="v" style={{ fontSize: 'var(--type-s)' }}>
          {frame ? fmtT(frame.at) : '—'}
        </div>
      </div>
      <div>
        <div className="k">Speed</div>
        <div
          className="v"
          style={{ color: (frame?.speed || 0) > limitKmh ? '#C2323A' : 'inherit' }}
        >
          {frame ? frame.speed : '—'}{' '}
          <span style={{ fontSize: 11, color: 'var(--fg-secondary)', fontWeight: 500 }}>km/h</span>
        </div>
      </div>
      <div>
        <div className="k">Covered</div>
        <div className="v">
          {frame ? frame.km.toFixed(0) : '—'}{' '}
          <span style={{ fontSize: 11, color: 'var(--fg-secondary)', fontWeight: 500 }}>km</span>
        </div>
      </div>
      {Boolean(frame?.gapType || (frame?.speed === 0 && erpTripId)) && (
        <div>
          <div className="k" style={{ color: '#d97706' }}>
            Signal Bridge
          </div>
          <div className="v" style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
            📡 GSM Cell-Tower
          </div>
        </div>
      )}
    </div>
  );
}
