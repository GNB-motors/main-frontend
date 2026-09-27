import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, pinIcon } from '../routeHubMap';
import { KpiRow, RefreshButton, TableEmpty } from '../routeHubShared.jsx';
import { ago, dkey, downloadCsv, fmtDT, inr } from '../routeHubFormat';

const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'open', label: 'Please review', ic: 'alert', c: '#C56200' },
  { key: 'reviewed', label: 'Reviewed', ic: 'check', c: '#187A32' },
];

const isOpen = (d) => String(d.status || '').toUpperCase() === 'OPEN';

const normalisePlate = (s) =>
  String(s || '')
    .replace(/[-\s]/g, '')
    .toLowerCase();

export default function DeviationView({ params, toast, setBadge, go }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selId, setSelId] = useState(params.get('d') || null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RouteHubService.getDeviationEvents({ limit: 200 });
      const rows = data.records || [];
      setRecords(rows);
      setBadge('deviation', rows.filter(isOpen).length);
    } catch (e) {
      setError(e?.detail || e?.message || 'Could not load deviation events.');
    } finally {
      setLoading(false);
    }
  }, [setBadge]);

  useEffect(() => {
    load();
  }, [load]);

  const open = records.filter(isOpen);
  const reviewed = records.filter((d) => !isOpen(d));

  const rows = useMemo(
    () =>
      records.filter((d) => {
        if (status === 'open' && !isOpen(d)) return false;
        if (status === 'reviewed' && isOpen(d)) return false;
        if (q && !normalisePlate(d.registrationNumber).includes(normalisePlate(q))) return false;
        const day = d.detectedAt ? dkey(d.detectedAt) : null;
        if (from && (!day || day < from)) return false;
        if (to && (!day || day > to)) return false;
        return true;
      }),
    [records, status, q, from, to],
  );

  const selected = rows.find((d) => d._id === selId) || rows[0] || null;

  useEffect(() => {
    if (selected && selected._id !== selId) setSelId(selected._id);
  }, [selected, selId]);

  // The planned corridor and the driven path live in two different places, so
  // the detail panel assembles them per selection rather than with the feed.
  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    if (!selected) return undefined;
    (async () => {
      const [corridor, trail] = await Promise.all([
        selected.corridorId
          ? RouteHubService.getCorridor(selected.corridorId).catch(() => null)
          : Promise.resolve(null),
        selected.registrationNumber && (selected.startedAt || selected.detectedAt)
          ? RouteHubService.getTrail(selected.registrationNumber, {
              from: new Date(
                new Date(selected.startedAt || selected.detectedAt).getTime() - 30 * 60000,
              ).toISOString(),
              to: new Date(
                new Date(selected.endedAt || selected.detectedAt).getTime() + 30 * 60000,
              ).toISOString(),
              limit: 2000,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setDetail({
        planned: (corridor?.points || corridor?.path || [])
          .map((p) => (Array.isArray(p) ? p : [p.lat ?? p.latitude, p.lng ?? p.longitude]))
          .filter((p) => p[0] != null && p[1] != null),
        actual: (trail?.points || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => [p.latitude, p.longitude]),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const { containerRef, mapRef } = useLeafletMap({});

  useLayerGroup(
    mapRef,
    (group, map) => {
      if (!detail) return;
      const { planned, actual } = detail;
      if (planned.length) {
        L.polyline(planned, {
          color: '#9A9AA5',
          weight: 4,
          opacity: 0.8,
          dashArray: '2 8',
          lineCap: 'round',
        }).addTo(group);
      }
      if (actual.length) {
        L.polyline(actual, { color: '#C2323A', weight: 12, opacity: 0.14 }).addTo(group);
        L.polyline(actual, {
          color: '#C2323A',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
        }).addTo(group);
        L.marker(actual[0], { icon: pinIcon('#1E1E20', 'truck', 22) }).addTo(group);
        L.marker(actual[actual.length - 1], { icon: pinIcon('#1E1E20', 'pin', 22) }).addTo(group);
      }
      const all = planned.concat(actual);
      if (all.length) map.flyToBounds(L.latLngBounds(all), { padding: [60, 60], duration: 0.6 });
    },
    [detail],
  );

  const toggleReview = async (d) => {
    if (!isOpen(d)) {
      toast('Reopening is not supported by the API yet');
      return;
    }
    try {
      await RouteHubService.reviewDeviationEvent(d._id);
      toast(`${d.registrationNumber} marked reviewed`);
      load();
    } catch (e) {
      toast(e?.detail || 'Could not update the event');
    }
  };

  const kpis = [
    {
      ic: 'alert',
      l: 'Open — please review',
      v: open.length,
      s: 'trips pending triage',
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
      vc: '#C56200',
    },
    {
      ic: 'split',
      l: 'Events in window',
      v: records.length,
      s: 'corridor detours detected',
      c: 'var(--nova-rage-600)',
      tint: 'var(--nova-rage-a10)',
    },
    {
      ic: 'check',
      l: 'Reviewed',
      v: reviewed.length,
      s: 'triaged and confirmed',
      c: '#187A32',
      tint: 'rgba(37,186,76,.12)',
    },
    {
      ic: 'rupee',
      l: 'Est. detour cost',
      v: inr(open.reduce((a, d) => a + (d.estimatedExtraCostInr || 0), 0)),
      s: 'estimated fuel and wear impact · open',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: '#C2323A',
    },
  ];

  const exportCsv = () => {
    const out = [
      ['vehicle', 'trip_id', 'detected_at', 'max_off_km', 'extra_km', 'est_cost_inr', 'status'],
    ].concat(
      records.map((d) => [
        d.registrationNumber,
        d.tripId,
        d.detectedAt ? fmtDT(new Date(d.detectedAt)) : '',
        d.maxOffKm,
        d.extraKmEstimate,
        d.estimatedExtraCostInr,
        d.status,
      ]),
    );
    downloadCsv('route-deviation', out);
    toast(`${out.length - 1} rows exported`);
  };

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <a
            className="crumb"
            href="?tab=overview"
            onClick={(e) => {
              e.preventDefault();
              go('overview');
            }}
          >
            <Ico n="arrowL" s={14} />
            Route hub
          </a>
          <h2>
            Route deviation <span className="count-pill">{open.length}</span>
          </h2>
          <p>
            Trips that left their designated corridor. Cost figures are estimates; flags mark trips
            that need review.
          </p>
        </div>
        <div className="tools">
          <RefreshButton onClick={load} busy={loading} />
          <button type="button" className="btn" onClick={exportCsv}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

      <KpiRow items={kpis} />

      <div className="fbar">
        <label className="field grow">
          <Ico n="search" />
          <input
            type="search"
            placeholder="Search vehicle number (e.g. WB25R9540)…"
            value={q}
            onChange={(e) => setQ(e.target.value.trim())}
          />
        </label>
        <label className="field">
          <input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <span style={{ color: 'var(--fg-tertiary)', display: 'flex' }}>
          <Ico n="arrowR" s={14} />
        </span>
        <label className="field">
          <input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => {
            const n =
              f.key === 'all' ? records.length : f.key === 'open' ? open.length : reviewed.length;
            return (
              <button
                key={f.key}
                type="button"
                className="chip"
                aria-pressed={status === f.key}
                onClick={() => setStatus(f.key)}
              >
                {f.ic ? (
                  <span style={{ color: f.c, display: 'flex' }}>
                    <Ico n={f.ic} s={13} />
                  </span>
                ) : null}
                {f.label}
                <b>{n}</b>
              </button>
            );
          })}
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
              <Ico n="split" />
            </span>
            <h3>Corridor deviation feed</h3>
            <span className="count-pill">{rows.length} shown</span>
            <span className="sp" />
            <span className="hint">Select a row to see it on the map</span>
          </div>
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Trip ID</th>
                  <th>Detected at</th>
                  <th className="num">Max off corridor</th>
                  <th className="num">Extra km (est.)</th>
                  <th className="num">Est. cost</th>
                  <th>Status</th>
                  <th className="num">Action</th>
                </tr>
              </thead>
              {rows.length ? (
                <tbody>
                  {rows.map((d) => {
                    const at = d.detectedAt ? new Date(d.detectedAt) : null;
                    const hours = at ? (Date.now() - at.getTime()) / 3600000 : 0;
                    return (
                      <tr
                        key={d._id}
                        className={`click ${d._id === selId ? 'sel' : ''}`}
                        onClick={() => setSelId(d._id)}
                      >
                        <td>
                          <span className="plate">{d.registrationNumber}</span>
                        </td>
                        <td>
                          <span className="plate">
                            {String(d.tripId || '')
                              .slice(-6)
                              .padStart(7, '…')}
                          </span>
                        </td>
                        <td>
                          <span className="mono strong">{at ? fmtDT(at) : '—'}</span>
                          <div className="muted" style={{ fontSize: 11 }}>
                            {at ? ago(hours) : ''}
                          </div>
                        </td>
                        <td className="num mono strong">{Number(d.maxOffKm || 0).toFixed(2)} km</td>
                        <td className="num mono">+{d.extraKmEstimate ?? '—'} km</td>
                        <td className="num strong" style={{ color: '#C2323A' }}>
                          {inr(d.estimatedExtraCostInr || 0)}
                        </td>
                        <td>
                          {isOpen(d) ? (
                            <span
                              className="pill"
                              style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}
                            >
                              <Ico n="alert" s={11} />
                              Please review
                            </span>
                          ) : (
                            <span
                              className="pill"
                              style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}
                            >
                              <Ico n="check" s={11} />
                              Reviewed
                            </span>
                          )}
                        </td>
                        <td className="num">
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReview(d);
                            }}
                          >
                            {isOpen(d) ? (
                              <>
                                <Ico n="eye" s={14} />
                                Mark reviewed
                              </>
                            ) : (
                              'Reviewed'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={8}
                  title={loading ? 'Loading…' : error ? 'Feed unavailable' : 'No deviations match'}
                  sub={
                    error ||
                    (loading ? 'Fetching deviation events.' : 'Change the filters or date range.')
                  }
                  tone={error ? '#C56200' : '#187A32'}
                  icon={error ? 'alert' : 'check'}
                />
              )}
            </table>
          </div>
        </div>

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
      </div>
    </section>
  );
}
