import Ico from '../../routeHubIcons.jsx';
import { WINDOWS } from './overspeedHelpers.js';

export default function OverspeedControls({
  selected,
  setSelected,
  vehicles,
  thr,
  setThr,
  dur,
  setDur,
  win,
  setWin,
  run,
  loading,
}) {
  return (
    <div className="ctrlbar">
      <label className="flabel">
        <span>Vehicle</span>
        <span className="field">
          <Ico n="search" />
          <select
            aria-label="Vehicle"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">All vehicles (fleet ranking)</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber}
                {v.model ? ` · ${v.model}` : ''}
              </option>
            ))}
          </select>
        </span>
      </label>
      <label className="flabel">
        <span>Over speed (km/h)</span>
        <span className="field">
          <input
            aria-label="Over speed threshold in km/h"
            type="number"
            min="30"
            max="120"
            value={thr}
            onChange={(e) => setThr(Number(e.target.value) || 60)}
          />
        </span>
      </label>
      <label className="flabel">
        <span>Min duration (min)</span>
        <span className="field">
          <input
            aria-label="Minimum duration in minutes"
            type="number"
            min="1"
            max="30"
            value={dur}
            onChange={(e) => setDur(Number(e.target.value) || 3)}
          />
        </span>
      </label>
      <label className="flabel">
        <span>Time window</span>
        <span className="field">
          <select
            aria-label="Time window"
            value={win}
            onChange={(e) => setWin(Number(e.target.value))}
          >
            {WINDOWS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </span>
      </label>
      <button type="button" className="btn btn--primary" style={{ height: 38 }} onClick={run}>
        <Ico n="gauge" />
        {loading ? 'Running…' : 'Run audit'}
      </button>
    </div>
  );
}
