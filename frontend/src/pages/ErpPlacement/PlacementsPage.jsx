/**
 * Placements list (ISOCL ERP Stage 3)
 *
 * Deleting a placement returns the quantity to the delivery order and records
 * the empty running against the tanker, to be charged to whichever loaded trip
 * it takes next.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Trash2, X, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import PlacementService from './PlacementService';
import '../../styles/erp.css';

const STATUS_TONE = {
  PENDING_APPROVAL: 'warning',
  PLACED: 'success',
  DELETED: 'neutral',
};

const DELETE_REASONS = [
  { value: 'NO_LOAD', label: 'No load available' },
  { value: 'LOADING_POINT_CHANGE', label: 'Loading point changed' },
  { value: 'REPOSITION', label: 'Repositioning' },
];

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const PlacementsPage = () => {
  const [placements, setPlacements] = useState([]);
  const [pendingLegs, setPendingLegs] = useState({ data: [], meta: { totalAmount: 0 } });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('NO_LOAD');
  const [remarks, setRemarks] = useState('');
  const [emptyBudget, setEmptyBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlacements = useCallback(async (status = '', page = 1) => {
    setLoading(true);
    try {
      const res = await PlacementService.getPlacements({
        ...(status ? { status } : {}),
        page,
        limit: 20,
      });
      setPlacements(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('Placement is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLegs = useCallback(async () => {
    try {
      const res = await PlacementService.getPendingEmptyLegs();
      setPendingLegs({ data: res.data || [], meta: res.meta || { totalAmount: 0 } });
    } catch {
      setPendingLegs({ data: [], meta: { totalAmount: 0 } });
    }
  }, []);

  useEffect(() => {
    fetchPlacements(statusFilter);
    fetchLegs();
  }, [fetchPlacements, fetchLegs, statusFilter]);

  const openDelete = (placement) => {
    setTarget(placement);
    setReason('NO_LOAD');
    setRemarks('');
    setEmptyBudget('');
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (remarks.trim().length < 3) {
      toast.error('Remarks are required');
      return;
    }
    setSaving(true);
    try {
      await PlacementService.deletePlacement(target._id, {
        reason,
        remarks: remarks.trim(),
        emptyBudgetAmount: Number(emptyBudget) || 0,
      });
      toast.success(
        Number(emptyBudget) > 0
          ? `Deleted — ${money(Number(emptyBudget))} carried to this tanker's next trip`
          : 'Placement deleted',
      );
      setTarget(null);
      fetchPlacements(statusFilter, meta.page);
      fetchLegs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const vehicleLabel = (p) =>
    p.vehicleType === 'OWN'
      ? p.vehicleId?.registrationNumber || '—'
      : p.hireVehicleNumber || '—';

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Placements</h1>
          <p className="erp-subtitle">Vehicles assigned against delivery orders</p>
        </div>
      </div>

      {pendingLegs.meta.totalAmount > 0 && (
        <div className="erp-callout info" style={{ marginTop: 20 }}>
          <Info size={16} />
          <span>
            {money(pendingLegs.meta.totalAmount)} of empty running across{' '}
            {pendingLegs.data.length} leg{pendingLegs.data.length === 1 ? '' : 's'} is waiting to
            be charged to a loaded trip.
          </span>
        </div>
      )}

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PLACED">Placed</option>
          <option value="PENDING_APPROVAL">Awaiting approval</option>
          <option value="DELETED">Deleted</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading placements...</p>
          </div>
        ) : placements.length === 0 ? (
          <div className="erp-state">
            <Truck size={48} />
            <p>No placements yet</p>
            <span className="erp-cell-muted">
              Assign a tanker from the Placement Board.
            </span>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Placement</th>
                    <th>DO</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Carry Fwd</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {placements.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="erp-cell-strong">{p.placementNumber}</div>
                        <div className="erp-cell-muted">
                          {new Date(p.placementDate).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="erp-cell-muted">{p.doId?.doNumber || '—'}</td>
                      <td>
                        <div>{vehicleLabel(p)}</div>
                        {p.vendorId?.name && (
                          <div className="erp-cell-muted">{p.vendorId.name}</div>
                        )}
                      </td>
                      <td>
                        <span className="erp-badge neutral">{p.vehicleType}</span>
                      </td>
                      <td className="erp-numeric">{p.plannedQty}</td>
                      <td className="erp-numeric">
                        {p.carriedForwardAmount > 0 ? money(p.carriedForwardAmount) : '—'}
                      </td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[p.status] || 'neutral'}`}>
                          {p.status === 'PENDING_APPROVAL' ? 'AWAITING APPROVAL' : p.status}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          {p.status !== 'DELETED' && (
                            <button
                              className="btn-icon delete"
                              onClick={() => openDelete(p)}
                              title="Delete placement"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
                  onClick={() => fetchPlacements(statusFilter, meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} placements
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchPlacements(statusFilter, meta.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {target && (
        <div className="erp-modal-backdrop" onClick={() => setTarget(null)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>Delete {target.placementNumber}</h2>
              <button className="btn-icon" onClick={() => setTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDelete}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <AlertTriangle size={16} />
                  <span>
                    {target.plannedQty} goes back to {target.doId?.doNumber}. Any empty running
                    you record here is charged to this tanker&apos;s next loaded trip.
                  </span>
                </div>

                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="del-reason">
                      Reason <span className="required">*</span>
                    </label>
                    <select
                      id="del-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      {DELETE_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="del-budget">Empty running to carry forward (₹)</label>
                    <input
                      id="del-budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={emptyBudget}
                      onChange={(e) => setEmptyBudget(e.target.value)}
                      placeholder="4000"
                    />
                    <span className="erp-field-hint">
                      Leave blank if the tanker did not run empty.
                    </span>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="del-remarks">
                      Remarks <span className="required">*</span>
                    </label>
                    <textarea
                      id="del-remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="No load at Kharagpur"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={saving}>
                  {saving ? 'Deleting...' : 'Delete Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementsPage;
