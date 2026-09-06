/**
 * Delivery Orders (ISOCL ERP Stage 2)
 *
 * The form resolves the sale rate and the party's credit position live, so the
 * user knows before submitting whether the order will need approval. Both
 * conditions are re-checked server-side.
 */

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import DeliveryOrderService from './DeliveryOrderService';
import RateMasterService from '../ErpMasters/RateMasterService';
import PartyService from '../ErpMasters/PartyService';
import useApi from '../../hooks/useApi';
import '../../styles/erp.css';

const DO_TYPES = [
  { value: 'KL_DO', label: 'KL (volume)', unit: 'KL' },
  { value: 'WT_DO', label: 'MT (weight)', unit: 'MT' },
  { value: 'VEHICLE_COUNT_DO', label: 'Vehicle count', unit: 'vehicles' },
];

const STATUS_TONE = {
  PENDING_APPROVAL: 'warning',
  PENDING: 'open',
  PARTIAL: 'open',
  COMPLETED: 'success',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  partyId: '',
  routeId: '',
  material: '',
  doDate: todayInput(),
  doType: 'KL_DO',
  qty: '',
  vehicleCapacity: '',
  useManualRate: false,
  sbRate: '',
  sbRateUnit: 'PER_KL',
  rateRemark: '',
  expiryDate: '',
};

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const DeliveryOrdersPage = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rateInfo, setRateInfo] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);

  const { data: ordersResponse, loading, error: ordersError, refetch: refetchOrders } = useApi(
    () =>
      DeliveryOrderService.getOrders({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        page,
        limit: 20,
      }),
    [JSON.stringify({ status: statusFilter, search: searchTerm, page })],
  );

  const { data: partiesResponse } = useApi(
    () => PartyService.getParties({ status: 'ACTIVE', limit: 200 }),
    [],
  );

  const { data: routesResponse } = useApi(
    (signal) => apiClient.get('/api/routes', { params: { limit: 200 }, signal }),
    [],
  );

  useEffect(() => {
    if (ordersResponse) {
      setOrders(ordersResponse.data || []);
      setMeta(ordersResponse.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    }
  }, [ordersResponse]);

  useEffect(() => {
    if (partiesResponse) setParties(partiesResponse.data || []);
  }, [partiesResponse]);

  useEffect(() => {
    if (routesResponse) setRoutes(routesResponse.data?.data || []);
  }, [routesResponse]);

  useEffect(() => {
    if (!ordersError) return;
    if (ordersError.status === 404) {
      toast.error('Delivery Orders is not enabled for your organization');
    } else {
      toast.error(ordersError.message);
    }
    setOrders([]);
  }, [ordersError]);

  // Arriving from a Stage 1 "Sure Order" opens the form pre-filled.
  useEffect(() => {
    const draft = location.state?.doDraft;
    if (draft?.partyId) {
      setForm({ ...EMPTY_FORM, partyId: draft.partyId });
      setShowModal(true);
    }
  }, [location.state]);

  // Credit position follows the selected party.
  useEffect(() => {
    if (!form.partyId) {
      setCreditInfo(null);
      return;
    }
    let cancelled = false;
    DeliveryOrderService.checkCredit(form.partyId)
      .then((res) => {
        if (!cancelled) setCreditInfo(res.data);
      })
      .catch(() => {
        if (!cancelled) setCreditInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [form.partyId]);

  // Rate follows party + route + material.
  useEffect(() => {
    if (!form.partyId || !form.routeId || !form.material) {
      setRateInfo(null);
      return;
    }
    let cancelled = false;
    RateMasterService.lookupRate({
      partyId: form.partyId,
      routeId: form.routeId,
      material: form.material.trim().toUpperCase(),
      onDate: form.doDate,
    })
      .then((res) => {
        if (!cancelled) setRateInfo(res.data);
      })
      .catch(() => {
        if (!cancelled) setRateInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [form.partyId, form.routeId, form.material, form.doDate]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setRateInfo(null);
    setCreditInfo(null);
    setShowModal(true);
  };

  const needsManualRate = rateInfo && rateInfo.found === false;
  const manualRateActive = form.useManualRate || needsManualRate;
  const orderValue =
    Number(form.qty) * Number(manualRateActive ? form.sbRate : rateInfo?.rate || 0);
  const willBreachCredit =
    creditInfo && orderValue > 0 && creditInfo.exposure + orderValue >= creditInfo.creditLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.partyId || !form.routeId || !form.material || !form.qty) {
      toast.error('Party, route, material and quantity are required');
      return;
    }
    if (manualRateActive && (!form.sbRate || form.rateRemark.trim().length < 3)) {
      toast.error('A manual rate needs an amount and a remark of at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        partyId: form.partyId,
        routeId: form.routeId,
        material: form.material.trim().toUpperCase(),
        doDate: form.doDate,
        doType: form.doType,
        qty: Number(form.qty),
      };
      if (form.doType === 'VEHICLE_COUNT_DO') {
        payload.vehicleCapacity = Number(form.vehicleCapacity);
      }
      if (manualRateActive) {
        payload.sbRate = Number(form.sbRate);
        payload.sbRateUnit = form.sbRateUnit;
        payload.rateRemark = form.rateRemark.trim();
      }
      if (form.expiryDate) payload.expiryDate = form.expiryDate;

      const res = await DeliveryOrderService.createOrder(payload);
      const created = res.data;
      toast.success(
        created.status === 'PENDING_APPROVAL'
          ? `${created.doNumber} created — waiting for approval`
          : `${created.doNumber} created`,
      );
      setShowModal(false);
      if (page === 1) refetchOrders();
      else setPage(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
  };

  const unitFor = (t) => DO_TYPES.find((d) => d.value === t)?.unit || '';

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Delivery Orders</h1>
          <p className="erp-subtitle">
            Orders draw down as vehicles are placed against them
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            New Delivery Order
          </button>
        </div>
      </div>

      <div className="erp-toolbar">
        <div className="erp-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by DO number..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="PENDING_APPROVAL">Awaiting approval</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partially lifted</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading delivery orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="erp-state">
            <FileText size={48} />
            <p>No delivery orders yet</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} />
              Create the first one
            </button>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>DO No.</th>
                    <th>Party</th>
                    <th>Route</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Balance</th>
                    <th>Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
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
                        {o.qty} {o.qtyUnit}
                      </td>
                      <td className="erp-numeric erp-cell-strong">
                        {o.balanceQty} {o.qtyUnit}
                      </td>
                      <td className="erp-numeric">
                        {money(o.sbRate)}
                        {o.rateSource === 'MANUAL' && (
                          <div className="erp-cell-muted">manual</div>
                        )}
                      </td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[o.status] || 'neutral'}`}>
                          {o.status === 'PENDING_APPROVAL' ? 'AWAITING APPROVAL' : o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="erp-pagination">
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === 1}
                  onClick={() => setPage(meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} orders
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => setPage(meta.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>New Delivery Order</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                {creditInfo && (
                  <div
                    className={`erp-callout ${creditInfo.passed && !willBreachCredit ? 'success' : 'info'}`}
                  >
                    {creditInfo.passed && !willBreachCredit ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    <span>
                      Credit limit {money(creditInfo.creditLimit)} · outstanding{' '}
                      {money(creditInfo.exposure)} · available {money(creditInfo.available)}
                      {willBreachCredit && (
                        <>
                          {' '}
                          — this order of {money(orderValue)} crosses the limit and will need
                          approval.
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="do-party">
                      Party <span className="required">*</span>
                    </label>
                    <select
                      id="do-party"
                      value={form.partyId}
                      onChange={(e) => setField('partyId', e.target.value)}
                      required
                    >
                      <option value="">Select a party</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="do-route">
                      Route <span className="required">*</span>
                    </label>
                    <select
                      id="do-route"
                      value={form.routeId}
                      onChange={(e) => setField('routeId', e.target.value)}
                      required
                    >
                      <option value="">Select a route</option>
                      {routes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-field">
                    <label htmlFor="do-material">
                      Material <span className="required">*</span>
                    </label>
                    <input
                      id="do-material"
                      value={form.material}
                      onChange={(e) => setField('material', e.target.value.toUpperCase())}
                      placeholder="MTO"
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="do-date">
                      DO Date <span className="required">*</span>
                    </label>
                    <input
                      id="do-date"
                      type="date"
                      value={form.doDate}
                      onChange={(e) => setField('doDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="do-type">
                      DO Type <span className="required">*</span>
                    </label>
                    <select
                      id="do-type"
                      value={form.doType}
                      onChange={(e) => setField('doType', e.target.value)}
                    >
                      {DO_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-field">
                    <label htmlFor="do-qty">
                      Quantity ({unitFor(form.doType)}) <span className="required">*</span>
                    </label>
                    <input
                      id="do-qty"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.qty}
                      onChange={(e) => setField('qty', e.target.value)}
                      placeholder="100"
                      required
                    />
                  </div>

                  {form.doType === 'VEHICLE_COUNT_DO' && (
                    <div className="erp-field">
                      <label htmlFor="do-capacity">
                        Capacity per vehicle (KL) <span className="required">*</span>
                      </label>
                      <input
                        id="do-capacity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.vehicleCapacity}
                        onChange={(e) => setField('vehicleCapacity', e.target.value)}
                        placeholder="34"
                        required
                      />
                    </div>
                  )}

                  <div className="erp-field">
                    <label htmlFor="do-expiry">Expiry Date</label>
                    <input
                      id="do-expiry"
                      type="date"
                      value={form.expiryDate}
                      min={form.doDate}
                      onChange={(e) => setField('expiryDate', e.target.value)}
                    />
                    <span className="erp-field-hint">Blank = DO date + 3 days</span>
                  </div>
                </div>

                {/* Rate resolution */}
                <div style={{ marginTop: 20 }}>
                  {rateInfo?.found && !form.useManualRate && (
                    <div className="erp-callout success">
                      <CheckCircle2 size={16} />
                      <span>
                        Rate master: <strong>{money(rateInfo.rate)}</strong>{' '}
                        {rateInfo.unit?.replace('PER_', 'per ').toLowerCase()}
                        {' — '}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ textDecoration: 'underline', padding: 0 }}
                          onClick={() => setField('useManualRate', true)}
                        >
                          override manually
                        </button>
                      </span>
                    </div>
                  )}

                  {needsManualRate && (
                    <div className="erp-callout info">
                      <Info size={16} />
                      <span>
                        No rate in the master for this combination. Enter one manually — it will
                        need approval before the order can be placed.
                      </span>
                    </div>
                  )}

                  {manualRateActive && (
                    <div className="erp-form-grid" style={{ marginTop: 12 }}>
                      <div className="erp-field">
                        <label htmlFor="do-rate">
                          Manual Rate (₹) <span className="required">*</span>
                        </label>
                        <input
                          id="do-rate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.sbRate}
                          onChange={(e) => setField('sbRate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="do-rate-unit">
                          Unit <span className="required">*</span>
                        </label>
                        <select
                          id="do-rate-unit"
                          value={form.sbRateUnit}
                          onChange={(e) => setField('sbRateUnit', e.target.value)}
                        >
                          <option value="PER_KL">Per KL</option>
                          <option value="PER_MT">Per MT</option>
                          <option value="PER_TRIP">Per Trip</option>
                        </select>
                      </div>
                      <div className="erp-field full">
                        <label htmlFor="do-rate-remark">
                          Reason for the manual rate <span className="required">*</span>
                        </label>
                        <textarea
                          id="do-rate-remark"
                          value={form.rateRemark}
                          onChange={(e) => setField('rateRemark', e.target.value)}
                          placeholder="Negotiated for this lot"
                          required
                        />
                      </div>
                      {!needsManualRate && (
                        <div className="erp-field full">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setField('useManualRate', false)}
                          >
                            Use the master rate instead
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Delivery Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOrdersPage;
