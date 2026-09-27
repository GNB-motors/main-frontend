import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup } from '../routeHubMap';
import { KpiRow, RefreshButton, TableEmpty } from '../routeHubShared.jsx';
import { downloadCsv, fmtDT, fmtT } from '../routeHubFormat';

const WINDOWS = [
  { value: 6, label: 'Last 6 hours' },
  { value: 12, label: 'Last 12 hours' },
  { value: 24, label: 'Last 24 hours' },
];

const minsOf = (sec) => Math.round((sec || 0) / 60);

/** Speed trace — the design's SVG chart, re-plotted against real timestamps. */
function SpeedChart({ fixes, events, threshold, from, to }) {
  const W = 1000;
  const H = 240;
  const pl = 36;
  const pb = 24;
  const max = 100;
  const t0 = from.getTime();
  const span = Math.max(1, to.getTime() - t0);
  const x = (ms) => pl + ((ms - t0) / span) * (W - pl - 8);
  const y = (s) => H - pb - (Math.min(s, max) / max) * (H - pb - 10);

  const d = fixes
    .filter((f) => f.speed != null)
    .map((f, i) => `${i ? 'L' : 'M'}${x(f.at).toFixed(1)} ${y(f.speed).toFixed(1)}`)
    .join('');

  const ticks = [0, 20, 40, 60, 80, 100];
  const xLabels = [];
  const stepMs = span / 6;
  for (let i = 0; i <= 6; i += 1) {
    const ms = t0 + stepMs * i;
    xLabels.push(
      <text
        key={ms}
        x={x(ms)}
        y={H - 6}
        textAnchor="middle"
        fontSize="10"
        fill="var(--fg-tertiary)"
      >
        {fmtT(new Date(ms)).replace(':00', '')}
      </text>,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Speed over time"
    >
      {ticks.map((s) => (
        <g key={s}>
          <line x1={pl} x2={W - 8} y1={y(s)} y2={y(s)} stroke="var(--border-subtle)" />
          <text x={pl - 6} y={y(s) + 3} textAnchor="end" fontSize="10" fill="var(--fg-tertiary)">
            {s}
          </text>
        </g>
      ))}
      {events.map((e) => {
        const sx = x(new Date(e.startAt).getTime());
        const ex = x(new Date(e.endAt).getTime());
        return (
          <g key={e.startAt}>
            <rect
              x={sx}
              y={10}
              width={Math.max(3, ex - sx)}
              height={H - pb - 10}
              fill="rgba(229,104,107,.18)"
            />
            <text
              x={(sx + ex) / 2}
              y={22}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#C2323A"
            >
              {e.maxSpeedKmh}
            </text>
          </g>
        );
      })}
      <path
        d={d}
        fill="none"
        stroke="#2F58EE"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={pl}
        x2={W - 8}
        y1={y(threshold)}
        y2={y(threshold)}
        stroke="#C2323A"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        vectorEffect="non-scaling-stroke"
      />
      {xLabels}
    </svg>
  );
}

export default function OverspeedView({ params, toast, setBadge }) {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(params.get('v') || '');
  const [thr, setThr] = useState(60);
  const [dur, setDur] = useState(3);
  const [win, setWin] = useState(24);

  const [fleet, setFleet] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const windowRef = useRef({ from: null, to: null });

  useEffect(() => {
    const ac = new AbortController();
    RouteHubService.getVehicles(ac.signal)
      .then(setVehicles)
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const run = useCallback(async () => {
    const to = new Date();
    const from = new Date(to.getTime() - win * 3600000);
    windowRef.current = { from, to };
    setLoading(true);
    setError(null);
    try {
      if (!selected) {
        const data = await RouteHubService.getFleetOverspeed({
          from: from.toISOString(),
          to: to.toISOString(),
          speedKmh: thr,
          durationSec: dur * 60,
        });
        setFleet(data);
        setDetail(null);
        setBadge('overspeed', data?.totals?.eventCount ?? 0);
      } else {
        const data = await RouteHubService.getOverspeedEvents({
          vehicleId: selected,
          from: from.toISOString(),
          to: to.toISOString(),
          speedKmh: thr,
          durationSec: dur * 60,
        });
        const trail = await RouteHubService.getTrail(
          data.registrationNumber ||
            vehicles.find((v) => v._id === selected)?.registrationNumber ||
            '',
          { from: from.toISOString(), to: to.toISOString(), limit: 5000 },
        ).catch(() => ({ points: [] }));
        setDetail({
          ...data,
          fixes: (trail.points || [])
            .filter((p) => p.speed != null)
            .map((p) => ({ at: new Date(p.eventDateTime).getTime(), speed: p.speed })),
        });
      }
    } catch (e) {
      setError(e?.detail || e?.message || 'Could not run the audit.');
    } finally {
      setLoading(false);
    }
  }, [selected, thr, dur, win, vehicles, setBadge]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, win]);

  const events = detail?.events || [];
  const rank = fleet?.vehicles || [];
  const totals = fleet?.totals || {};

  const kpis = useMemo(() => {
    if (detail) {
      const longest = events.reduce((a, e) => Math.max(a, minsOf(e.durationSec)), 0);
      const peak = events.reduce((a, e) => Math.max(a, e.maxSpeedKmh || 0), 0);
      const v = vehicles.find((x) => x._id === selected);
      return [
        {
          accent: 1,
          ic: 'gauge',
          l: 'Sustained events',
          v: events.length,
          s: `over ${thr} km/h for ${dur}+ min · last ${win} h`,
        },
        {
          ic: 'truck',
          l: 'Vehicle',
          v: v?.registrationNumber || detail.registrationNumber || '—',
          s: v?.model || 'connected fleet vehicle',
          c: 'var(--nova-rage-600)',
          tint: 'var(--nova-rage-a10)',
        },
        {
          ic: 'clock',
          l: 'Longest event',
          v: longest,
          u: 'min',
          s: 'continuous time over the limit',
          c: '#6A43D8',
          tint: 'rgba(106,67,216,.12)',
        },
        {
          ic: 'zap',
          l: 'Peak speed',
          v: peak || '—',
          u: peak ? 'km/h' : '',
          s: peak ? `${Math.round(peak - thr)} km/h over the limit` : 'no events in window',
          c: '#C2323A',
          tint: 'rgba(229,104,107,.14)',
          vc: peak ? '#C2323A' : undefined,
        },
      ];
    }
    return [
      {
        accent: 1,
        ic: 'gauge',
        l: 'Sustained events',
        v: totals.eventCount ?? 0,
        s: `over ${thr} km/h for ${dur}+ min · last ${win} h`,
      },
      {
        ic: 'truck',
        l: 'Vehicles flagged',
        v: totals.vehiclesFlagged ?? 0,
        u: `of ${totals.vehicleCount ?? rank.length}`,
        s: 'connected fleet vehicles',
        c: 'var(--nova-rage-600)',
        tint: 'var(--nova-rage-a10)',
      },
      {
        ic: 'clock',
        l: 'Longest event',
        v: minsOf(totals.longestDurationSec),
        u: 'min',
        s: 'continuous time over the limit',
        c: '#6A43D8',
        tint: 'rgba(106,67,216,.12)',
      },
      {
        ic: 'zap',
        l: 'Peak speed',
        v: totals.peakSpeedKmh || '—',
        u: totals.peakSpeedKmh ? 'km/h' : '',
        s: totals.peakSpeedKmh
          ? `${Math.round(totals.peakSpeedKmh - thr)} km/h over the limit`
          : 'no events in window',
        c: '#C2323A',
        tint: 'rgba(229,104,107,.14)',
        vc: totals.peakSpeedKmh ? '#C2323A' : undefined,
      },
    ];
  }, [detail, events, totals, rank.length, thr, dur, win, vehicles, selected]);

  const { containerRef, mapRef } = useLeafletMap({ scrollWheelZoom: false }, [Boolean(detail)]);

  const mapEvents = detail
    ? events.map((e) => ({ ...e, plate: detail.registrationNumber }))
    : rank.flatMap((r) => (r.events || []).map((e) => ({ ...e, plate: r.registrationNumber })));

  useLayerGroup(
    mapRef,
    (group, map) => {
      const pts = mapEvents.filter((e) => e.startLat != null && e.startLng != null);
      pts.forEach((e) => {
        L.circleMarker([e.startLat, e.startLng], {
          radius: 5 + Math.min(6, minsOf(e.durationSec)),
          color: '#fff',
          weight: 2,
          fillColor: e.maxSpeedKmh > thr + 15 ? '#C2323A' : '#F0AA48',
          fillOpacity: 0.95,
        })
          .bindTooltip(
            `${e.plate} · ${e.maxSpeedKmh} km/h · ${minsOf(e.durationSec)} min · ${fmtT(new Date(e.startAt))}`,
            { className: 'tag', direction: 'top' },
          )
          .addTo(group);
      });
      if (pts.length) {
        map.fitBounds(L.latLngBounds(pts.map((e) => [e.startLat, e.startLng])), {
          padding: [40, 40],
        });
      }
    },
    [mapEvents, thr],
  );

  const exportCsv = () => {
    const rows = [
      ['vehicle', 'started', 'duration_min', 'peak_kmh', 'avg_kmh', 'distance_km', 'threshold_kmh'],
    ].concat(
      mapEvents.map((e) => [
        e.plate,
        fmtDT(new Date(e.startAt)),
        minsOf(e.durationSec),
        e.maxSpeedKmh,
        e.avgSpeedKmh,
        e.distanceKm ?? '',
        thr,
      ]),
    );
    downloadCsv('overspeed-audit', rows);
    toast(`${rows.length - 1} rows exported`);
  };

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>Overspeed audit</h2>
          <p>
            Sustained overspeed recomputed from minute-level position history, so one-off spikes
            don&apos;t count as events.
          </p>
        </div>
        <div className="tools">
          <RefreshButton onClick={run} busy={loading} />
          <button type="button" className="btn" onClick={exportCsv}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

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

      <KpiRow items={kpis} />

      {error ? (
        <div className="card">
          <div className="empty">
            <span style={{ color: '#C56200' }}>
              <Ico n="alert" s={28} />
            </span>
            <b>Audit unavailable</b>
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="bento">
        {!detail ? (
          <>
            <div className="card s7">
              <div className="card-head">
                <h3>Fleet ranking</h3>
                <span className="hint">Select a vehicle to audit its speed trace</span>
              </div>
              <div className="tblwrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th className="num">Events</th>
                      <th className="num">Longest</th>
                      <th className="num">Peak</th>
                      <th className="num">Km over limit</th>
                      <th aria-label="Open" />
                    </tr>
                  </thead>
                  {rank.length ? (
                    <tbody>
                      {rank.map((r) => (
                        <tr
                          key={r.vehicleId}
                          className="click"
                          onClick={() => {
                            setSelected(r.vehicleId);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <td>
                            <span className="plate">{r.registrationNumber}</span>
                            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                              {r.model || '—'}
                            </div>
                          </td>
                          <td
                            className="num mono strong"
                            style={{ color: r.eventCount ? '#C56200' : 'var(--fg-tertiary)' }}
                          >
                            {r.eventCount}
                          </td>
                          <td className="num mono">
                            {r.longestDurationSec ? `${minsOf(r.longestDurationSec)} min` : '—'}
                          </td>
                          <td
                            className="num mono strong"
                            style={{ color: r.peakSpeedKmh ? '#C2323A' : 'var(--fg-tertiary)' }}
                          >
                            {r.peakSpeedKmh ? `${r.peakSpeedKmh} km/h` : '—'}
                          </td>
                          <td className="num mono">
                            {r.distanceKm ? Number(r.distanceKm).toFixed(1) : '—'}
                          </td>
                          <td className="num">
                            <span className="go" style={{ display: 'inline-grid' }}>
                              <Ico n="arrowR" s={14} />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ) : (
                    <TableEmpty
                      colSpan={6}
                      title={loading ? 'Running audit…' : 'No sustained overspeed'}
                      sub={
                        loading
                          ? 'Recomputing from position history.'
                          : `Nothing stayed above ${thr} km/h for ${dur}+ minutes in this window.`
                      }
                    />
                  )}
                </table>
              </div>
            </div>
            <div className="card s5" style={{ minHeight: 460 }}>
              <div className="card-head">
                <h3>Where it happened</h3>
                <span className="hint">{mapEvents.length} events</span>
              </div>
              <div className="mapbox">
                <div className="lmap" ref={containerRef} />
              </div>
            </div>
          </>
        ) : (
          <>
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

            <div className="card s7">
              <div className="card-head">
                <h3>Events</h3>
                <span className="count-pill">{events.length}</span>
              </div>
              <div className="tblwrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Started</th>
                      <th className="num">Duration</th>
                      <th className="num">Peak</th>
                      <th className="num">Avg</th>
                      <th className="num">Distance</th>
                    </tr>
                  </thead>
                  {events.length ? (
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.startAt}>
                          <td className="mono">{fmtT(new Date(e.startAt))}</td>
                          <td className="num mono strong">{minsOf(e.durationSec)} min</td>
                          <td className="num mono strong" style={{ color: '#C2323A' }}>
                            {e.maxSpeedKmh} km/h
                          </td>
                          <td className="num mono">{e.avgSpeedKmh} km/h</td>
                          <td className="num mono">
                            {e.distanceKm != null ? `${Number(e.distanceKm).toFixed(1)} km` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ) : (
                    <TableEmpty
                      colSpan={5}
                      title="No sustained overspeed"
                      sub={`Nothing stayed above ${thr} km/h for ${dur}+ minutes in this window.`}
                    />
                  )}
                </table>
              </div>
            </div>

            <div className="card s5" style={{ minHeight: 380 }}>
              <div className="card-head">
                <h3>Event locations</h3>
              </div>
              <div className="mapbox">
                <div className="lmap" ref={containerRef} />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
