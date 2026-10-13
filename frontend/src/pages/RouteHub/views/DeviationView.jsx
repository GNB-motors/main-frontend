import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import Ico from '../routeHubIcons.jsx';
import { L, useLeafletMap, useLayerGroup, pinIcon } from '../routeHubMap';
import { KpiRow, RefreshButton } from '../routeHubShared.jsx';
import { dkey, downloadCsv, fmtDT, inr } from '../routeHubFormat';
import { isOpen, normalisePlate } from './deviation/deviationRules.js';
import DeviationFilterBar from './deviation/DeviationFilterBar.jsx';
import DeviationFeed from './deviation/DeviationFeed.jsx';
import DeviationDetail from './deviation/DeviationDetail.jsx';

export default function DeviationView({ params, toast, setBadge, go }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState(params.get('q') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selId, setSelId] = useState(params.get('d') || null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const paramQ = params.get('q');
    if (paramQ !== null && paramQ !== undefined) {
      setQ(paramQ);
    }
  }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RouteHubService.getDeviationEvents({ limit: 200 });
      const rows = data.records || [];
      setRecords(rows);
      setBadge('deviation', rows.filter(isOpen).length);
    } catch (e) {
      setError(e?.message || 'Could not load deviation events.');
    } finally {
      setLoading(false);
    }
  }, [setBadge]);

  useEffect(() => {
    load();
  }, [load]);

  const first = loading && !records.length;
  const open = records.filter(isOpen);
  const reviewed = records.filter((d) => !isOpen(d));

  const rows = useMemo(
    () =>
      records.filter((d) => {
        if (status === 'open' && !isOpen(d)) return false;
        if (status === 'reviewed' && isOpen(d)) return false;
        if (q) {
          const matchPlate = normalisePlate(d.registrationNumber).includes(normalisePlate(q));
          const matchTrip = String(d.tripId || '')
            .toLowerCase()
            .includes(q.toLowerCase());
          const matchCorridor = String(d.corridorName || '')
            .toLowerCase()
            .includes(q.toLowerCase());
          if (!matchPlate && !matchTrip && !matchCorridor) return false;
        }
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
      toast(e?.message || 'Could not update the event');
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

      <KpiRow items={kpis} loading={first} />

      <DeviationFilterBar
        q={q}
        setQ={setQ}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        status={status}
        setStatus={setStatus}
        records={records}
        open={open}
        reviewed={reviewed}
      />

      <div className="split">
        <DeviationFeed
          rows={rows}
          selId={selId}
          setSelId={setSelId}
          first={first}
          error={error}
          toggleReview={toggleReview}
        />

        <DeviationDetail selected={selected} go={go} containerRef={containerRef} />
      </div>
    </section>
  );
}
