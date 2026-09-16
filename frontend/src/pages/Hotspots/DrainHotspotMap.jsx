import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { Droplets, Truck, RefreshCw, AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import { getDrainMap } from '../../services/HotspotService';
import { formatINR, formatLitres, formatNum } from '../../utils/formatters';
import { INDIA_CENTER } from '../LiveTracking/liveTracking.shared.js';
import {
  rangeFromDays,
  maxInrOf,
  bucketStyle,
  summariseBuckets,
  SEVERITY_TIERS,
} from './drainMapModel.js';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 260px)',
  minHeight: '440px',
  maxHeight: '620px',
};

const RANGE_OPTIONS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 180, label: 'Last 180 days' },
];

/**
 * Fuel Drain Hotspot Map (feature #8). Renders GET /api/hotspots/map buckets as
 * severity-coloured circles sized by litres lost. Clicking a cell reverse-
 * geocodes its centre ON DEMAND (never up front — the geocoding landmine) and
 * shows the count / vehicles / litres / ₹ for that cell.
 *
 * The map is fetched for the whole fleet over the chosen window; the service
 * also accepts a bbox for viewport-scoped fetching if we later want it.
 */
export default function DrainHotspotMap({ mapLoaded }) {
  const [rangeDays, setRangeDays] = useState(90);
  const [data, setData] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [addressByCell, setAddressByCell] = useState({});

  const load = useCallback(
    async (signal) => {
      setError(null);
      setData(null);
      try {
        const { from, to } = rangeFromDays(rangeDays);
        const res = await getDrainMap({ from, to, signal });
        setData(res || { buckets: [] });
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return;
        setError(err?.userMessage || err?.message || 'Failed to load the drain map');
        setData({ buckets: [] });
      }
    },
    [rangeDays],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const buckets = useMemo(() => data?.buckets ?? [], [data]);
  const maxInr = useMemo(() => maxInrOf(buckets), [buckets]);
  const summary = useMemo(() => summariseBuckets(buckets), [buckets]);

  const defaultCenter = useMemo(() => {
    const first = buckets[0];
    return first && Number.isFinite(first.centerLat) && Number.isFinite(first.centerLng)
      ? { lat: first.centerLat, lng: first.centerLng }
      : INDIA_CENTER;
  }, [buckets]);

  const selected = useMemo(
    () => buckets.find((b) => b.cell === selectedCell) || null,
    [buckets, selectedCell],
  );

  // On-demand reverse geocode of a single clicked cell centre (the landmine:
  // never geocode a position stream — only the one cell the operator opens).
  const onCellClick = useCallback(
    (bucket) => {
      setSelectedCell(bucket.cell);
      if (addressByCell[bucket.cell] || !window.google?.maps?.Geocoder) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: bucket.centerLat, lng: bucket.centerLng } },
        (results, status) => {
          const address =
            status === 'OK' && results?.[0] ? results[0].formatted_address : 'Address unavailable';
          setAddressByCell((prev) => ({ ...prev, [bucket.cell]: address }));
        },
      );
    },
    [addressByCell],
  );

  const loading = data === null;

  return (
    <div>
      <div className="hs-map-card">
        <div className="hs-map-head">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-sky-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Fuel Drain Hotspot Map
            </span>
          </div>

          <div className="hs-kpi-strip">
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-sky-50 text-sky-600 border border-sky-200">
                <MapPin size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Drain cells</span>
                <span className="hs-kpi-pill-value">{formatNum(summary.cells)}</span>
              </div>
            </div>
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-rose-50 text-rose-600 border border-rose-200">
                <Droplets size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Litres lost</span>
                <span className="hs-kpi-pill-value">{formatLitres(summary.totalLitres)}</span>
              </div>
            </div>
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                <AlertTriangle size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Est. loss</span>
                <span className="hs-kpi-pill-value">{formatINR(summary.totalInr)}</span>
              </div>
            </div>
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-slate-100 text-slate-600 border border-slate-200">
                <Truck size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Vehicles</span>
                <span className="hs-kpi-pill-value">{formatNum(summary.vehicles)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="drain-range" className="sr-only">
              Time window
            </label>
            <select
              id="drain-range"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.days} value={o.days}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ov-btn"
              onClick={() => load()}
              title="Refresh drain map"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="hs-legend-group">
            {SEVERITY_TIERS.map((t) => (
              <span key={t.key} className="hs-legend-pill">
                <span className="hs-legend-dot" style={{ background: t.color }} />
                <span>{t.label}</span>
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && buckets.length === 0 && (
          <div className="hs-ambient-badge">
            <Droplets size={16} className="text-emerald-600" />
            <span>No fuel-drain events in this window</span>
          </div>
        )}

        {mapLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={buckets.length > 0 ? 7 : 5}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
          >
            {buckets.map((b) => {
              const style = bucketStyle(b, maxInr);
              return (
                <React.Fragment key={b.cell}>
                  <CircleF
                    center={{ lat: b.centerLat, lng: b.centerLng }}
                    radius={style.radiusMeters}
                    onClick={() => onCellClick(b)}
                    options={{
                      fillColor: style.color,
                      fillOpacity: 0.28,
                      strokeColor: style.color,
                      strokeOpacity: 0.85,
                      strokeWeight: 2,
                      clickable: true,
                    }}
                  />
                  <MarkerF
                    position={{ lat: b.centerLat, lng: b.centerLng }}
                    onClick={() => onCellClick(b)}
                    label={{
                      text: String(b.count),
                      color: '#0f172a',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}
                  />
                </React.Fragment>
              );
            })}

            {selected && (
              <InfoWindowF
                position={{ lat: selected.centerLat, lng: selected.centerLng }}
                onCloseClick={() => setSelectedCell(null)}
              >
                <div className="p-2 max-w-xs">
                  <h4 className="font-bold text-slate-900 text-sm">Fuel drain cell</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {addressByCell[selected.cell] || (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Resolving location…
                      </span>
                    )}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Events</dt>
                    <dd className="text-right font-semibold text-slate-800">
                      {formatNum(selected.count)}
                    </dd>
                    <dt className="text-slate-500">Litres lost</dt>
                    <dd className="text-right font-semibold text-slate-800">
                      {formatLitres(selected.totalLitres)}
                    </dd>
                    <dt className="text-slate-500">Est. loss</dt>
                    <dd className="text-right font-semibold text-rose-600">
                      {formatINR(selected.estimatedInr)}
                    </dd>
                    <dt className="text-slate-500">Vehicles</dt>
                    <dd className="text-right font-semibold text-slate-800">
                      {selected.vehicles?.length || selected.vehicleIds?.length || 0}
                    </dd>
                  </dl>
                  {selected.vehicles?.length > 0 && (
                    <p className="mt-2 text-[11px] leading-snug text-slate-500">
                      {selected.vehicles.slice(0, 8).join(', ')}
                      {selected.vehicles.length > 8 ? ` +${selected.vehicles.length - 8} more` : ''}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-slate-400">
                    ₹ is an estimate — review before acting.
                  </p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="h-[520px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
            Loading Google Map layers…
          </div>
        )}
      </div>
    </div>
  );
}
