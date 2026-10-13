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
import { ArrowLeft, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PlacementService from './PlacementService';
import PlacementDrawer from './PlacementDrawer';
import CancelPlacementDrawer from './CancelPlacementDrawer';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import DeliveryOrderService from '../ErpDeliveryOrders/DeliveryOrderService';
import PageShell from '../../components/Erp/PageShell';
import useFleetRows from './board/useFleetRows';
import OrderQueue from './board/OrderQueue';
import OrderRequirementCard from './board/OrderRequirementCard';
import AssignedPlacements from './board/AssignedPlacements';
import FleetToolbar from './board/FleetToolbar';
import FleetTable from './board/FleetTable';
import CoverageBar from './board/CoverageBar';
import '../../styles/erp.css';

const PlacementBoardPage = ({ embedded = false }) => {
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

  const { tankers, eligible, locations, atLoadingPoint, visible, hidden, PAGE, rows, notShown } =
    useFleetRows({ board, order, showAll, locFilter, sortBy, vehicleSearch, showEveryRow });

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
      (o) =>
        !q ||
        (o.doNumber || '').toLowerCase().includes(q) ||
        (o.partyId?.name || '').toLowerCase().includes(q) ||
        (o.material || '').toLowerCase().includes(q),
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

  // The sticky fulfilment bar only exists once an order is selected. Its
  // padding-bottom / flex pinning is applied via `:has(> .erp-sticky-bar)` in
  // erp.css, on whichever ancestor (`.erp-page` standalone, `.erp-hub-panel`
  // embedded) actually renders — not a modifier class here, since embedded
  // mode has no wrapper element of its own to put one on.
  return (
    <PageShell
      embedded={embedded}
      title="Placement Board"
      subtitle="Assign fleet or hired vehicles to delivery orders"
    >
      {!selectedDoId ? (
        <OrderQueue
          orders={orders}
          untouched={untouched}
          started={started}
          queueSearch={queueSearch}
          setQueueSearch={setQueueSearch}
          queue={queue}
          awaitingApproval={awaitingApproval}
          setSelectedDoId={setSelectedDoId}
          notShown={notShown}
          PAGE={PAGE}
          visible={visible}
          setShowEveryRow={setShowEveryRow}
        />
      ) : loading ? (
        <div className="erp-container">
          <div className="erp-state">
            <p>Loading…</p>
          </div>
        </div>
      ) : !order ? (
        <div className="erp-container">
          <div className="erp-state">
            <p>That order could not be loaded.</p>
          </div>
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
          <OrderRequirementCard
            order={order}
            remaining={remaining}
            done={done}
            required={required}
            pct={pct}
          />

          {/* ── Already assigned ────────────────────────────────────────────── */}
          {placed.length > 0 && (
            <AssignedPlacements placed={placed} order={order} setCancelling={setCancelling} />
          )}

          {/* ── The fleet that can carry it ─────────────────────────────────── */}
          <h2 className="erp-section-heading">
            {showAll ? 'All tankers at this location' : 'Available fleet'}
          </h2>

          <FleetToolbar
            eligible={eligible}
            tankers={tankers}
            hidden={hidden}
            showAll={showAll}
            vehicleSearch={vehicleSearch}
            setVehicleSearch={setVehicleSearch}
            locations={locations}
            locFilter={locFilter}
            setLocFilter={setLocFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setShowAll={setShowAll}
            remaining={remaining}
            setTarget={setTarget}
          />

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
              <FleetTable
                rows={rows}
                setTarget={setTarget}
                atLoadingPoint={atLoadingPoint}
                assignQty={assignQty}
                order={order}
              />
            )}
          </div>

          {/* ── Coverage bar. Sticky, because with 300 tankers the shortfall
                 and the only route out of it would otherwise sit several
                 screens below the rows you are deciding between. ──────────── */}
          {showCoverageBar && (
            <CoverageBar
              remaining={remaining}
              order={order}
              fleetCeiling={fleetCeiling}
              eligible={eligible}
              externalNeeded={externalNeeded}
              setTarget={setTarget}
              required={required}
              navigate={navigate}
            />
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
    </PageShell>
  );
};

export default PlacementBoardPage;
