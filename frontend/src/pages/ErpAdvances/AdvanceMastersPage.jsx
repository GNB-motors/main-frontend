/**
 * Advance Masters (ISOCL ERP Stage 4)
 *
 * The three inputs the advance calculator reads: expected mileage, state diesel
 * prices, and per-route non-fuel costs. One page with three tabs, because they
 * are only ever set up together.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Info, Gauge, Fuel, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import AdvanceService from './AdvanceService';
import useApi from '../../hooks/useApi';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const TABS = [
  { key: 'mileage', label: 'Mileage', icon: Gauge },
  { key: 'fuel', label: 'Diesel Rates', icon: Fuel },
  { key: 'budget', label: 'Route Costs', icon: Receipt },
];

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const AdvanceMastersPage = () => {
  const [tab, setTab] = useState('mileage');
  const [routes, setRoutes] = useState([]);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});

  const { data: routesResponse } = useApi(
    (signal) => apiClient.get('/api/routes', { params: { limit: 200 }, signal }),
    [],
  );

  const {
    data: rowsResponse,
    loading,
    error: rowsError,
    refetch: refetchRows,
  } = useApi(() => {
    if (tab === 'mileage') return AdvanceService.getMileage({ limit: 200 });
    if (tab === 'fuel') return AdvanceService.getFuelRates();
    return AdvanceService.getRouteBudgets({ limit: 200 });
  }, [JSON.stringify({ tab })]);

  useEffect(() => {
    if (routesResponse) setRoutes(routesResponse.data?.data || []);
  }, [routesResponse]);

  useEffect(() => {
    if (rowsResponse) setRows(rowsResponse.data || []);
  }, [rowsResponse]);

  useEffect(() => {
    if (!rowsError) return;
    if (rowsError.status === 404) {
      toast.error('ERP Masters is not enabled for your organization');
    } else {
      toast.error(rowsError.message);
    }
    setRows([]);
  }, [rowsError]);

  const openCreate = () => {
    setForm(
      tab === 'mileage'
        ? { vehicleModel: '', routeId: '', loadType: 'LOAD', kmPerLitre: '' }
        : tab === 'fuel'
          ? { state: '', rate: '', effectiveDate: new Date().toISOString().slice(0, 10) }
          : {
              routeId: '',
              vehicleModel: '',
              servicingAmount: '',
              bordersAmount: '',
              miscAmount: '',
              emptyDieselOnly: true,
            },
    );
    setShowModal(true);
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tab === 'mileage') {
        await AdvanceService.saveMileage({
          vehicleModel: form.vehicleModel.trim(),
          routeId: form.routeId || null,
          loadType: form.loadType,
          kmPerLitre: Number(form.kmPerLitre),
        });
      } else if (tab === 'fuel') {
        await AdvanceService.saveFuelRate({
          state: form.state.trim().toUpperCase(),
          rate: Number(form.rate),
          effectiveDate: form.effectiveDate,
        });
      } else {
        await AdvanceService.saveRouteBudget({
          routeId: form.routeId,
          vehicleModel: form.vehicleModel?.trim() || null,
          servicingAmount: Number(form.servicingAmount) || 0,
          bordersAmount: Number(form.bordersAmount) || 0,
          miscAmount: Number(form.miscAmount) || 0,
          emptyDieselOnly: form.emptyDieselOnly !== false,
        });
      }
      toast.success('Saved');
      setShowModal(false);
      refetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    setSaving(true);
    try {
      if (tab === 'mileage') await AdvanceService.deleteMileage(row._id);
      else if (tab === 'fuel') await AdvanceService.deleteFuelRate(row._id);
      else await AdvanceService.deleteRouteBudget(row._id);
      toast.success('Removed');
      refetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Advance Masters"
      subtitle="What the advance calculator reads to cost a trip"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add
        </button>
      }
    >
      <div className="erp-toolbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'fuel' && (
        <div className="erp-callout info" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            A trip&apos;s diesel is costed at the <strong>average</strong> of these across the
            states its route crosses — not a single state&apos;s price. Every state on a route needs
            a rate here.
          </span>
        </div>
      )}

      {tab === 'mileage' && (
        <div className="erp-callout info" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            Load and empty are kept separate. Leave the route blank to set a model-wide default;
            with nothing here, the fleet&apos;s own fuel history is used instead.
          </span>
        </div>
      )}

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="erp-state">
            <p>Nothing configured yet</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} />
              Add the first entry
            </button>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                {tab === 'mileage' ? (
                  <tr>
                    <th>Model</th>
                    <th>Route</th>
                    <th>Load State</th>
                    <th>km/L</th>
                    <th aria-label="Actions" />
                  </tr>
                ) : tab === 'fuel' ? (
                  <tr>
                    <th>State</th>
                    <th>Rate</th>
                    <th>Effective</th>
                    <th>Source</th>
                    <th aria-label="Actions" />
                  </tr>
                ) : (
                  <tr>
                    <th>Route</th>
                    <th>Model</th>
                    <th>Servicing</th>
                    <th>Borders</th>
                    <th>Misc</th>
                    <th aria-label="Actions" />
                  </tr>
                )}
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    {tab === 'mileage' ? (
                      <>
                        <td className="erp-cell-strong">{r.vehicleModel}</td>
                        <td className="erp-cell-muted">{r.routeId?.name || 'Any route'}</td>
                        <td>
                          <span
                            className={`erp-badge ${r.loadType === 'LOAD' ? 'open' : 'neutral'}`}
                          >
                            {r.loadType}
                          </span>
                        </td>
                        <td className="erp-numeric erp-cell-strong">{r.kmPerLitre}</td>
                      </>
                    ) : tab === 'fuel' ? (
                      <>
                        <td className="erp-cell-strong">{r.state}</td>
                        <td className="erp-numeric erp-cell-strong">₹{r.rate}</td>
                        <td className="erp-numeric erp-cell-muted">
                          {new Date(r.effectiveDate).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <span className="erp-badge neutral">{r.source}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="erp-cell-strong">{r.routeId?.name || '—'}</td>
                        <td className="erp-cell-muted">{r.vehicleModel || 'Any model'}</td>
                        <td className="erp-numeric">{money(r.servicingAmount)}</td>
                        <td className="erp-numeric">{money(r.bordersAmount)}</td>
                        <td className="erp-numeric">{money(r.miscAmount)}</td>
                      </>
                    )}
                    <td>
                      <div className="erp-actions">
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(r)}
                          disabled={saving}
                          title="Remove"
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
        )}
      </div>

      {showModal && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>Add {TABS.find((t) => t.key === tab).label}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  {tab === 'mileage' && (
                    <>
                      <div className="erp-field full">
                        <label htmlFor="m-model">
                          Vehicle Model <span className="required">*</span>
                        </label>
                        <input
                          id="m-model"
                          value={form.vehicleModel || ''}
                          onChange={(e) => setField('vehicleModel', e.target.value)}
                          placeholder="TATA LPT 4923"
                          required
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="m-route">Route</label>
                        <select
                          id="m-route"
                          value={form.routeId || ''}
                          onChange={(e) => setField('routeId', e.target.value)}
                        >
                          <option value="">Any route (model default)</option>
                          {routes.map((r) => (
                            <option key={r._id} value={r._id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="erp-field">
                        <label htmlFor="m-load">
                          Load State <span className="required">*</span>
                        </label>
                        <select
                          id="m-load"
                          value={form.loadType || 'LOAD'}
                          onChange={(e) => setField('loadType', e.target.value)}
                        >
                          <option value="LOAD">Loaded</option>
                          <option value="EMPTY">Empty</option>
                        </select>
                      </div>
                      <div className="erp-field">
                        <label htmlFor="m-kmpl">
                          km per litre <span className="required">*</span>
                        </label>
                        <input
                          id="m-kmpl"
                          type="number"
                          min="0.1"
                          max="50"
                          step="0.01"
                          value={form.kmPerLitre || ''}
                          onChange={(e) => setField('kmPerLitre', e.target.value)}
                          placeholder="2.7"
                          required
                        />
                      </div>
                    </>
                  )}

                  {tab === 'fuel' && (
                    <>
                      <div className="erp-field full">
                        <label htmlFor="f-state">
                          State <span className="required">*</span>
                        </label>
                        <input
                          id="f-state"
                          value={form.state || ''}
                          onChange={(e) => setField('state', e.target.value.toUpperCase())}
                          placeholder="WEST BENGAL"
                          required
                        />
                        <span className="erp-field-hint">
                          Must match the state names on your routes.
                        </span>
                      </div>
                      <div className="erp-field">
                        <label htmlFor="f-rate">
                          Diesel Rate (₹/L) <span className="required">*</span>
                        </label>
                        <input
                          id="f-rate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.rate || ''}
                          onChange={(e) => setField('rate', e.target.value)}
                          placeholder="96.50"
                          required
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="f-date">Effective From</label>
                        <input
                          id="f-date"
                          type="date"
                          value={form.effectiveDate || ''}
                          onChange={(e) => setField('effectiveDate', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {tab === 'budget' && (
                    <>
                      <div className="erp-field full">
                        <label htmlFor="b-route">
                          Route <span className="required">*</span>
                        </label>
                        <select
                          id="b-route"
                          value={form.routeId || ''}
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
                      <div className="erp-field full">
                        <label htmlFor="b-model">Vehicle Model</label>
                        <input
                          id="b-model"
                          value={form.vehicleModel || ''}
                          onChange={(e) => setField('vehicleModel', e.target.value)}
                          placeholder="Blank = applies to every model"
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="b-serv">Servicing (₹)</label>
                        <input
                          id="b-serv"
                          type="number"
                          min="0"
                          value={form.servicingAmount || ''}
                          onChange={(e) => setField('servicingAmount', e.target.value)}
                          placeholder="1000"
                        />
                        <span className="erp-field-hint">
                          Waived automatically when the same material is carried again.
                        </span>
                      </div>
                      <div className="erp-field">
                        <label htmlFor="b-border">Borders (₹)</label>
                        <input
                          id="b-border"
                          type="number"
                          min="0"
                          value={form.bordersAmount || ''}
                          onChange={(e) => setField('bordersAmount', e.target.value)}
                          placeholder="2000"
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="b-misc">Miscellaneous (₹)</label>
                        <input
                          id="b-misc"
                          type="number"
                          min="0"
                          value={form.miscAmount || ''}
                          onChange={(e) => setField('miscAmount', e.target.value)}
                          placeholder="500"
                        />
                      </div>
                      <div className="erp-field">
                        <label htmlFor="b-empty">Empty legs</label>
                        <select
                          id="b-empty"
                          value={form.emptyDieselOnly === false ? 'no' : 'yes'}
                          onChange={(e) => setField('emptyDieselOnly', e.target.value === 'yes')}
                        >
                          <option value="yes">Diesel only</option>
                          <option value="no">Include all costs</option>
                        </select>
                      </div>
                    </>
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdvanceMastersPage;
