import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, CircleF, InfoWindowF, useLoadScript } from '@react-google-maps/api';
import {
  Warehouse,
  Plus,
  Truck,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import { useConfirm } from '../../components/ui/confirmContext';
import VehicleWarehouseService from '../../services/VehicleWarehouseService.js';
import RouteHubService from '../../services/RouteHubService.js';
import WarehouseDrawer from './WarehouseDrawer.jsx';
import AssignVehiclesDrawer from './AssignVehiclesDrawer.jsx';
import { filterWarehouses, centreOf } from './warehouseLogic.js';
import './VehicleWarehouses.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST = 'Asia/Kolkata';
const fromNow = (d) => (d ? dayjs.utc(d).tz(IST).fromNow() : '—');

const GMAPS_LIBS = ['places', 'geometry'];
const MAP_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
};

/**
 * Vehicle Warehouses — the declared yards a fleet operates out of.
 *
 * These are not cosmetic. A yard's geofence is mirrored into a CUSTOM GeofenceZone
 * on the backend, and the vehicle's exit/entry crossings of that boundary are what
 * will anchor trip start and end (backend docs/vehicle-warehouse-plan.md §6).
 * A yard pinned in the wrong place silently corrupts every trip anchored to it,
 * which is why the map is the primary input in the drawer, not an afterthought.
 */
