/**
 * Rate Master (ISOCL ERP)
 *
 * Freight rates per party + route + material, versioned by effective date.
 * A delivery order resolves against these; adding a newer rate closes off the
 * one it supersedes so a lookup always has a single answer.
 */

import React, { useState, useEffect } from 'react';
import { Plus, IndianRupee, Trash2, X, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import RateMasterService from './RateMasterService';
import PartyService from './PartyService';
import useApi from '../../hooks/useApi';
import '../../styles/erp.css';

const UNITS = [
  { value: 'PER_KL', label: 'Per KL' },
  { value: 'PER_MT', label: 'Per MT' },
  { value: 'PER_TRIP', label: 'Per Trip' },
];

const todayInput = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  partyId: '',
  routeId: '',
  material: '',
  rate: '',
  unit: 'PER_KL',
  effectiveFrom: todayInput(),
};

const RatesPage = () => {
  const [rates, setRates] = useState([]);
  const [parties, setParties] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [partyFilter, setPartyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: ratesResponse, loading, error: ratesError, refetch: refetchRates } = useApi(
    () =>
      RateMasterService.getRates({
        rateType: 'SB',
        ...(partyFilter ? { partyId: partyFilter } : {}),
        page,
        limit: 20,
      }),
    [JSON.stringify({ partyId: partyFilter, page })],
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
    if (ratesResponse) {
      setRates(ratesResponse.data || []);
      setMeta(ratesResponse.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    }
  }, [ratesResponse]);

  useEffect(() => {
    if (partiesResponse) setParties(partiesResponse.data || []);
  }, [partiesResponse]);

  useEffect(() => {
    if (routesResponse) setRoutes(routesResponse.data?.data || []);
  }, [routesResponse]);

  useEffect(() => {
    if (!ratesError) return;
    if (ratesError.status === 404) {
      toast.error('ERP Masters is not enabled for your organization');
    } else {
      toast.error(ratesError.message);
    }
    setRates([]);
  }, [ratesError]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.partyId || !form.routeId || !form.material || !form.rate) {
      toast.error('Party, route, material and rate are all required');
      return;
    }

    setSaving(true);
    try {
      await RateMasterService.createRate({
        rateType: 'SB',
        partyId: form.partyId,
        routeId: form.routeId,
        material: form.material.trim().toUpperCase(),
        rate: Number(form.rate),
        unit: form.unit,
        effectiveFrom: form.effectiveFrom,
      });
      toast.success('Rate saved');
      setShowModal(false);
      refetchRates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (rate) => {
    setSaving(true);
    try {
      await RateMasterService.deactivateRate(rate._id);
      toast.success('Rate deactivated');
      refetchRates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unitLabel = (u) => UNITS.find((x) => x.value === u)?.label || u;
  const dateLabel = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Rate Master</h1>
          <p className="erp-subtitle">
            Sale rates by party, route and material — delivery orders resolve against these
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            Add Rate
          </button>
        </div>
      </div>

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={partyFilter}
          onChange={(e) => {
            setPartyFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All parties</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="erp-state">
            <IndianRupee size={48} />
            <p>No rates yet</p>
            <span className="erp-cell-muted">
              A delivery order needs a rate here, or a manual rate plus approval.
            </span>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Route</th>
                    <th>Material</th>
                    <th>Rate</th>
                    <th>Effective From</th>
                    <th>Effective To</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r._id}>
                      <td className="erp-cell-strong">{r.partyId?.name || '—'}</td>
                      <td className="erp-cell-muted">{r.routeId?.name || '—'}</td>
                      <td>{r.material}</td>
                      <td className="erp-numeric erp-cell-strong">
                        ₹{r.rate?.toLocaleString('en-IN')}{' '}
                        <span className="erp-cell-muted">{unitLabel(r.unit)}</span>
                      </td>
                      <td className="erp-numeric">{dateLabel(r.effectiveFrom)}</td>
                      <td className="erp-numeric">
                        {r.effectiveTo ? (
                          dateLabel(r.effectiveTo)
                        ) : (
                          <span className="erp-badge success">Current</span>
                        )}
                      </td>
                      <td>
                        <span className={`erp-badge ${r.status?.toLowerCase()}`}>{r.status}</span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeactivate(r)}
                            disabled={r.status === 'INACTIVE' || saving}
                            title="Deactivate rate"
                          >
                            <Trash2 size={16} />
                          </button>
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
                  onClick={() => setPage(meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} rates
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
              <h2>Add Rate</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Adding a rate for a combination that already has one closes the older rate
                    on this date. Orders already raised keep the rate they were created with.
                  </span>
                </div>

                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="rate-party">
                      Party <span className="required">*</span>
                    </label>
                    <select
                      id="rate-party"
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
                    <label htmlFor="rate-route">
                      Route <span className="required">*</span>
                    </label>
                    <select
                      id="rate-route"
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
                    {routes.length === 0 && (
                      <span className="erp-field-hint">
                        No routes yet — add one under Routes first.
                      </span>
                    )}
                  </div>

                  <div className="erp-field">
                    <label htmlFor="rate-material">
                      Material <span className="required">*</span>
                    </label>
                    <input
                      id="rate-material"
                      value={form.material}
                      onChange={(e) => setField('material', e.target.value.toUpperCase())}
                      placeholder="MTO"
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="rate-effective">
                      Effective From <span className="required">*</span>
                    </label>
                    <input
                      id="rate-effective"
                      type="date"
                      value={form.effectiveFrom}
                      onChange={(e) => setField('effectiveFrom', e.target.value)}
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="rate-amount">
                      Rate (₹) <span className="required">*</span>
                    </label>
                    <input
                      id="rate-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.rate}
                      onChange={(e) => setField('rate', e.target.value)}
                      placeholder="4500"
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="rate-unit">
                      Unit <span className="required">*</span>
                    </label>
                    <select
                      id="rate-unit"
                      value={form.unit}
                      onChange={(e) => setField('unit', e.target.value)}
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  {saving ? 'Saving...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatesPage;
