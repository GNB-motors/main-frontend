import { Seg } from '../../routeHubShared.jsx';
import { EVC, PERSPECTIVES } from './replayConstants.js';

export default function ReplayPerspectiveBar({ persp, setPersp }) {
  return (
    <div className="card-head" style={{ paddingTop: 0 }}>
      <span className="hint">Replay perspective</span>
      <Seg options={PERSPECTIVES} value={persp} onChange={setPersp} />
      <span className="sp" />
      <div className="legend">
        <span>
          <i className="dot" style={{ background: EVC.stop }} />
          Stop
        </span>
        <span>
          <i className="dot" style={{ background: EVC.os }} />
          Overspeed
        </span>
        <span>
          <i className="dot" style={{ background: EVC.dev }} />
          Deviation
        </span>
        <span>
          <i className="dot" style={{ background: '#f59e0b', border: '1px dashed #d97706' }} />
          GSM Dead-Zone Bridge
        </span>
      </div>
    </div>
  );
}
