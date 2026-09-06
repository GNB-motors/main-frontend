import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ShieldAlert, BellRing, EyeOff, Eye } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { useConfirm } from '../../components/ui/confirmContext';
import { listHotspots, dismissHotspot, activateHotspot, provenanceOf } from '../../services/HotspotService';

dayjs.extend(relativeTime);

/**
 * Hotspots — the theft/siphoning map (audit §5). Every customer's incidents
 * improve the map for every other customer; shared (network) hotspots carry
 * only aggregates and are never attributed to an org.
 *
 *   own-learned : amber   — clustered from YOUR fleet's theft alerts
 *   network     : blue    — learned across the whole network, aggregates only
 *   own-manual  : grey    — pinned by hand
 *
 * Trucks stopped inside a hotspot are flagged by the backend watch and
 * surface in the alert feed — this page links there rather than duplicating.
 */

const PROVENANCE_META = {
  'own-learned': { label: 'Learned from your fleet', color: '#D98E13', text: '#1F2937' },
  network: { label: 'Learned across the network', color: '#2E6FC0', text: '#FFFFFF' },
  'own-manual': { label: 'Added manually', color: '#7C8AA0', text: '#FFFFFF' },
};

const mapContainerStyle = { width: '100%', height: '480px' };

const formatLastIncident = (date) => (date ? dayjs(date).fromNow() : 'no incidents on record');

const HotspotsPage = () => {
  const confirm = useConfirm();
  const [hotspots, setHotspots] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      const rows = await listHotspots({ signal });
      setHotspots(Array.isArray(rows) ? rows : []);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return;
      setError(err?.userMessage || err?.message || 'Failed to load hotspots');
      setHotspots([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const active = useMemo(
    () => (hotspots || []).filter((h) => h.active !== false),
    [hotspots],
  );
  const dismissed = useMemo(
    () => (hotspots || []).filter((h) => h.active === false),
    [hotspots],
  );

  const defaultCenter = useMemo(() => {
    const first = active[0];
    return first ? { lat: first.centerLat, lng: first.centerLng } : { lat: 22.8, lng: 86.2 };
  }, [active]);

  const toggleActive = async (hotspot) => {
    const dismissing = hotspot.active !== false;
    const ok = await confirm({
      title: dismissing ? `Dismiss "${hotspot.name}"?` : `Restore "${hotspot.name}"?`,
      body: dismissing
        ? 'It disappears from the map and trucks stopping there stop raising hotspot alerts.'
        : 'It returns to the map and the watch resumes alerting on it.',
      confirmLabel: dismissing ? 'Dismiss hotspot' : 'Restore hotspot',
      danger: dismissing,
    });
    if (!ok) return;
    setBusyId(hotspot._id);
    try {
      if (dismissing) await dismissHotspot(hotspot._id);
      else await activateHotspot(hotspot._id);
      toast.success(dismissing ? 'Hotspot dismissed' : 'Hotspot restored');
      await load();
    } catch (err) {
      toast.error(err?.userMessage || err?.message || 'Failed to update hotspot');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell
      title="Theft Hotspots"
      subtitle="Fuel goes missing at the same places. Learned from your fleet and, anonymously, from the whole network."
      count={active.length}
      actions={(
        <Link to="/fleet-alerts" className="pshell-btn">
          <BellRing size={14} aria-hidden="true" />
          Stop alerts
        </Link>
      )}
    >
      <div className="hs-legend" aria-label="Legend">
        {Object.entries(PROVENANCE_META).map(([key, meta]) => (
          <span key={key} className="hs-legend-item">
            <span className="hs-legend-dot" style={{ background: meta.color }} aria-hidden="true" />
            {meta.label}
          </span>
        ))}
      </div>

      {error && (
        <div className="hs-error" role="alert">
          <ShieldAlert size={16} aria-hidden="true" /> {error}
          <button type="button" className="pshell-btn" onClick={() => load()}>Retry</button>
        </div>
      )}

      {!error && hotspots === null && <div className="hs-loading">Loading hotspots…</div>}

      {!error && hotspots !== null && hotspots.length === 0 && (
        <div className="hs-empty">
          <ShieldAlert size={22} aria-hidden="true" />
          <strong>No hotspots yet.</strong>
          <p>
            The network has learned nothing here so far — that is good news. When theft alerts
            cluster geographically, a hotspot appears here automatically, for you and (as
            anonymous aggregates) for every fleet on the network.
          </p>
        </div>
      )}

      {active.length > 0 && mapLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={7}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {active.map((h) => {
            const prov = provenanceOf(h);
            const meta = PROVENANCE_META[prov] || PROVENANCE_META['own-manual'];
            const isOwn = prov !== 'network';
            return (
              <React.Fragment key={h._id}>
                <CircleF
                  center={{ lat: h.centerLat, lng: h.centerLng }}
                  radius={h.radiusM || 500}
                  options={{
                    fillColor: meta.color,
                    fillOpacity: 0.18,
                    strokeColor: meta.color,
                    strokeOpacity: 0.9,
                    strokeWeight: 1.5,
                  }}
                />
                <MarkerF
                  position={{ lat: h.centerLat, lng: h.centerLng }}
                  onClick={() => setSelectedId(h._id)}
                />
                {selectedId === h._id && (
                  <InfoWindowF
                    position={{ lat: h.centerLat, lng: h.centerLng }}
                    onCloseClick={() => setSelectedId(null)}
                  >
                    <div className="hs-info">
                      <strong>{h.name}</strong>
                      <span className="hs-info-prov" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span>
                        {h.incidentCount || 0} incident{(h.incidentCount || 0) === 1 ? '' : 's'}
                        {' · '}last {formatLastIncident(h.lastIncidentAt)}
                      </span>
                      {isOwn && (
                        <button
                          type="button"
                          className="pshell-btn"
                          disabled={busyId === h._id}
                          onClick={() => toggleActive(h)}
                        >
                          <EyeOff size={13} aria-hidden="true" /> Dismiss
                        </button>
                      )}
                      {prov === 'network' && (
                        <small className="hs-info-privacy">
                          Aggregates only — contributing fleets are never identified.
                        </small>
                      )}
                    </div>
                  </InfoWindowF>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      )}

      {dismissed.length > 0 && (
        <section className="hs-dismissed" aria-label="Dismissed hotspots">
          <h3>Dismissed ({dismissed.length})</h3>
          <ul>
            {dismissed.map((h) => (
              <li key={h._id}>
                <span>{h.name}</span>
                <button
                  type="button"
                  className="pshell-btn"
                  disabled={busyId === h._id}
                  onClick={() => toggleActive(h)}
                >
                  <Eye size={13} aria-hidden="true" /> Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
};

export default HotspotsPage;