export default function VehicleWarehousesPage() {
  const confirm = useConfirm();
  const { isLoaded: isMapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  const [warehouses, setWarehouses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [roster, setRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [drawer, setDrawer] = useState({ open: false, mode: 'create', initial: null });
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ warehouses: rows }, vehicleRows] = await Promise.all([
        VehicleWarehouseService.list({ limit: 500 }),
        RouteHubService.getVehicles().catch(() => []),
      ]);
      setWarehouses(rows);
      setVehicles(vehicleRows || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const warehousesById = useMemo(
    () => new Map(warehouses.map((w) => [String(w._id), w])),
    [warehouses],
  );
  const visible = useMemo(() => filterWarehouses(warehouses, query), [warehouses, query]);
  const selected = selectedId ? warehousesById.get(String(selectedId)) : null;
  const centre = useMemo(() => centreOf(visible), [visible]);

  // The roster is a live read off VehicleZoneState, so it is fetched per selection
  // rather than for every yard up front.
  const loadRoster = useCallback(async (id) => {
    if (!id) return setRoster(null);
    setRosterLoading(true);
    try {
      setRoster(await VehicleWarehouseService.liveRoster(id));
    } catch {
      setRoster(null);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoster(selectedId);
  }, [selectedId, loadRoster]);

  const handleSave = async (payload) => {
    try {
      if (drawer.mode === 'edit' && drawer.initial?._id) {
        await VehicleWarehouseService.update(drawer.initial._id, payload);
        toast.success('Warehouse updated');
      } else {
        const created = await VehicleWarehouseService.create(payload);
        toast.success('Warehouse created');
        if (created?._id) setSelectedId(created._id);
      }
      setDrawer({ open: false, mode: 'create', initial: null });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save warehouse');
    }
  };

  const handleDeactivate = async (w) => {
    const ok = await confirm({
      title: `Deactivate ${w.name}?`,
      body: 'The yard stops anchoring new trips and its geofence is switched off.',
      consequence: 'Vehicles still based here must be reassigned first.',
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      await VehicleWarehouseService.deactivate(w._id);
      toast.success('Warehouse deactivated');
      if (String(selectedId) === String(w._id)) setSelectedId(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not deactivate');
    }
  };

  const handleAssign = async (vehicleIds) => {
    try {
      const res = await VehicleWarehouseService.assignVehicles(selected._id, vehicleIds);
      toast.success(`${res?.assigned ?? vehicleIds.length} vehicle(s) assigned`);
      setAssignOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not assign vehicles');
    }
  };

  const handleUnassign = async (vehicleId) => {
    try {
      await VehicleWarehouseService.unassignVehicle(selected._id, vehicleId);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not unassign');
    }
  };

  const basedHere = useMemo(
    () =>
      selected
        ? vehicles.filter((v) => String(v.homeWarehouseId || '') === String(selected._id))
        : [],
    [vehicles, selected],
  );

  return (
    <PageShell
      title="Warehouses"
      count={warehouses.length}
      subtitle="Declared yards your vehicles are based at. Each yard's geofence anchors trip start and end."
      actions={
        <>
          <button type="button" className="pshell-btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'vwh-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="pshell-btn pshell-btn--primary"
            onClick={() => setDrawer({ open: true, mode: 'create', initial: null })}
          >
            <Plus size={15} /> New warehouse
          </button>
        </>
      }
      filters={
        <FilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search name, code or city…"
        />
      }
      footer={`Showing ${visible.length} of ${warehouses.length} warehouses`}
    >
      <div className="vwh-layout">
        <section className="vwh-list" aria-label="Warehouses">
          {loading && !warehouses.length ? (
            <p className="vwh-empty">Loading…</p>
          ) : !visible.length ? (
            <div className="vwh-empty-state">
              <Warehouse size={28} />
              <h3>No warehouses yet</h3>
              <p>
                Add the yards your trucks start and finish their trips at. Until then, trip
                start/end falls back to the dispatch time window.
              </p>
            </div>
          ) : (
            visible.map((w) => (
              <article
                key={w._id}
                className={`vwh-card${String(selectedId) === String(w._id) ? ' is-selected' : ''}${
                  w.isActive === false ? ' is-inactive' : ''
                }`}
              >
                <button
                  type="button"
                  className="vwh-card-main"
                  onClick={() => setSelectedId(w._id)}
                >
                  <div className="vwh-card-title">
                    <Warehouse size={16} />
                    <strong>{w.name}</strong>
                    {w.code ? <span className="vwh-chip">{w.code}</span> : null}
                    {w.isActive === false ? (
                      <span className="vwh-chip vwh-chip--muted">Inactive</span>
                    ) : null}
                  </div>
                  <div className="vwh-card-meta">
                    <span>
                      <MapPin size={12} /> {w.city || w.address || `${w.lat}, ${w.lng}`}
                    </span>
                    <span>
                      <Truck size={12} /> {w.vehicleCount ?? 0} based here
                    </span>
                    <span>{w.geofenceRadiusM} m radius</span>
                  </div>
                </button>
                <div className="vwh-card-actions">
                  <button
                    type="button"
                    className="vwh-icon-btn"
                    aria-label={`Edit ${w.name}`}
                    onClick={() => setDrawer({ open: true, mode: 'edit', initial: w })}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="vwh-icon-btn vwh-icon-btn--danger"
                    aria-label={`Deactivate ${w.name}`}
                    onClick={() => handleDeactivate(w)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="vwh-right">
          <div className="vwh-map">
            {isMapLoaded ? (
              <GoogleMap
                mapContainerStyle={MAP_STYLE}
                center={selected ? { lat: selected.lat, lng: selected.lng } : centre}
                zoom={selected ? 14 : 5}
                options={MAP_OPTIONS}
              >
                {visible
                  .filter((w) => w.lat != null && w.lng != null)
                  .map((w) => (
                    <React.Fragment key={w._id}>
                      <MarkerF
                        position={{ lat: w.lat, lng: w.lng }}
                        onClick={() => setSelectedId(w._id)}
                      />
                      <CircleF
                        center={{ lat: w.lat, lng: w.lng }}
                        radius={w.geofenceRadiusM}
                        options={{
                          strokeColor: '#2563eb',
                          strokeWeight: 1.5,
                          fillColor: '#2563eb',
                          fillOpacity: String(selectedId) === String(w._id) ? 0.2 : 0.08,
                        }}
                      />
                    </React.Fragment>
                  ))}
                {selected ? (
                  <InfoWindowF
                    position={{ lat: selected.lat, lng: selected.lng }}
                    onCloseClick={() => setSelectedId(null)}
                  >
                    <div className="vwh-iw">
                      <strong>{selected.name}</strong>
                      <span>{selected.vehicleCount ?? 0} vehicles based here</span>
                    </div>
                  </InfoWindowF>
                ) : null}
              </GoogleMap>
            ) : (
              <div className="vwh-map-loading">Loading map…</div>
            )}
          </div>

          {selected ? (
            <div className="vwh-detail">
              <header className="vwh-detail-head">
                <h3>{selected.name}</h3>
                <button
                  type="button"
                  className="vwh-btn vwh-btn--primary vwh-btn--sm"
                  onClick={() => setAssignOpen(true)}
                >
                  <Plus size={14} /> Assign vehicles
                </button>
              </header>

              <div className="vwh-detail-cols">
                <div>
                  <h4>
                    Based here <span className="vwh-count">{basedHere.length}</span>
                  </h4>
                  <ul className="vwh-mini-list">
                    {basedHere.map((v) => (
                      <li key={v._id}>
                        <span>{v.registrationNumber}</span>
                        <button
                          type="button"
                          className="vwh-link-btn"
                          onClick={() => handleUnassign(v._id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {!basedHere.length && <li className="vwh-empty-row">No vehicles assigned.</li>}
                  </ul>
                </div>

                <div>
                  <h4>
                    Inside right now{' '}
                    <span className="vwh-count">{roster?.inside?.length ?? 0}</span>
                  </h4>
                  {rosterLoading ? (
                    <p className="vwh-empty-row">Checking…</p>
                  ) : (
                    <ul className="vwh-mini-list">
                      {(roster?.inside || []).map((v) => (
                        <li key={v.vehicleId}>
                          <span>
                            {v.registrationNumber}
                            {/* A truck parked in a yard that is not its own is the
                                WAREHOUSE_MISMATCH case the trip close screen will
                                surface once anchoring lands. */}
                            {!v.isHomeWarehouse && (
                              <em className="vwh-warn" title="Not this vehicle's home yard">
                                <AlertTriangle size={11} /> visiting
                              </em>
                            )}
                          </span>
                          <span className="vwh-muted">{fromNow(v.enteredAt)}</span>
                        </li>
                      ))}
                      {!roster?.inside?.length && (
                        <li className="vwh-empty-row">
                          {roster?.note || 'No vehicles inside the geofence.'}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="vwh-hint">Select a warehouse to see its vehicles and live roster.</p>
          )}
        </section>
      </div>

      <WarehouseDrawer
        open={drawer.open}
        mode={drawer.mode}
        initial={drawer.initial}
        isMapLoaded={isMapLoaded}
        onClose={() => setDrawer({ open: false, mode: 'create', initial: null })}
        onSave={handleSave}
      />
      <AssignVehiclesDrawer
        open={assignOpen}
        warehouse={selected}
        vehicles={vehicles}
        warehousesById={warehousesById}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />
    </PageShell>
  );
}
