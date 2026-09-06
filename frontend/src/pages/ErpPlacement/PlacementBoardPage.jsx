/**
 * Placement Board (ISOCL ERP Stage 3)
 *
 * An order-fulfilment workspace, not a vehicle inventory page. The question
 * being answered is "how do I fulfil THIS delivery order", so the order is
 * picked first and everything below is scoped to it:
 *
 *   select order → see the requirement → assign fleet → hire if short
 *
 * Hire is deliberately not a peer of fleet placement. It sits with the fleet it
 * is an alternative to, as a secondary action, and is promoted to a primary
 * gap-sized button in the coverage bar only when the fleet actually falls short.
 * It is never offered from the page header, and never once the order is placed.
 *
 * Vehicles are filtered by availability and material compatibility — never by
 * capacity. A 20 KL tanker against a 100 KL order is normal: the balance draws
 * down across several placements, and capacity only produces an advisory when a
 * single planned quantity exceeds one tanker.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck, CheckCircle2, XCircle, CalendarClock, ArrowRight, ArrowLeft, AlertTriangle, Search, Plus,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PlacementService from './PlacementService';
import PlacementDrawer from './PlacementDrawer';
import CancelPlacementDrawer from './CancelPlacementDrawer';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import DeliveryOrderService from '../ErpDeliveryOrders/DeliveryOrderService';
import '../../styles/erp.css';

const BOARD_STATE_LABEL = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On trip',
  WAITING_UNLOAD: 'Waiting to unload',
  MAINTENANCE: 'In maintenance',
};

const BOARD_STATE_TONE = {
  AVAILABLE: 'success',
  ON_TRIP: 'open',
  WAITING_UNLOAD: 'warning',
  MAINTENANCE: 'danger',
};

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');
const dateLabel = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

const PlacementBoardPage = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [orders, setOrders] = useState([]);
  /* Orders still in an approval queue. Kept out of `orders` on purpose: they
     cannot be placed yet (placement.service rejects anything not PENDING or
     PARTIAL), so they must not reach the queue, the counts, or the change-order
     dropdown. They are shown only so that raising a DO does not look like
     nothing happened. */
  const [awaitingApproval, setAwaitingApproval] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [selectedDoId, setSelectedDoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [target, setTarget] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [queueSearch, setQueueSearch] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [sortBy, setSortBy] = useState('LOADING_POINT');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showEveryRow, setShowEveryRow] = useState(false);

  const fetchBoard = useCallback(async (doId) => {
    setLoading(true);
    try {
      const res = await PlacementService.getBoard({ doId: doId || undefined });
      setBoard(res.data);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Placement is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [pending, partial, awaiting] = await Promise.all([
        DeliveryOrderService.getOrders({ status: 'PENDING', limit: 100 }),
        DeliveryOrderService.getOrders({ status: 'PARTIAL', limit: 100 }),
        DeliveryOrderService.getOrders({ status: 'PENDING_APPROVAL', limit: 100 }),
      ]);
      setOrders([...(pending.data || []), ...(partial.data || [])]);
      setAwaitingApproval(awaiting.data || []);
    } catch {
      setOrders([]);
      setAwaitingApproval([]);
    }
    try {
      const res = await ErpMasterService.getVendors({ status: 'ACTIVE', limit: 200 });
      setVendors(res.data || []);
    } catch {
      setVendors([]);
    }
  }, []);

  /** What is already assigned to this order — the "placed so far" list. */
  const fetchPlaced = useCallback(async (doId) => {
    if (!doId) {
      setPlaced([]);
      return;
    }
    try {
      const res = await PlacementService.getPlacements({ doId, limit: 50 });
      setPlaced(res.data || []);
    } catch {
      setPlaced([]);
    }
  }, []);

  useEffect(() => {
    fetchBoard(selectedDoId);
    fetchPlaced(selectedDoId);
  }, [fetchBoard, fetchPlaced, selectedDoId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // The board's copy is authoritative once a DO is picked — it is read inside
  // the same request that computed compatibility, so it cannot be a page behind.
  const order = board?.deliveryOrder || null;
  const drivers = board?.spareDrivers || [];

  const required = order?.qty ?? 0;
  const remaining = order?.balanceQty ?? 0;
  const done = Math.max(0, required - remaining);
  const pct = required > 0 ? Math.round((done / required) * 100) : 0;

  /** Every tanker on the board, flattened out of its location grouping. */
  const tankers = useMemo(
    () => (board?.locations || []).flatMap((loc) => loc.tankers || []),
    [board],
  );

  /**
   * Assignable now. Compatibility is only computed when a DO is selected, so
   * `isCompatible === null` means "not evaluated" rather than "incompatible".
   */
  const eligible = useMemo(
    () => tankers.filter((t) => t.isAvailable && t.isCompatible !== false),
    [tankers],
  );

  const locations = useMemo(
    () => [...new Set(tankers.map((t) => t.location).filter(Boolean))].sort(),
    [tankers],
  );

  /**
   * Ordering. "Nearest to origin" is deliberately not offered: nothing in the
   * data holds a vehicle-to-loading-point distance, and a made-up proximity on a
   * placement screen would be worse than no ordering at all. What can be said
   * truthfully is whether a tanker is already sitting AT the loading point,
   * which is an exact match, so that is the default.
   */
  const atLoadingPoint = (t) =>
    Boolean(order?.fromLocation)
    && String(t.location || '').toLowerCase() === String(order.fromLocation).toLowerCase();

  const visible = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    const base = (showAll ? tankers : eligible)
      .filter((t) => !locFilter || t.location === locFilter)
      .filter(
        (t) => !q
          || (t.registrationNumber || '').toLowerCase().includes(q)
          || (t.model || '').toLowerCase().includes(q),
      );

    return [...base].sort((a, b) => {
      if (sortBy === 'CAPACITY') return (b.capacity || 0) - (a.capacity || 0);
      if (sortBy === 'LOCATION') return String(a.location || '').localeCompare(String(b.location || ''));
      const av = atLoadingPoint(a) ? 0 : 1;
      const bv = atLoadingPoint(b) ? 0 : 1;
      if (av !== bv) return av - bv;
      return (b.capacity || 0) - (a.capacity || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, tankers, eligible, locFilter, sortBy, vehicleSearch, order]);

  const hidden = tankers.length - eligible.length;

  /**
   * A 300-tanker fleet rendered whole is 300 rows to scan for a decision that
   * needs about ten. The list is already ordered by usefulness — loading point
   * first — so the first page of it is the answer nearly every time; the rest is
   * one click away rather than gone.
   */
  const PAGE = 25;
  const rows = showEveryRow ? visible : visible.slice(0, PAGE);
  const notShown = visible.length - rows.length;

  /**
   * The placement queue, in the order the work should be done:
   *
   *   1. expiring soonest — an expired DO cannot be placed at all
   *   2. then nothing-placed before partly-placed — a partly-placed order is
   *      already moving, an untouched one is not
   *   3. then largest outstanding
   *
   * A dropdown of orders in creation order made the operator work this out for
   * themselves every morning.
   */
  const queue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    const matched = orders.filter(
      (o) => !q
        || (o.doNumber || '').toLowerCase().includes(q)
        || (o.partyId?.name || '').toLowerCase().includes(q)
        || (o.material || '').toLowerCase().includes(q),
    );
    return [...matched].sort((a, b) => {
      const ax = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bx = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      if (ax !== bx) return ax - bx;
      const started = (o) => (o.liftedQty > 0 ? 1 : 0);
      if (started(a) !== started(b)) return started(a) - started(b);
      return (b.balanceQty || 0) - (a.balanceQty || 0);
    });
  }, [orders, queueSearch]);

  const untouched = orders.filter((o) => !o.liftedQty).length;
  const started = orders.length - untouched;

  /** Whole days until a DO expires; negative once it has. */
  const daysToExpiry = (o) =>
    (o.expiryDate
      ? Math.ceil((new Date(o.expiryDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
      : null);

  /**
   * What the branch's own tankers could still carry. Capacity is not a hard
   * constraint — a placement may be for less than a tanker holds — so this is a
   * ceiling, not a promise. It decides how loudly to offer hire, never whether
   * hire is allowed.
   */
  const fleetCeiling = useMemo(
    () => eligible.reduce((sum, t) => sum + (t.capacity || 0), 0),
    [eligible],
  );
  const externalNeeded = Math.max(0, remaining - fleetCeiling);

  /**
   * The coverage bar pins itself over the vehicle rows, so it has to be worth
   * the space. It is, when there is a gap to close or the order is done. It is
   * not when the fleet already covers the balance: restating "remaining 20,
   * fleet 95, gap none" tells the operator nothing they cannot read off the
   * order card and the rows they are about to assign from.
   */
  const showCoverageBar = Boolean(order) && (remaining === 0 || externalNeeded > 0);

  /**
   * What one tanker would take: whichever of the outstanding balance and its own
   * capacity runs out first. Shown on the button so the operator knows the size
   * of the action before pressing it, and used as the drawer's default.
   */
  const assignQty = (t) => (t.capacity ? Math.min(remaining, t.capacity) : remaining);

  const closeDrawer = () => setTarget(null);

  const handlePlaced = () => {
    setTarget(null);
    fetchBoard(selectedDoId);
    fetchPlaced(selectedDoId);
    fetchOptions();
  };

  const reasons = (t) => {
    const list = [];
    list.push({
      ok: t.isAvailable,
      text: t.isAvailable ? 'No active trip' : BOARD_STATE_LABEL[t.boardState] || t.boardState,
    });
    if (t.isCompatible !== null) {
      list.push({
        ok: t.isCompatible,
        text: t.isCompatible
          ? t.requiresCleaning
            ? `Compatible after cleaning (last carried ${t.previousMaterial || 'nothing'})`
            : 'Material compatible'
          : t.incompatibleReason || 'Material not compatible',
      });
    }
    return list;
  };

  // The sticky fulfilment bar only exists once an order is selected.
  return (
    <div className={`erp-page ${showCoverageBar ? 'has-sticky-bar' : ''}`}>
      <div className="erp-header">
        <div>
          <h1>Placement Board</h1>
          <p className="erp-subtitle">
            Assign fleet or hired vehicles to delivery orders
          </p>
        </div>
      </div>

      {!selectedDoId ? (
        <>
          <h2 className="erp-section-heading">
            {orders.length} order{orders.length === 1 ? '' : 's'} awaiting placement
            {orders.length > 0 && (
              <>
                <span className="erp-badge info">{untouched} not started</span>
                {started > 0 && <span className="erp-badge purple">{started} partly placed</span>}
              </>
            )}
          </h2>

          {orders.length > 3 && (
            <div className="erp-toolbar" style={{ marginTop: 0 }}>
              <div className="erp-search">
                <input
                  type="search"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search order, customer or material…"
                  style={{ paddingLeft: 14 }}
                />
              </div>
            </div>
          )}

          <div className="erp-container">
            {queue.length === 0 ? (
              <div className="erp-state">
                <Truck size={48} />
                <p>
                  {queueSearch
                    ? 'Nothing matches that search'
                    : awaitingApproval.length > 0
                      ? 'Nothing to place yet'
                      : 'Nothing to place'}
                </p>
                <span className="erp-cell-muted">
                  {queueSearch
                    ? 'Clear the search to see the rest.'
                    : awaitingApproval.length > 0
                      ? `${awaitingApproval.length} order${awaitingApproval.length === 1 ? ' is' : 's are'} waiting on approval below. They move into this queue once approved.`
                      : 'Orders arrive here once a delivery order is raised and approved.'}
                </span>
              </div>
            ) : (
              <div className="erp-table-scroll">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Route</th>
                      <th>Requirement</th>
                      <th>Expires</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((o) => {
                      const left = o.balanceQty || 0;
                      const total = o.qty || 0;
                      const placedQty = Math.max(0, total - left);
                      const dte = daysToExpiry(o);
                      const urgent = dte !== null && dte <= 1;
                      return (
                        <tr
                          key={o._id}
                          className="clickable"
                          onClick={() => setSelectedDoId(o._id)}
                        >
                          <td>
                            <div className="erp-cell-strong">{o.partyId?.name || '—'}</div>
                            <div className="erp-cell-muted">
                              {o.doNumber} · {o.material}
                            </div>
                          </td>
                          <td className="erp-cell-muted">
                            {o.fromLocation || '—'} → {o.toLocation || '—'}
                          </td>
                          <td>
                            <div>{placedQty} / {total} {o.qtyUnit}</div>
                            <div className="erp-progress-track" style={{ marginTop: 4, height: 5 }}>
                              <span
                                className="erp-progress-fill"
                                style={{ width: `${total > 0 ? (placedQty / total) * 100 : 0}%` }}
                              />
                            </div>
                          </td>
                          <td>
                            {dte === null ? (
                              <span className="erp-cell-muted">—</span>
                            ) : (
                              <span className={`erp-badge ${urgent ? 'danger' : dte <= 3 ? 'warning' : 'neutral'}`}>
                                {urgent && <AlertTriangle size={11} />}
                                {dte < 0
                                  ? 'expired'
                                  : dte === 0
                                    ? 'today'
                                    : dte === 1
                                      ? 'tomorrow'
                                      : `${dte} days`}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setSelectedDoId(o._id)}
                            >
                              {placedQty > 0 ? 'Continue' : 'Start placement'}
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {notShown > 0 && (
                  <div className="erp-more-row">
                    <span className="erp-cell-muted">
                      Showing the {PAGE} most useful of {visible.length}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowEveryRow(true)}
                    >
                      Show all {visible.length}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Awaiting approval. Read-only by design: these orders exist, so the
              board must account for them, but nothing here can be placed until
              an approver releases them. No row click, no placement button. */}
          {awaitingApproval.length > 0 && (
            <>
              <h2 className="erp-section-heading">
                {awaitingApproval.length} order{awaitingApproval.length === 1 ? '' : 's'} awaiting approval
                <span className="erp-badge warning">
                  <Clock size={11} />
                  not placeable yet
                </span>
              </h2>

              <div className="erp-container">
                <div className="erp-table-scroll">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Route</th>
                        <th>Requirement</th>
                        <th>Raised</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awaitingApproval.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <div className="erp-cell-strong">{o.partyId?.name || '—'}</div>
                            <div className="erp-cell-muted">
                              {o.doNumber} · {o.material}
                            </div>
                          </td>
                          <td className="erp-cell-muted">
                            {o.fromLocation || '—'} → {o.toLocation || '—'}
                          </td>
                          <td>{o.qty} {o.qtyUnit}</td>
                          <td className="erp-cell-muted">{dateLabel(o.doDate || o.createdAt)}</td>
                          <td>
                            <span className="erp-badge warning">
                              <Clock size={11} />
                              Approval pending
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : loading ? (
        <div className="erp-container">
          <div className="erp-state"><p>Loading…</p></div>
        </div>
      ) : !order ? (
        <div className="erp-container">
          <div className="erp-state"><p>That order could not be loaded.</p></div>
        </div>
      ) : (
        <>
          {/* "Back" and "Change order" are the two things an operator actually
              wants here. The old "Clear" was neither — nobody sets out to have
              no order selected. */}
          <div className="erp-toolbar" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDoId('')}
            >
              <ArrowLeft size={15} />
              Back to placement queue
            </button>
            <select
              className="erp-filter"
              value={selectedDoId}
              onChange={(e) => setSelectedDoId(e.target.value)}
              style={{ minWidth: 340, marginLeft: 'auto' }}
              aria-label="Change delivery order"
            >
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.doNumber} · {o.partyId?.name} · {o.balanceQty} {o.qtyUnit} left
                </option>
              ))}
            </select>
          </div>

          {/* ── The requirement ─────────────────────────────────────────────── */}
          <section className="erp-order-card">
            <div className="erp-order-card-head">
              <div>
                <div className="erp-order-card-party">{order.partyId?.name || '—'}</div>
                <div className="erp-cell-muted">
                  {order.doNumber} · {order.fromLocation || '—'} → {order.toLocation || '—'} ·{' '}
                  {order.material} · sale rate {money(order.sbRate)}
                  {order.sbRateUnit ? `/${order.sbRateUnit.replace('PER_', '')}` : ''}
                </div>
              </div>
              <span
                className={`erp-badge ${remaining === 0 ? 'success' : done > 0 ? 'purple' : 'info'}`}
              >
                {remaining === 0
                  ? 'Fully placed'
                  : done > 0
                    ? 'Partially placed'
                    : 'Ready for placement'}
              </span>
            </div>

            <div className="erp-order-card-figures">
              <div>
                <span className="erp-order-figure-label">Required</span>
                <span className="erp-order-figure">{required} {order.qtyUnit}</span>
              </div>
              <div>
                <span className="erp-order-figure-label">Placed</span>
                <span className="erp-order-figure">{done} {order.qtyUnit}</span>
              </div>
              <div>
                <span className="erp-order-figure-label">Remaining</span>
                <span className="erp-order-figure is-remaining">
                  {remaining} {order.qtyUnit}
                </span>
              </div>
              {order.expiryDate && (
                <div>
                  <span className="erp-order-figure-label">Expires</span>
                  <span className="erp-order-figure is-small">{dateLabel(order.expiryDate)}</span>
                </div>
              )}
            </div>

            <div className="erp-progress-track">
              <span className="erp-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </section>

          {/* ── Already assigned ────────────────────────────────────────────── */}
          {placed.length > 0 && (
            <>
              <h2 className="erp-section-heading">Assigned to this order</h2>
              <div className="erp-container">
                <div className="erp-table-scroll">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Placement</th>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {placed.map((p) => (
                        <tr key={p._id}>
                          <td className="erp-cell-strong">{p.placementNumber}</td>
                          <td>
                            {p.vehicleId?.registrationNumber || p.hireVehicleNumber || '—'}
                            {p.vendorId?.name && (
                              <div className="erp-cell-muted">{p.vendorId.name}</div>
                            )}
                          </td>
                          <td className="erp-cell-muted">
                            {p.vehicleType === 'HIRE' ? 'Hired' : 'Own fleet'}
                          </td>
                          <td className="erp-numeric">{p.plannedQty} {order.qtyUnit}</td>
                          <td>
                            <span
                              className={`erp-badge ${p.status === 'PENDING_APPROVAL' ? 'warning' : 'open'}`}
                            >
                              {p.status === 'PENDING_APPROVAL' ? 'Awaiting approval' : p.status}
                            </span>
                          </td>
                          <td>
                            {/* Not "Undo": the server needs a reason and may
                                carry empty running forward, so this reverses a
                                real operational commitment. */}
                            <button
                              type="button"
                              className="erp-inline-link"
                              onClick={() => setCancelling(p)}
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── The fleet that can carry it ─────────────────────────────────── */}
          <h2 className="erp-section-heading">
            {showAll ? 'All tankers at this location' : 'Available fleet'}
          </h2>

          <div className="erp-toolbar" style={{ marginTop: 0 }}>
            <span className="erp-cell-muted">
              {eligible.length} of {tankers.length} can be assigned
              {hidden > 0 && !showAll && ` · ${hidden} hidden`}
            </span>

            <div className="erp-search" style={{ flex: '1 1 220px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="search"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Search vehicle number…"
              />
            </div>

            {locations.length > 1 && (
              <select
                className="erp-filter"
                value={locFilter}
                onChange={(e) => setLocFilter(e.target.value)}
                aria-label="Filter by location"
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}

            <select
              className="erp-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tankers"
            >
              <option value="LOADING_POINT">At the loading point first</option>
              <option value="CAPACITY">Largest capacity first</option>
              <option value="LOCATION">By location</option>
            </select>
            {/* Hire belongs beside the fleet it is an alternative to: the choice
                is "assign one of these, or bring in an outside vehicle", and
                that reads as one decision only when both sit together. */}
            <div className="erp-toolbar-actions">
              {hidden > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? 'Only assignable' : 'Show all, with reasons'}
                </button>
              )}
              {remaining > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTarget({ mode: 'HIRE', suggestedQty: remaining })}
                >
                  <Plus size={15} />
                  Hire vehicle
                </button>
              )}
            </div>
          </div>

          <div className="erp-container">
            {visible.length === 0 ? (
              <div className="erp-state">
                <Truck size={48} />
                <p>No tanker at this location can carry this order</p>
                <span className="erp-cell-muted">
                  {tankers.length === 0
                    ? 'No tankers on the board. Add vehicles with a capacity and base location.'
                    : 'Every tanker is on a trip, in maintenance, or carrying an incompatible material.'}
                </span>
              </div>
            ) : (
              <div className="erp-table-scroll">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Compatibility</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => {
                      const assignable = t.isAvailable && t.isCompatible !== false;
                      return (
                        <tr key={t.vehicleId}>
                          <td>
                            <div className="erp-cell-strong">{t.registrationNumber}</div>
                            {t.model && <div className="erp-cell-muted">{t.model}</div>}
                          </td>
                          <td>
                            {t.location}
                            {atLoadingPoint(t) && (
                              <div className="erp-badge success" style={{ marginTop: 2 }}>
                                at loading point
                              </div>
                            )}
                            {t.expectedFreeAt && (
                              <div className="erp-cell-muted">
                                <CalendarClock size={11} style={{ verticalAlign: '-1px' }} />{' '}
                                free {dateLabel(t.expectedFreeAt)}
                              </div>
                            )}
                          </td>
                          <td className="erp-numeric">
                            {t.capacity != null ? `${t.capacity} ${t.capacityUnit || ''}` : '—'}
                          </td>
                          <td>
                            <ul className="erp-reasons">
                              {reasons(t).map((r) => (
                                <li key={r.text} className={r.ok ? 'is-ok' : 'is-no'}>
                                  {r.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  {r.text}
                                </li>
                              ))}
                            </ul>
                            {t.carriedForwardAmount > 0 && (
                              <div className="erp-cell-muted">
                                carries {money(t.carriedForwardAmount)} empty running
                              </div>
                            )}
                          </td>
                          <td>
                            {assignable ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setTarget({ mode: 'OWN', tanker: t })}
                              >
                                Assign {assignQty(t)} {order.qtyUnit}
                              </button>
                            ) : (
                              <span className={`erp-badge ${BOARD_STATE_TONE[t.boardState] || 'neutral'}`}>
                                {BOARD_STATE_LABEL[t.boardState] || t.boardState}
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
          </div>

          {/* ── Coverage bar. Sticky, because with 300 tankers the shortfall
                 and the only route out of it would otherwise sit several
                 screens below the rows you are deciding between. ──────────── */}
          {showCoverageBar && (
          <div className="erp-sticky-bar">
            {remaining > 0 ? (
              <>
                <div className="erp-coverage-figures">
                  {/* Three figures that subtract: remaining − available fleet =
                      gap. The earlier labels ("still required" against "your
                      fleet can cover") described the same numbers but did not
                      read as arithmetic, so a 100 KL order with 95 KL of fleet
                      looked like it needed 100 and 5 at the same time. */}
                  <div>
                    <span className="erp-order-figure-label">Remaining</span>
                    <span className="erp-order-figure is-remaining">
                      {remaining} {order.qtyUnit}
                    </span>
                  </div>
                  <div>
                    <span className="erp-order-figure-label">Available fleet</span>
                    <span className="erp-order-figure is-small">
                      {fleetCeiling} {order.qtyUnit}
                      <span className="erp-cell-muted" style={{ fontWeight: 400 }}>
                        {' '}· {eligible.length} tanker{eligible.length === 1 ? '' : 's'}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="erp-order-figure-label">Coverage gap</span>
                    <span className="erp-order-figure is-small" style={{ color: '#b45309' }}>
                      {externalNeeded} {order.qtyUnit}
                    </span>
                  </div>
                </div>

                <div className="erp-coverage-actions">
                  {/* The gap is a number the operator should not have to work
                      out, so the button carries it and pre-fills the form. */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setTarget({ mode: 'HIRE', suggestedQty: externalNeeded })}
                  >
                    <Truck size={18} />
                    Hire {externalNeeded} {order.qtyUnit}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong className="erp-coverage-done">
                    <CheckCircle2 size={16} />
                    Placement complete — {required} of {required} {order.qtyUnit} assigned
                  </strong>
                  <div className="erp-cell-muted">
                    Every unit on {order.doNumber} has a vehicle against it.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/erp/pipeline?tab=trips')}
                >
                  Go to trips
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
          )}

        </>
      )}

      {cancelling && (
        <CancelPlacementDrawer
          placement={cancelling}
          qtyUnit={order?.qtyUnit || ''}
          onClose={() => setCancelling(null)}
          onCancelled={() => {
            setCancelling(null);
            fetchBoard(selectedDoId);
            fetchPlaced(selectedDoId);
            fetchOptions();
          }}
        />
      )}

      {target && (
        <PlacementDrawer
          target={target}
          order={order}
          vendors={vendors}
          drivers={drivers}
          onClose={closeDrawer}
          onPlaced={handlePlaced}
        />
      )}
    </div>
  );
};

export default PlacementBoardPage;
