import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Route as RouteIcon,
  Truck,
  Home,
  AlertTriangle,
  RefreshCw,
  Radio,
  ShieldCheck,
  Eye,
  Sparkles,
  ArrowRight,
  Warehouse,
  MapPin,
  Clock,
  Gauge,
} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import VehicleTourService from '../../services/VehicleTourService.js';
import VehicleTourDetail from './VehicleTourDetail.jsx';
import {
  CLOSE_KIND_LABEL,
  SOURCE_LABEL,
  durationHours,
  formatDuration,
  filterTours,
} from './tourLogic.js';
import './VehicleTours.css';

const fmt = (d) => (d ? dayjs(d).format('DD MMM, HH:mm') : '—');

const DEMO_TOURS = [
  {
    _id: 'demo-tour-1',
    registrationNumber: 'WB25R9540',
    status: 'CLOSED',
    startedAt: dayjs().subtract(3, 'day').hour(8).minute(15).toISOString(),
    endedAt: dayjs().subtract(1, 'day').hour(17).minute(45).toISOString(),
    startWarehouse: { _id: 'wh-1', name: 'Kolkata Central Yard' },
    endWarehouse: { _id: 'wh-1', name: 'Kolkata Central Yard' },
    closeKind: 'HOME',
    distanceKm: 607.0,
    distanceSource: 'odometer',
    sideTripCount: 2,
    sideTripDistanceKm: 580.0,
    unattributedKm: 27.0,
    flags: [],
    telematics: {
      status: 'COMPUTED',
      actual: {
        totalTripKm: 607.0,
        fuelConsumedL: 145.2,
        fuelSource: 'SINK',
      },
      confidence: 'HIGH',
      warehouse: { anchored: true },
      computedAt: dayjs().subtract(1, 'day').hour(18).minute(0).toISOString(),
    },
    sideTrips: [
      {
        _id: 'st-1',
        tripNumber: 'TRP-2026-0891',
        fromLocation: 'Kolkata Central Yard',
        toLocation: 'Dankuni Hub',
        state: 'CLOSED',
        totalKm: 295.0,
      },
      {
        _id: 'st-2',
        tripNumber: 'TRP-2026-0892',
        fromLocation: 'Dankuni Hub',
        toLocation: 'Kolkata Central Yard',
        state: 'CLOSED',
        totalKm: 285.0,
      },
    ],
  },
  {
    _id: 'demo-tour-2',
    registrationNumber: 'WB11B1234',
    status: 'OPEN',
    startedAt: dayjs().subtract(18, 'hour').toISOString(),
    endedAt: null,
    startWarehouse: { _id: 'wh-1', name: 'Kolkata Central Yard' },
    endWarehouse: null,
    closeKind: null,
    distanceKm: null,
    distanceSource: 'none',
    sideTripCount: 1,
    sideTripDistanceKm: 185.0,
    unattributedKm: 0,
    flags: [],
    telematics: null,
    sideTrips: [
      {
        _id: 'st-3',
        tripNumber: 'TRP-2026-0904',
        fromLocation: 'Kolkata Central Yard',
        toLocation: 'Asansol Industrial Depot',
        state: 'RUNNING',
        totalKm: 185.0,
      },
    ],
  },
  {
    _id: 'demo-tour-3',
    registrationNumber: 'WB19H5678',
    status: 'CLOSED',
    startedAt: dayjs().subtract(5, 'day').hour(6).minute(30).toISOString(),
    endedAt: dayjs().subtract(3, 'day').hour(14).minute(10).toISOString(),
    startWarehouse: { _id: 'wh-2', name: 'Asansol Yard' },
    endWarehouse: { _id: 'wh-3', name: 'Haldia Port Yard' },
    endWarehouseId: 'wh-3',
    closeKind: 'DIFFERENT_WAREHOUSE',
    distanceKm: 412.0,
    distanceSource: 'road_snapped',
    sideTripCount: 1,
    sideTripDistanceKm: 380.0,
    unattributedKm: 32.0,
    flags: ['SIDE_TRIP_GAP'],
    telematics: {
      status: 'COMPUTED',
      actual: {
        totalTripKm: 412.0,
        fuelConsumedL: 108.5,
        fuelSource: 'SNAPSHOT',
      },
      confidence: 'LOW',
      warehouse: { anchored: false },
      computedAt: dayjs().subtract(3, 'day').hour(15).minute(0).toISOString(),
    },
    sideTrips: [
      {
        _id: 'st-4',
        tripNumber: 'TRP-2026-0870',
        fromLocation: 'Asansol Yard',
        toLocation: 'Haldia Docks',
        state: 'CLOSED',
        totalKm: 380.0,
      },
    ],
  },
  {
    _id: 'demo-tour-4',
    registrationNumber: 'NL01A9088',
    status: 'CLOSED',
    startedAt: dayjs().subtract(7, 'day').hour(10).minute(0).toISOString(),
    endedAt: dayjs().subtract(4, 'day').hour(19).minute(30).toISOString(),
    startWarehouse: { _id: 'wh-4', name: 'Siliguri Depot' },
    endWarehouse: { _id: 'wh-4', name: 'Siliguri Depot' },
    closeKind: 'HOME',
    distanceKm: 890.5,
    distanceSource: 'odometer',
    sideTripCount: 3,
    sideTripDistanceKm: 885.0,
    unattributedKm: 5.5,
    flags: [],
    telematics: {
      status: 'COMPUTED',
      actual: {
        totalTripKm: 890.5,
        fuelConsumedL: 215.0,
        fuelSource: 'SINK',
      },
      confidence: 'HIGH',
      warehouse: { anchored: true },
      computedAt: dayjs().subtract(4, 'day').hour(20).minute(15).toISOString(),
    },
    sideTrips: [
      {
        _id: 'st-5',
        tripNumber: 'TRP-2026-0810',
        fromLocation: 'Siliguri Depot',
        toLocation: 'Guwahati Hub',
        state: 'CLOSED',
        totalKm: 460.0,
      },
      {
        _id: 'st-6',
        tripNumber: 'TRP-2026-0811',
        fromLocation: 'Guwahati Hub',
        toLocation: 'Siliguri Depot',
        state: 'CLOSED',
        totalKm: 425.0,
      },
    ],
  },
];

