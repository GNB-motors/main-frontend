/**
 * Tanker Availability Board (ISOCL ERP Stage 3)
 *
 * Location-wise grid. Selecting a delivery order flags every tanker for
 * material compatibility up front, so an incompatible tanker is disabled rather
 * than rejected after the operator has filled in a form.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  X,
  Info,
  AlertTriangle,
  Ban,
  CheckCircle2,
  CalendarClock,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PlacementService from './PlacementService';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import DeliveryOrderService from '../ErpDeliveryOrders/DeliveryOrderService';
import '../../styles/erp.css';

const BOARD_STATE_TONE = {
  AVAILABLE: 'success',
  ON_TRIP: 'open',
  WAITING_UNLOAD: 'warning',
  MAINTENANCE: 'danger',
};

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');
const dateLabel = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

const PlacementBoardPage = () => {
  const [board, setBoard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDoId, setSelectedDoId] = useState('');
  const [loading, setLoading] = useState(false);

  // Placement modal
  const [target, setTarget] = useState(null); // { mode: 'OWN'|'HIRE', tanker? }
  const [form, setForm] = useState({});
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOrder = orders.find((o) => o._id === selectedDoId) || null;

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
      const res = await DeliveryOrderService.getOrders({ status: 'PENDING', limit: 100 });
      const partial = await DeliveryOrderService.getOrders({ status: 'PARTIAL', limit: 100 });
      setOrders([...(res.data || []), ...(partial.data || [])]);
    } catch {
      setOrders([]);
    }
    try {
      const res = await ErpMasterService.getVendors({ status: 'ACTIVE', limit: 200 });
      setVendors(res.data || []);
    } catch {
      setVendors([]);
    }
  }, []);

  useEffect(() => {
    fetchBoard(selectedDoId);
    fetchOptions();
  }, [fetchBoard, fetchOptions, selectedDoId]);

  useEffect(() => {
    if (board?.spareDrivers) setDrivers(board.spareDrivers);
  }, [board]);

  // ─── Placement modal ───────────────────────────────────────────────────────

  const openOwn = (tanker) => {
    if (!selectedDoId) {
      toast.error('Pick a delivery order first');
      return;
    }
    setTarget({ mode: 'OWN', tanker });
    setForm({
      vehicleId: tanker.vehicleId,
      driverId: '',
      plannedQty: selectedOrder?.balanceQty ?? '',
    });
    setCheck(null);
  };

  const openHire = () => {
    if (!selectedDoId) {
      toast.error('Pick a delivery order first');
      return;
    }
    setTarget({ mode: 'HIRE' });
    setForm({
      vendorId: '',
      hireVehicleNumber: '',
      hireDriverName: '',
      hireDriverPhone: '',
      previousCargo: '',
      plannedQty: selectedOrder?.balanceQty ?? '',
      pbRate: '',
      pbRateUnit: 'PER_KL',
      pbRateRemark: '',
    });
    setCheck(null);
  };

  const closeModal = () => {
    setTarget(null);
    setForm({});
    setCheck(null);
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  /** Ask the server what would happen — same code path the submit runs. */
  const runCheck = useCallback(async () => {
    if (!target || !selectedDoId) return;
    setChecking(true);
    try {
      const payload = {
        doId: selectedDoId,
        vehicleType: target.mode,
        ...(target.mode === 'OWN'
          ? {
              vehicleId: form.vehicleId,
              ...(form.driverId ? { driverId: form.driverId } : {}),
            }
          : {
              ...(form.vendorId ? { vendorId: form.vendorId } : {}),
              ...(form.hireVehicleNumber ? { hireVehicleNumber: form.hireVehicleNumber } : {}),
              ...(form.previousCargo ? { previousCargo: form.previousCargo } : {}),
              ...(form.pbRate ? { pbRate: Number(form.pbRate) } : {}),
            }),
        ...(form.plannedQty ? { plannedQty: Number(form.plannedQty) } : {}),
      };
      // Hire needs a vendor before the server can say anything useful.
      if (target.mode === 'HIRE' && !form.vendorId) {
        setCheck(null);
        return;
      }
      const res = await PlacementService.checkRestrictions(payload);
      setCheck(res.data);
    } catch (err) {
      toast.error(err.message);
      setCheck(null);
    } finally {
      setChecking(false);
    }
  }, [target, selectedDoId, form]);

  useEffect(() => {
    if (!target) return;
    const t = setTimeout(runCheck, 300);
    return () => clearTimeout(t);
  }, [target, runCheck]);

  const handlePlace = async (e) => {
    e.preventDefault();
    if (!check?.canPlace) {
      toast.error('Resolve the blocking issues first');
      return;
    }
    setSaving(true);
    try {
      // Every warning shown must be acknowledged — the server enforces this too.
      const acknowledgedWarnings = (check.warnings || []).map((w) => w.code);
      let res;
      if (target.mode === 'OWN') {
        res = await PlacementService.placeOwn({
          doId: selectedDoId,
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          plannedQty: Number(form.plannedQty),
          acknowledgedWarnings,
        });
      } else {
        const payload = {
          doId: selectedDoId,
          vendorId: form.vendorId,
          hireVehicleNumber: form.hireVehicleNumber.trim().toUpperCase(),
          hireDriverName: form.hireDriverName.trim(),
          hireDriverPhone: form.hireDriverPhone.trim(),
          previousCargo: form.previousCargo.trim().toUpperCase(),
          plannedQty: Number(form.plannedQty),
          acknowledgedWarnings,
        };
        if (form.pbRate) {
          payload.pbRate = Number(form.pbRate);
          payload.pbRateUnit = form.pbRateUnit;
          payload.pbRateRemark = form.pbRateRemark.trim();
        }
        res = await PlacementService.placeHire(payload);
      }

      toast.success(
        res.data.status === 'PENDING_APPROVAL'
          ? `${res.data.placementNumber} created — waiting for approval`
          : `${res.data.placementNumber} placed`,
      );
      closeModal();
      fetchBoard(selectedDoId);
      fetchOptions();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Placement Board</h1>
          <p className="erp-subtitle">
            Tanker availability by location — pick a delivery order to check compatibility
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-secondary" onClick={openHire} disabled={!selectedDoId}>
            <Truck size={18} />
            Place Hire Vehicle
          </button>
        </div>
      </div>

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={selectedDoId}
          onChange={(e) => setSelectedDoId(e.target.value)}
          style={{ minWidth: 320 }}
        >
          <option value="">Select a delivery order…</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o.doNumber} · {o.partyId?.name} · {o.material} · {o.balanceQty} {o.qtyUnit} left
            </option>
          ))}
        </select>
        {board?.summary && (
          <span className="erp-cell-muted">
            {board.summary.available} available · {board.summary.onTrip} on trip ·{' '}
            {board.summary.maintenance} in maintenance
          </span>
        )}
      </div>

      {selectedOrder && (
        <div className="erp-callout info" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            <strong>{selectedOrder.doNumber}</strong> · {selectedOrder.material} ·{' '}
            {selectedOrder.fromLocation} → {selectedOrder.toLocation} · balance{' '}
            {selectedOrder.balanceQty} {selectedOrder.qtyUnit} · rate{' '}
            {money(selectedOrder.sbRate)}
          </span>
        </div>
      )}

      {loading ? (
        <div className="erp-container">
          <div className="erp-state">
            <p>Loading the board...</p>
          </div>
        </div>
      ) : !board || board.locations.length === 0 ? (
        <div className="erp-container">
          <div className="erp-state">
            <Truck size={48} />
            <p>No tankers on the board</p>
            <span className="erp-cell-muted">
              Add vehicles with a capacity and base location to see them here.
            </span>
          </div>
        </div>
      ) : (
        board.locations.map((loc) => (
          <div className="erp-container" key={loc.location} style={{ marginTop: 20 }}>
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong>{loc.location}</strong>
              <span className="erp-cell-muted">
                {loc.available} of {loc.tankers.length} available
              </span>
            </div>

            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Tanker</th>
                    <th>Capacity</th>
                    <th>Previous Material</th>
                    <th>State</th>
                    <th>Board Note</th>
                    <th>Carry Forward</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {loc.tankers.map((t) => {
                    const blockedByCompat = t.isCompatible === false;
                    const canPlace = t.isAvailable && !blockedByCompat;
                    return (
                      <tr key={t.vehicleId}>
                        <td>
                          <div className="erp-cell-strong">{t.registrationNumber}</div>
                          {t.model && <div className="erp-cell-muted">{t.model}</div>}
                        </td>
                        <td className="erp-numeric">
                          {t.capacity ? `${t.capacity} ${t.capacityUnit || ''}`.trim() : '—'}
                        </td>
                        <td>
                          {t.previousMaterial || <span className="erp-cell-muted">—</span>}
                          {blockedByCompat && (
                            <div
                              className="erp-cell-muted"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Ban size={12} /> {t.incompatibleReason}
                            </div>
                          )}
                          {t.requiresCleaning && (
                            <div className="erp-cell-muted">Needs cleaning first</div>
                          )}
                        </td>
                        <td>
                          <span className={`erp-badge ${BOARD_STATE_TONE[t.boardState]}`}>
                            {t.boardState.replace('_', ' ')}
                          </span>
                          {t.expectedFreeAt && (
                            <div
                              className="erp-cell-muted"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <CalendarClock size={12} /> {dateLabel(t.expectedFreeAt)}
                            </div>
                          )}
                        </td>
                        <td className="erp-cell-muted">{t.boardStatusRaw || '—'}</td>
                        <td className="erp-numeric">
                          {t.carriedForwardAmount > 0 ? money(t.carriedForwardAmount) : '—'}
                        </td>
                        <td>
                          <div className="erp-actions">
                            <button
                              className="btn btn-primary"
                              disabled={!canPlace || !selectedDoId}
                              title={
                                !selectedDoId
                                  ? 'Pick a delivery order first'
                                  : blockedByCompat
                                    ? t.incompatibleReason
                                    : !t.isAvailable
                                      ? 'This tanker is not available'
                                      : 'Place this tanker'
                              }
                              onClick={() => openOwn(t)}
                            >
                              Place
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {board?.spareDrivers?.length > 0 && (
        <div className="erp-container" style={{ marginTop: 20 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} /> Spare Drivers ({board.spareDrivers.length})
            </strong>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {board.spareDrivers.map((d) => (
              <span key={d._id} className="erp-badge neutral">
                {d.firstName} {d.lastName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Placement modal ─────────────────────────────────────────────── */}
      {target && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>
                {target.mode === 'OWN'
                  ? `Place ${target.tanker.registrationNumber}`
                  : 'Place a Hire Vehicle'}
              </h2>
              <button className="btn-icon" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePlace}>
              <div className="erp-modal-body">
                {/* Restriction verdict */}
                {checking && (
                  <div className="erp-callout info">
                    <Info size={16} />
                    <span>Checking restrictions…</span>
                  </div>
                )}

                {check?.blocks?.map((b) => (
                  <div className="erp-callout" key={b.code} style={{ background: '#fee2e2', color: '#b91c1c' }}>
                    <Ban size={16} />
                    <span>
                      <strong>Blocked:</strong> {b.message}
                    </span>
                  </div>
                ))}

                {check?.warnings?.map((w) => (
                  <div className="erp-callout" key={w.code} style={{ background: '#fef3c7', color: '#b45309' }}>
                    <AlertTriangle size={16} />
                    <span>
                      <strong>Needs approval:</strong> {w.message}
                    </span>
                  </div>
                ))}

                {check?.info?.map((i) => (
                  <div className="erp-callout info" key={i.code}>
                    <Info size={16} />
                    <span>{i.message}</span>
                  </div>
                ))}

                {check?.canPlace && !check.needsApproval && (
                  <div className="erp-callout success">
                    <CheckCircle2 size={16} />
                    <span>Nothing blocking — this will be placed straight away.</span>
                  </div>
                )}

                <div className="erp-form-grid" style={{ marginTop: 8 }}>
                  {target.mode === 'OWN' ? (
                    <>
                      <div className="erp-field">
                        <label htmlFor="pl-driver">
                          Driver <span className="required">*</span>
                        </label>
                        <select
                          id="pl-driver"
                          value={form.driverId || ''}
                          onChange={(e) => setField('driverId', e.target.value)}
                          required
                        >
                          <option value="">Select a driver</option>
                          {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.firstName} {d.lastName}
                            </option>
                          ))}
                        </select>
                        {drivers.length === 0 && (
                          <span className="erp-field-hint">
                            No spare drivers — every driver is on a live placement.
                          </span>
                        )}
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-qty">
                          Quantity <span className="required">*</span>
                        </label>
                        <input
                          id="pl-qty"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.plannedQty || ''}
                          onChange={(e) => setField('plannedQty', e.target.value)}
                          required
                        />
                        <span className="erp-field-hint">
                          Tanker capacity {target.tanker.capacity || '—'}{' '}
                          {target.tanker.capacityUnit || ''}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="erp-field full">
                        <label htmlFor="pl-vendor">
                          Vendor <span className="required">*</span>
                        </label>
                        <select
                          id="pl-vendor"
                          value={form.vendorId || ''}
                          onChange={(e) => setField('vendorId', e.target.value)}
                          required
                        >
                          <option value="">Select a vendor</option>
                          {vendors.map((v) => (
                            <option key={v._id} value={v._id} disabled={v.isBlacklisted}>
                              {v.name} ({v.code}){v.isBlacklisted ? ' — blacklisted' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-hv">
                          Tanker Number <span className="required">*</span>
                        </label>
                        <input
                          id="pl-hv"
                          value={form.hireVehicleNumber || ''}
                          onChange={(e) =>
                            setField('hireVehicleNumber', e.target.value.toUpperCase())
                          }
                          placeholder="WB11AA1111"
                          required
                        />
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-prev">
                          Previous Cargo <span className="required">*</span>
                        </label>
                        <input
                          id="pl-prev"
                          value={form.previousCargo || ''}
                          onChange={(e) => setField('previousCargo', e.target.value.toUpperCase())}
                          placeholder="MTO"
                          required
                        />
                        <span className="erp-field-hint">
                          A hired tanker has no history here — this drives the safety check.
                        </span>
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-dname">
                          Driver Name <span className="required">*</span>
                        </label>
                        <input
                          id="pl-dname"
                          value={form.hireDriverName || ''}
                          onChange={(e) => setField('hireDriverName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-dphone">
                          Driver Phone <span className="required">*</span>
                        </label>
                        <input
                          id="pl-dphone"
                          value={form.hireDriverPhone || ''}
                          onChange={(e) => setField('hireDriverPhone', e.target.value)}
                          placeholder="9876543210"
                          required
                        />
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-hqty">
                          Quantity <span className="required">*</span>
                        </label>
                        <input
                          id="pl-hqty"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.plannedQty || ''}
                          onChange={(e) => setField('plannedQty', e.target.value)}
                          required
                        />
                      </div>

                      <div className="erp-field">
                        <label htmlFor="pl-pb">Purchase Rate (₹)</label>
                        <input
                          id="pl-pb"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.pbRate || ''}
                          onChange={(e) => setField('pbRate', e.target.value)}
                        />
                        <span className="erp-field-hint">
                          Blank uses the rate master. Entering one needs a remark.
                        </span>
                      </div>

                      {form.pbRate && (
                        <div className="erp-field full">
                          <label htmlFor="pl-pbremark">
                            Reason for the manual rate <span className="required">*</span>
                          </label>
                          <textarea
                            id="pl-pbremark"
                            value={form.pbRateRemark || ''}
                            onChange={(e) => setField('pbRateRemark', e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || checking || !check?.canPlace}
                >
                  {saving
                    ? 'Placing...'
                    : check?.needsApproval
                      ? 'Place & Request Approval'
                      : 'Place Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementBoardPage;
