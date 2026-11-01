/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The table's scroll region needs keyboard focus for arrow-key scrolling. */
import React, { useEffect, useState } from 'react';
import RoadService from '../../../services/RoadService';
import { RefreshButton, Empty, TableSkeleton } from '../routeHubShared.jsx';
import { istHourOfWeek, howLabel } from '../intelligenceFormat.js';

/**
 * Route Hub "Intelligence" tab (ROAD_INTELLIGENCE plan Task P5.6): the road edges our own trucks proved
 * congested at the chosen hour (maths R22), pooled across organisations under the R8 publish rule. Replaces
 * the old corridor-time page, which bucketed hours in UTC (maths R6 warning) on a different pipeline.
 */
const CONGESTION_COLUMNS = [
  { label: 'Road class' },
  {
    label: 'Area reference',
    hint: 'Area references group nearby road segments; they are not place names.',
  },
  { label: 'Slowdown', numeric: true, hint: 'Travel time compared with free-flow conditions.' },
  { label: 'Typical speed', numeric: true },
  { label: 'Free-flow speed', numeric: true },
  {
    label: 'Baseline samples',
    numeric: true,
    hint: 'Historical night-time observations supporting the free-flow estimate.',
  },
];

export default function IntelligenceView() {
  const [how, setHow] = useState(() => istHourOfWeek());
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('loading'); // loading | ok | off | error
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setState('loading');
    setRows(null);
    const load = async () => {
      try {
        const status = await RoadService.getEngineStatus();
        if (signal.aborted) return;
        if (!status?.enabled) {
          setState('off');
          return;
        }
        const data = await RoadService.getCongestion({ how, limit: 50 }, signal);
        if (signal.aborted) return;
        setRows(data?.rows ?? []);
        setState('ok');
      } catch {
        if (signal.aborted) return;
        setState('error');
        setRows(null);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [how, refreshKey]);

  return (
    <section className="view intelligence-view" data-testid="intelligence-view">
      <div className="phead">
        <div className="t">
          <h2>Congestion intelligence</h2>
          <p>Typical road slowdowns from recorded fleet journeys, by hour of the week.</p>
        </div>
        <div className="tools">
          <RefreshButton onClick={() => setRefreshKey((key) => key + 1)} busy={loading} />
        </div>
      </div>

      <div className="ctrlbar intelligence-controls">
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
        <p className="intelligence-context">
          Compare typical travel speeds with free-flow conditions for the selected hour.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="intelligence-heading">
            <h3>Congested road segments</h3>
            <span className="hint">{howLabel(how)} · Highest slowdown first</span>
          </div>
          <span className="sp" />
          {state === 'ok' && rows && (
            <span className="intelligence-count">
              {rows.length} segment{rows.length === 1 ? '' : 's'}
            </span>
          )}
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
        ) : state === 'ok' && rows?.length === 0 ? (
          <Empty
            title="Typical for this hour"
            sub="Nothing congested at this hour with enough evidence."
          />
        ) : (
          <div
            className="tblwrap intelligence-table-scroll"
            role="region"
            aria-label="Congestion road segments"
            tabIndex={0}
            aria-busy={loading}
          >
            <table className="tbl intelligence-table" aria-label={`Congestion at ${howLabel(how)}`}>
              <thead>
                <tr>
                  {CONGESTION_COLUMNS.map((c) => (
                    <th
                      key={c.label}
                      scope="col"
                      className={c.numeric ? 'num' : undefined}
                      title={c.hint}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              {loading || rows === null ? (
                <TableSkeleton cols={CONGESTION_COLUMNS.length} rows={6} />
              ) : (
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.edgeKey} data-testid="congestion-row">
                      <td className="intelligence-road-class">
                        {r.roadClass?.replaceAll('_', ' ') || 'Unclassified'}
                      </td>
                      <td className="mono muted">{r.region || '—'}</td>
                      <td className="num">
                        <span className="intelligence-slowdown">
                          {r.congestionIndex != null ? `${r.congestionIndex}× slower` : '—'}
                        </span>
                      </td>
                      <td className="num strong">
                        {r.speedKmhNow != null ? `${r.speedKmhNow} km/h` : '—'}
                      </td>
                      <td className="num muted">
                        {r.speedKmhFreeFlow != null ? `${r.speedKmhFreeFlow} km/h` : '—'}
                      </td>
                      <td className="num">{r.evidenceRows?.toLocaleString('en-IN') ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
        {state === 'ok' && rows?.length > 0 && (
          <div className="intelligence-table-footer">
            Showing up to 50 road segments. Each row is one segment; area references can repeat.
          </div>
        )}
      </div>

      <p className="intelligence-note">
        Based on shared fleet observations with sufficient evidence. These are typical patterns for
        the selected hour, not live traffic readings.
      </p>
    </section>
  );
}