/**
 * Vehicle Tours — the "main trip": one warehouse-to-warehouse cycle per row.
 *
 * This is deliberately a different thing from the ERP trip list. A truck that runs
 * Kolkata → Odisha → Chhattisgarh → Gujarat → Kolkata closes two or three ERP trips
 * along the way, but it is ONE cycle. The operator closing their trip does not close
 * the cycle — only coming back to a yard does.
 */
export default function VehicleToursPage() {
  const [tours, setTours] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tours: rows } = await VehicleTourService.list({ limit: 200 });
      setTours(rows);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load tours');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveTours = useMemo(() => (demoMode ? DEMO_TOURS : tours), [demoMode, tours]);

  const visible = useMemo(() => {
    const byText = filterTours(effectiveTours, query);
    if (!statusFilter.length) return byText;
    return byText.filter((t) => statusFilter.includes(t.status));
  }, [effectiveTours, query, statusFilter]);

  const totalCycles = effectiveTours.length;
  const openCount = useMemo(
    () => effectiveTours.filter((t) => t.status === 'OPEN').length,
    [effectiveTours],
  );
  const closedCount = totalCycles - openCount;
  const mismatchCount = useMemo(
    () => effectiveTours.filter((t) => t.closeKind === 'DIFFERENT_WAREHOUSE').length,
    [effectiveTours],
  );
  const totalDistanceKm = useMemo(() => {
    const sum = effectiveTours.reduce((acc, t) => acc + (Number(t.distanceKm) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [effectiveTours]);

  const openDetail = async (id) => {
    const demo = DEMO_TOURS.find((d) => d._id === id);
    if (demo) {
      setSelected(demo);
      return;
    }
    try {
      setSelected(await VehicleTourService.get(id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load that cycle');
    }
  };

  const handleRollup = async () => {
    if (selected?._id?.startsWith('demo-')) {
      toast.success('Simulated telematics audit rollup recomputed');
      return;
    }
    setBusy(true);
    try {
      await VehicleTourService.rollup(selected._id);
      toast.success('Recomputed');
      await openDetail(selected._id);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not recompute');
    } finally {
      setBusy(false);
    }
  };

  const handleShiftHome = async () => {
    if (selected?._id?.startsWith('demo-')) {
      toast.success('Simulated: Vehicle home warehouse updated to this yard');
      return;
    }
    setBusy(true);
    try {
      await VehicleTourService.shiftHome(selected._id);
      toast.success('Home warehouse updated — later cycles measure from this yard');
      await openDetail(selected._id);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not shift home warehouse');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = (value) =>
    setStatusFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  return (
    <PageShell
      title="Vehicle Tours"
      count={totalCycles}
      subtitle="One warehouse-to-warehouse cycle per row. ERP trips that ran inside a cycle are its side trips."
      actions={
        <>
          <button
            type="button"
            className={`pshell-btn ${demoMode ? 'pshell-btn--active-demo' : ''}`}
            onClick={() => setDemoMode((prev) => !prev)}
            title="Toggle sample tours demonstration dataset"
          >
            {demoMode ? <Eye size={15} /> : <Sparkles size={15} />}
            {demoMode ? 'Hide Sample Data' : 'Preview Sample Tours'}
          </button>
          <button type="button" className="pshell-btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'vtour-spin' : ''} /> Refresh
          </button>
        </>
      }
      filters={
        <FilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search registration or status…"
          chips={[
            { key: 'OPEN', label: 'Still out', count: openCount },
            { key: 'CLOSED', label: 'Completed', count: closedCount },
          ]}
          selectedKeys={statusFilter}
          onToggleChip={toggleStatus}
          activeCount={statusFilter.length}
          onClear={() => setStatusFilter([])}
        />
      }
      footer={`Showing ${visible.length} of ${totalCycles} cycles ${demoMode ? '(Demo Mode)' : ''}`}
    >
      {/* 5-KPI Executive Strip */}
      <div className="vtour-kpi-grid">
        <div className="vtour-kpi-card">
          <div className="vtour-kpi-icon vtour-kpi-icon--blue">
            <RouteIcon size={18} />
          </div>
          <div className="vtour-kpi-content">
            <span className="vtour-kpi-title">Total Cycles</span>
            <div className="vtour-kpi-val-row">
              <span className="vtour-kpi-val">{totalCycles}</span>
              <span className="vtour-kpi-chip">{closedCount} closed</span>
            </div>
            <span className="vtour-kpi-sub">Warehouse-to-warehouse loops</span>
          </div>
        </div>

        <div className="vtour-kpi-card">
          <div className="vtour-kpi-icon vtour-kpi-icon--indigo">
            <Radio size={18} />
          </div>
          <div className="vtour-kpi-content">
            <span className="vtour-kpi-title">Still Out / Running</span>
            <div className="vtour-kpi-val-row">
              <span className="vtour-kpi-val">{openCount}</span>
              {openCount > 0 ? (
                <span className="vtour-kpi-badge vtour-kpi-badge--pulse">
                  <span className="vtour-pulse-dot" /> Active on road
                </span>
              ) : (
                <span className="vtour-kpi-chip">All in yard</span>
              )}
            </div>
            <span className="vtour-kpi-sub">Vehicles outside yard geofence</span>
          </div>
        </div>

        <div className="vtour-kpi-card">
          <div className="vtour-kpi-icon vtour-kpi-icon--emerald">
            <Home size={18} />
          </div>
          <div className="vtour-kpi-content">
            <span className="vtour-kpi-title">Completed Loops</span>
            <div className="vtour-kpi-val-row">
              <span className="vtour-kpi-val">{closedCount}</span>
              <span className="vtour-kpi-badge vtour-kpi-badge--success">Audited</span>
            </div>
            <span className="vtour-kpi-sub">Returned and safely parked</span>
          </div>
        </div>

        <div className="vtour-kpi-card">
          <div className="vtour-kpi-icon vtour-kpi-icon--amber">
            <AlertTriangle size={18} />
          </div>
          <div className="vtour-kpi-content">
            <span className="vtour-kpi-title">Yard Mismatches</span>
            <div className="vtour-kpi-val-row">
              <span className="vtour-kpi-val">{mismatchCount}</span>
              {mismatchCount > 0 ? (
                <span className="vtour-kpi-badge vtour-kpi-badge--warn">Shift candidate</span>
              ) : (
                <span className="vtour-kpi-chip">0 mismatches</span>
              )}
            </div>
            <span className="vtour-kpi-sub">Returned to a non-home depot</span>
          </div>
        </div>

        <div className="vtour-kpi-card">
          <div className="vtour-kpi-icon vtour-kpi-icon--purple">
            <Gauge size={18} />
          </div>
          <div className="vtour-kpi-content">
            <span className="vtour-kpi-title">Total Distance</span>
            <div className="vtour-kpi-val-row">
              <span className="vtour-kpi-val">{totalDistanceKm.toLocaleString()}</span>
              <span className="vtour-kpi-chip">km</span>
            </div>
            <span className="vtour-kpi-sub">Audited odometer telemetry</span>
          </div>
        </div>
      </div>

      {demoMode && (
        <div className="vtour-demo-banner">
          <div className="vtour-demo-banner-content">
            <Sparkles size={16} />
            <span>
              <strong>Sample Preview Active:</strong> Demonstrating 4 operational cycle patterns
              (completed loop, running cycle, yard mismatch, and multi-leg side trips). Click any
              row to test the full audit drawer.
            </span>
          </div>
          <button type="button" className="vtour-demo-exit-btn" onClick={() => setDemoMode(false)}>
            Exit Sample Mode
          </button>
        </div>
      )}

      {loading && !totalCycles ? (
        <p className="vtour-empty">Loading cycles…</p>
      ) : !visible.length ? (
        <div className="vtour-empty-state-card">
          <div className="vtour-empty-header">
            <div className="vtour-empty-icon-wrap">
              <RouteIcon size={26} />
            </div>
            <div>
              <h3>No Active Vehicle Tours Recorded</h3>
              <p>
                In GNB Motors, a <strong>Vehicle Tour</strong> is an automated operational cycle
                bounded by yard geofences. It starts when a vehicle departs its home yard and closes
                upon entering any recognized base.
              </p>
            </div>
          </div>

          <div className="vtour-lifecycle-grid">
            <div className="vtour-step-card">
              <div className="vtour-step-badge">Phase 1</div>
              <div className="vtour-step-header">
                <Home size={15} className="vtour-step-icon" />
                <strong>Yard Departure</strong>
              </div>
              <p>
                When an assigned vehicle drives beyond its base warehouse geofence, the telemetry
                engine auto-initiates a new Tour Cycle.
              </p>
            </div>

            <div className="vtour-step-card">
              <div className="vtour-step-badge">Phase 2</div>
              <div className="vtour-step-header">
                <Truck size={15} className="vtour-step-icon" />
                <strong>Highway Side Trips</strong>
              </div>
              <p>
                Multi-leg consignments, halts, and toll crossings are linked as sub-trips. Odometer
                deltas and fuel consumption are tracked continuously.
              </p>
            </div>

            <div className="vtour-step-card">
              <div className="vtour-step-badge">Phase 3</div>
              <div className="vtour-step-header">
                <MapPin size={15} className="vtour-step-icon" />
                <strong>Yard Arrival</strong>
              </div>
              <p>
                When the vehicle enters ANY warehouse geofence, the cycle closes. If it enters a
                different yard, a mismatch flag is logged.
              </p>
            </div>

            <div className="vtour-step-card">
              <div className="vtour-step-badge">Phase 4</div>
              <div className="vtour-step-header">
                <ShieldCheck size={15} className="vtour-step-icon" />
                <strong>Audit Rollup</strong>
              </div>
              <p>
                Actual odometer km, fuel meter sink readings, and unattributed gap km are computed
                and reconciled with high confidence.
              </p>
            </div>
          </div>

          <div className="vtour-empty-actions">
            <button
              type="button"
              className="vwh-btn vwh-btn--primary"
              onClick={() => setDemoMode(true)}
            >
              <Sparkles size={15} /> Preview Sample Tour Cycles (Demo)
            </button>
            <a href="/warehouses" className="vwh-btn">
              <Warehouse size={15} /> Configure Base Yards First
            </a>
          </div>
        </div>
      ) : (
        <div className="vtour-table-wrap">
          <table className="vtour-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Departure Yard & Time</th>
                <th>Return Yard & Time</th>
                <th>Duration</th>
                <th>Distance Covered</th>
                <th>ERP Side Trips</th>
                <th>Cycle Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const isOpen = t.status === 'OPEN';
                const kind = t.closeKind ? CLOSE_KIND_LABEL[t.closeKind] : null;
                return (
                  <tr key={t._id} onClick={() => openDetail(t._id)} className="vtour-row">
                    <td>
                      <div className="vtour-veh-cell">
                        <Truck size={14} className="vtour-veh-icon" />
                        <span className="vtour-plate-badge">{t.registrationNumber}</span>
                      </div>
                    </td>
                    <td aria-label={`Start: ${t.startWarehouse?.name || 'Yard Base'}`}>
                      <div className="vtour-cell-yard">
                        <span className="vtour-yard-name">
                          {t.startWarehouse?.name || 'Yard Base'}
                        </span>
                        <span className="vtour-cell-sub">
                          <Clock size={11} /> {fmt(t.startedAt)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isOpen ? (
                        <span className="vtour-running-tag">
                          <span className="vtour-pulse-dot" /> Still in transit
                        </span>
                      ) : (
                        <div className="vtour-cell-yard">
                          <span className="vtour-yard-name">
                            {t.endWarehouse?.name || 'Away from yard'}
                          </span>
                          <span className="vtour-cell-sub">
                            <Clock size={11} /> {fmt(t.endedAt)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="vtour-duration-chip">
                        {formatDuration(durationHours(t.startedAt, t.endedAt))}
                      </span>
                    </td>
                    <td>
                      {t.distanceKm != null ? (
                        <div className="vtour-dist-cell">
                          <strong>{t.distanceKm.toLocaleString()} km</strong>
                          <em className="vtour-src">{SOURCE_LABEL[t.distanceSource] || ''}</em>
                        </div>
                      ) : (
                        <span className="vtour-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="vtour-trips-chip">
                        {t.sideTripCount ?? 0} {t.sideTripCount === 1 ? 'trip' : 'trips'}
                      </span>
                    </td>
                    <td>
                      {isOpen ? (
                        <span className="vtour-pill vtour-pill--open">
                          <Radio size={11} className="vtour-spin" /> Running
                        </span>
                      ) : (
                        <span className={`vtour-pill vtour-pill--${kind?.tone || 'ok'}`}>
                          {kind?.tone === 'ok' ? <Home size={12} /> : <AlertTriangle size={12} />}
                          {kind?.text || t.closeKind}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VehicleTourDetail
        tour={selected}
        busy={busy}
        onClose={() => setSelected(null)}
        onRollup={handleRollup}
        onShiftHome={handleShiftHome}
      />
    </PageShell>
  );
}
