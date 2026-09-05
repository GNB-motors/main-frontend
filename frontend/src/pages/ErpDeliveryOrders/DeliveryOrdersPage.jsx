/**
 * Delivery Orders (ISOCL ERP Stage 2)
 *
 * The first execution stage of the operations pipeline:
 *
 *   confirmed order → DELIVERY ORDER → placement → trip
 *
 * So the page leads with what is owed, not with what exists. A confirmed order
 * with no DO is blocking a shipment; a DO that already exists is just a record.
 * Hence two sections: the queue of sure orders waiting to be released, then the
 * register of everything raised.
 *
 * Nothing here re-asks what upstream already knows — material and quantity come
 * off the call task (see deliveryOrder.constants#formFromCall).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, FileText, Search, PhoneCall } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import StatTile from '../../components/Erp/StatTile';
import DeliveryOrderService from './DeliveryOrderService';
import PartyService from '../ErpMasters/PartyService';
import ErpCallService from '../ErpCallPlanning/ErpCallService';
import DeliveryOrderDrawer from './DeliveryOrderDrawer';
import DeliveryOrderDetailDrawer from './DeliveryOrderDetailDrawer';
import { EMPTY_FORM, formFromCall, money, stageOf } from './deliveryOrder.constants';
import '../../styles/erp.css';

const EMPTY_COUNTS = { ready: 0, inProgress: 0, awaitingApproval: 0 };

const DeliveryOrdersPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pendingCalls, setPendingCalls] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sourceTask, setSourceTask] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchOrders = useCallback(async (status = '', search = '', page = 1) => {
    setLoading(true);
    try {
      const res = await DeliveryOrderService.getOrders({
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
        page,
        limit: 20,
      });
      setOrders(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('Delivery Orders is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tile counts. Three `limit: 1` calls read off `meta.total` rather than a new
   * endpoint — the list already filters by status, and the page holds only 20
   * rows so it cannot count them itself.
   */
  const fetchCounts = useCallback(async () => {
    try {
      const [ready, partial, approval] = await Promise.all([
        DeliveryOrderService.getOrders({ status: 'PENDING', limit: 1 }),
        DeliveryOrderService.getOrders({ status: 'PARTIAL', limit: 1 }),
        DeliveryOrderService.getOrders({ status: 'PENDING_APPROVAL', limit: 1 }),
      ]);
      setCounts({
        ready: ready.meta?.total || 0,
        inProgress: partial.meta?.total || 0,
        awaitingApproval: approval.meta?.total || 0,
      });
    } catch {
      setCounts(EMPTY_COUNTS);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await PartyService.getParties({ status: 'ACTIVE', limit: 200 });
      setParties(res.data || []);
    } catch {
      setParties([]);
    }
    try {
      const res = await apiClient.get('/api/routes', { params: { limit: 200 } });
      setRoutes(res.data?.data || []);
    } catch {
      setRoutes([]);
    }
  }, []);

  /**
   * Sure orders won on a call that nobody has converted yet. Silent on failure:
   * an org without Call Planning 404s here, and that is "no queue", not an error
   * worth a toast on the delivery-order page.
   */
  const fetchPendingCalls = useCallback(async () => {
    try {
      const res = await ErpCallService.getPendingOrders({ limit: 50 });
      setPendingCalls(res.data || []);
    } catch {
      setPendingCalls([]);
    }
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter, searchTerm);
    fetchOptions();
    fetchPendingCalls();
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders, fetchOptions, fetchPendingCalls, fetchCounts, statusFilter]);

  const openManual = () => {
    setSourceTask(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openFromCall = (task) => {
    setSourceTask(task);
    setForm(formFromCall(task));
    setDrawerOpen(true);
  };

  const handleCreated = () => {
    fetchOrders(statusFilter, searchTerm);
    fetchCounts();
    // A converted sure order leaves the queue once CallTask.doId is written.
    if (form.sourceCallTaskId) fetchPendingCalls();
  };

  const closeDrawer = (next) => {
    setDrawerOpen(false);
    setSourceTask(null);
    if (next === 'placement') navigate('/erp/pipeline?tab=placement');
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchOrders(statusFilter, value);
  };

  /** Whole days a sure order has been waiting for its delivery order. */
  const waitingDays = (task) => {
    const from = new Date(task.closedAt || task.scheduledDate);
    return Math.max(0, Math.floor((Date.now() - from.getTime()) / 86400000));
  };

  const kamName = (kam) =>
    (kam ? `${kam.firstName || ''} ${kam.lastName || ''}`.trim() || '—' : '—');

  const oldestWait = useMemo(
    () => (pendingCalls.length ? Math.max(...pendingCalls.map(waitingDays)) : 0),
    [pendingCalls],
  );

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Delivery Orders</h1>
          <p className="erp-subtitle">
            Release confirmed orders, then place vehicles against them
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-secondary" onClick={openManual}>
            <Plus size={18} />
            Manual DO
          </button>
        </div>
      </div>

      <div className="erp-stat-grid" style={{ marginTop: 20 }}>
        <StatTile
          label="Awaiting a DO"
          value={pendingCalls.length}
          sublabel={oldestWait > 0 ? `oldest waiting ${oldestWait}d` : null}
          sublabelTone={oldestWait >= 2 ? 'danger' : null}
          icon={PhoneCall}
          derived
        />
        <StatTile
          label="Ready for placement"
          value={counts.ready}
          sublabel="No vehicles placed yet"
          icon={FileText}
          onClick={() => setStatusFilter('PENDING')}
        />
        <StatTile
          label="Placement in progress"
          value={counts.inProgress}
          sublabel="Partly lifted"
          onClick={() => setStatusFilter('PARTIAL')}
        />
        <StatTile
          label="Awaiting approval"
          value={counts.awaitingApproval}
          sublabel={counts.awaitingApproval > 0 ? 'Cannot be placed yet' : null}
          sublabelTone={counts.awaitingApproval > 0 ? 'warning' : null}
          onClick={() => setStatusFilter('PENDING_APPROVAL')}
        />
      </div>

      {/* Work owed, above the register of work done. Styled as a section rather
          than an alert: an alert says "something is wrong", but a confirmed order
          waiting for release is the normal state of this page. */}
      {pendingCalls.length > 0 && (
        <section className="erp-queue">
          <div className="erp-queue-head">
            <PhoneCall size={16} />
            <div>
              <strong>
                {pendingCalls.length} confirmed order
                {pendingCalls.length === 1 ? '' : 's'} ready to release
              </strong>
            </div>
          </div>

          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Confirmed by</th>
                  <th>Waiting</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pendingCalls.map((task) => {
                  const days = waitingDays(task);
                  return (
                    <tr key={task._id}>
                      <td>
                        <div className="erp-cell-strong">{task.partyId?.name || '—'}</div>
                        {task.partyId?.code && (
                          <div className="erp-cell-muted">{task.partyId.code}</div>
                        )}
                        {task.remarks && (
                          <div className="erp-cell-muted erp-queue-note">{task.remarks}</div>
                        )}
                      </td>
                      <td>
                        {task.orderMaterial || <span className="erp-cell-muted">—</span>}
                      </td>
                      <td className="erp-numeric">
                        {task.orderQty != null
                          ? `${task.orderQty} ${task.orderQtyUnit || ''}`
                          : <span className="erp-cell-muted">not captured</span>}
                      </td>
                      <td>{kamName(task.kamId)}</td>
                      <td>
                        <span
                          className={`erp-badge ${days >= 2 ? 'danger' : days >= 1 ? 'warning' : 'success'}`}
                        >
                          {days === 0 ? 'Today' : `${days}d`}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openFromCall(task)}
                        >
                          Create DO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <h2 className="erp-section-heading">All delivery orders</h2>

      <div className="erp-toolbar" style={{ marginTop: 0 }}>
        <div className="erp-search">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Search by DO number…"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="PENDING_APPROVAL">Awaiting approval</option>
          <option value="PENDING">Ready for placement</option>
          <option value="PARTIAL">Placement in progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading delivery orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="erp-state">
            <FileText size={48} />
            <p>{statusFilter || searchTerm ? 'Nothing matches this filter' : 'No delivery orders yet'}</p>
            <span className="erp-cell-muted">
              {statusFilter || searchTerm
                ? 'Clear the filter to see the rest.'
                : pendingCalls.length > 0
                  ? 'Release one of the confirmed orders above to raise the first.'
                  : 'Orders arrive here once a KAM confirms one on a call.'}
            </span>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>DO No.</th>
                    <th>Account</th>
                    <th>Route</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const stage = stageOf(o);
                    return (
                      <tr key={o._id} className="clickable" onClick={() => setDetail(o)}>
                        <td className="erp-cell-strong">{o.doNumber}</td>
                        <td>
                          <div>{o.partyId?.name || '—'}</div>
                          <div className="erp-cell-muted">
                            {new Date(o.doDate).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="erp-cell-muted">
                          {o.fromLocation} → {o.toLocation}
                        </td>
                        <td>{o.material}</td>
                        <td className="erp-numeric">
                          <div>{o.qty} {o.qtyUnit}</div>
                          {o.liftedQty > 0 && (
                            <div className="erp-cell-muted">{o.balanceQty} left</div>
                          )}
                        </td>
                        <td className="erp-numeric">
                          {money(o.sbRate)}
                          {o.rateSource === 'MANUAL' && (
                            <div className="erp-cell-muted">manual</div>
                          )}
                        </td>
                        <td>
                          <span className={`erp-badge ${stage.tone}`}>{stage.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="erp-pagination">
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === 1}
                  onClick={() => fetchOrders(statusFilter, searchTerm, meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} orders
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchOrders(statusFilter, searchTerm, meta.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <DeliveryOrderDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        form={form}
        setForm={setForm}
        sourceTask={sourceTask}
        parties={parties}
        routes={routes}
        onCreated={handleCreated}
      />

      {detail && (
        <DeliveryOrderDetailDrawer
          order={detail}
          onClose={() => setDetail(null)}
          onPlace={() => {
            setDetail(null);
            navigate('/erp/pipeline?tab=placement');
          }}
        />
      )}
    </div>
  );
};

export default DeliveryOrdersPage;
