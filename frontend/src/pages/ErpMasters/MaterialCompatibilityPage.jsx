/**
 * Material Compatibility (ISOCL ERP)
 *
 * Which material may follow which in the same tanker. A whitelist, because for
 * a chemical-safety rule the default has to be "no".
 *
 * While this list is empty the placement check is skipped entirely — a new
 * organization would otherwise be unable to place anything. Adding the first
 * rule switches enforcement on, so a half-filled list is stricter than an empty
 * one. The page says so plainly.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FlaskConical, Trash2, X, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpMasterService from './ErpMasterService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const EMPTY_FORM = {
  previousMaterial: '',
  allowedText: '',
  cleaningText: '',
  notes: '',
};

const toList = (text) =>
  text
    .split(/[,\n]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

const MaterialCompatibilityPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ErpMasterService.getCompatibility({ limit: 200 });
      setRules(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP Masters is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (rule) => {
    setForm({
      previousMaterial: rule.previousMaterial,
      allowedText: (rule.allowedMaterials || []).join(', '),
      cleaningText: (rule.requiresCleaning || []).join(', '),
      notes: rule.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.previousMaterial.trim()) {
      toast.error('Previous material is required');
      return;
    }
    setSaving(true);
    try {
      await ErpMasterService.saveCompatibility({
        previousMaterial: form.previousMaterial.trim().toUpperCase(),
        allowedMaterials: toList(form.allowedText),
        requiresCleaning: toList(form.cleaningText),
        notes: form.notes.trim(),
      });
      toast.success('Compatibility rule saved');
      setShowModal(false);
      fetchRules();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await ErpMasterService.deleteCompatibility(deleteTarget._id);
      toast.success('Rule deleted');
      setDeleteTarget(null);
      fetchRules();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Material Compatibility"
      subtitle="Which material may be loaded after which, in the same tanker"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Rule
        </button>
      }
    >
      {!loading && rules.length === 0 ? (
        <div className="erp-callout info" style={{ marginTop: 20 }}>
          <AlertTriangle size={16} />
          <span>
            <strong>No rules configured — compatibility is not being checked.</strong> Placement
            allows any material combination while this list is empty. Adding the first rule switches
            enforcement on, and any previous material without a rule is then refused.
          </span>
        </div>
      ) : (
        !loading && (
          <div className="erp-callout success" style={{ marginTop: 20 }}>
            <Info size={16} />
            <span>
              Enforcement is <strong>on</strong>. A tanker whose previous material has no rule here
              cannot be placed.
            </span>
          </div>
        )
      )}

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="erp-state">
            <FlaskConical size={48} />
            <p>No compatibility rules yet</p>
            <span className="erp-cell-muted">
              Ask the client for the full list before going live.
            </span>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Previous Material</th>
                  <th>Allowed Next</th>
                  <th>Allowed After Cleaning</th>
                  <th>Notes</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r._id}>
                    <td className="erp-cell-strong">{r.previousMaterial}</td>
                    <td>
                      {(r.allowedMaterials || []).length === 0 ? (
                        <span className="erp-cell-muted">none</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.allowedMaterials.map((m) => (
                            <span key={m} className="erp-badge success">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {(r.requiresCleaning || []).length === 0 ? (
                        <span className="erp-cell-muted">—</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.requiresCleaning.map((m) => (
                            <span key={m} className="erp-badge warning">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="erp-cell-muted">{r.notes || '—'}</td>
                    <td>
                      <div className="erp-actions">
                        <button className="btn btn-secondary" onClick={() => openEdit(r)}>
                          Edit
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => setDeleteTarget(r)}
                          title="Delete rule"
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
              <h2>Compatibility Rule</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Saving replaces any existing rule for this previous material. Anything not
                    listed here is refused.
                  </span>
                </div>

                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="mc-prev">
                      Previous Material <span className="required">*</span>
                    </label>
                    <input
                      id="mc-prev"
                      value={form.previousMaterial}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, previousMaterial: e.target.value.toUpperCase() }))
                      }
                      placeholder="MTO"
                      required
                    />
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="mc-allowed">Allowed Next</label>
                    <textarea
                      id="mc-allowed"
                      value={form.allowedText}
                      onChange={(e) => setForm((p) => ({ ...p, allowedText: e.target.value }))}
                      placeholder="MTO, SKO, HSD"
                    />
                    <span className="erp-field-hint">Comma or newline separated.</span>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="mc-clean">Allowed After Cleaning</label>
                    <textarea
                      id="mc-clean"
                      value={form.cleaningText}
                      onChange={(e) => setForm((p) => ({ ...p, cleaningText: e.target.value }))}
                      placeholder="BITUMEN"
                    />
                    <span className="erp-field-hint">
                      Placement is allowed but flagged as needing a wash.
                    </span>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="mc-notes">Notes</label>
                    <input
                      id="mc-notes"
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
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
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="erp-modal" style={{ maxWidth: 420 }}>
            <div className="erp-modal-header">
              <h2>Delete Rule</h2>
              <button className="btn-icon" onClick={() => setDeleteTarget(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="erp-modal-body">
              <p style={{ margin: 0 }}>
                Delete the rule for <strong>{deleteTarget.previousMaterial}</strong>? Any tanker
                that last carried it will then be refused.
              </p>
            </div>
            <div className="erp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default MaterialCompatibilityPage;
