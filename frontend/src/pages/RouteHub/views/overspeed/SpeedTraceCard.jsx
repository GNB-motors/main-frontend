import Ico from '../../routeHubIcons.jsx';
import SpeedChart from './SpeedChart.jsx';

export default function SpeedTraceCard({ detail, setSelected, win, thr, events, windowRef }) {
  return (
    <div className="card s12">
      <div className="card-head">
        <button type="button" className="btn btn--sm" onClick={() => setSelected('')}>
          <Ico n="arrowL" s={14} />
          All vehicles
        </button>
        <span className="plate">{detail.registrationNumber}</span>
        <h3>Speed trace</h3>
        <span className="hint">last {win} h</span>
        <span className="sp" />
        <div className="legend">
          <span>
            <i style={{ background: '#2F58EE' }} />
            Speed
          </span>
          <span>
            <i style={{ background: '#C2323A' }} />
            Limit {thr} km/h
          </span>
          <span>
            <i style={{ background: 'rgba(229,104,107,.25)', height: 10 }} />
            Sustained event
          </span>
        </div>
      </div>
      <div className="chart">
        {detail.fixes?.length && windowRef.current.from ? (
          <SpeedChart
            fixes={detail.fixes}
            events={events}
            threshold={thr}
            from={windowRef.current.from}
            to={windowRef.current.to}
          />
        ) : (
          <div className="empty">
            <b>No speed trace</b>
            <span>No position fixes for this vehicle in the window.</span>
          </div>
        )}
      </div>
    </div>
  );
}
