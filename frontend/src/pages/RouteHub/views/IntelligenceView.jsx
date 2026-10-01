import React, { useCallback, useEffect, useState } from 'react';
import RoadService from '../../../services/RoadService';
import { RefreshButton, Empty } from '../routeHubShared.jsx';
import { istHourOfWeek, howLabel } from '../intelligenceFormat.js';

/**
 * Route Hub "Intelligence" tab (ROAD_INTELLIGENCE plan Task P5.6): the road edges our own trucks proved
 * congested at the chosen hour (maths R22), pooled across organisations under the R8 publish rule. Replaces
 * the old corridor-time page, which bucketed hours in UTC (maths R6 warning) on a different pipeline.
 */
export default function IntelligenceView() {
  const [how, setHow] = useState(() => istHourOfWeek());
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('loading'); // loading | ok | off | error

  const load = useCallback(async (hour) => {
    setLoading(true);
    try {
      const status = await RoadService.getEngineStatus();
      if (!status || !status.enabled) {
        setState('off');
        setRows(null);
        return;
      }
      const data = await RoadService.getCongestion({ how: hour, limit: 50 });
      setRows(data?.rows ?? []);
      setState('ok');
    } catch {
      setState('error');
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(how);
  }, [how, load]);

  return (
    <section className="view" data-testid="intelligence-view">
      <div className="phead">
        <div className="t">
          <h2>Congestion intelligence</h2>
          <p>Where our own trucks slow down, hour by hour — no third-party traffic feed.</p>
        </div>
        <div className="tools">
          <RefreshButton onClick={() => load(how)} busy={loading} />
        </div>
      </div>

      <div className="ctrlbar">
        <label className="flabel">
          <span>Hour (IST)</span>
          <span className="field">
            <select
              aria-label="Hour (IST)"
              value={how}
              onChange={(e) => setHow(Number(e.target.value))}
            >
              {Array.from({ length: 168 }, (_, h) => (
                <option key={h} value={h}>
                  {howLabel(h)}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>{howLabel(how)}</h3>
        </div>
        {state === 'off' ? (
          <Empty
            icon="route"
            tone="#6B7280"
            title="Road engine off"
            sub="Congestion appears once our own matching runs."
          />
        ) : state === 'error' ? (
          <Empty
            icon="alert"
            tone="#C56200"
            title="Unavailable"
            sub="Could not load congestion data."
          />
        ) : state === 'loading' || rows === null ? (
          <Empty icon="clock" tone="#6B7280" title="Loading" />
        ) : rows.length === 0 ? (
          <Empty
            title="Typical for this hour"
            sub="Nothing congested at this hour with enough evidence."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Road class</th>
                <th>Region</th>
                <th>Congestion</th>
                <th>Typical speed</th>
                <th>Free flow</th>
                <th>Evidence (rows)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.edgeKey} data-testid="congestion-row">
                  <td>{r.roadClass}</td>
                  <td>{r.region}</td>
                  <td>{r.congestionIndex}× slower</td>
                  <td>{r.speedKmhNow} km/h</td>
                  <td>{r.speedKmhFreeFlow} km/h</td>
                  <td>{r.evidenceRows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="dim" style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>
        Pooled across organisations under the sharing rule; edges with few past trips never appear
        here.
      </p>
    </section>
  );
}
