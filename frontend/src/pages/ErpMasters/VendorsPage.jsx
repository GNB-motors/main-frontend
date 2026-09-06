/**
 * Vendor Master (ISOCL ERP)
 *
 * Market operators whose tankers are hired when no own vehicle is free.
 * Blacklisting here is a hard block on placement — there is no approval path
 * around it, which is why the reason is mandatory.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Ban, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpMasterService from './ErpMasterService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const EMPTY_FORM = {
  name: '',
  code: '',
  gstin: '',
  pan: '',
  contact: { person: '', phone: '', email: '' },
  tdsSection: '',
  tdsRate: '',
  tankersText: '',
};

/** "WB11AA1111, 30" per line -> tanker objects. */
const parseTankers = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [reg, cap] = line.split(',').map((s) => s.trim());
      return {
        registrationNumber: reg.toUpperCase(),
        capacity: cap ? Number(cap) : null,
        capacityUnit: 'KL',
        isActive: true,
      };
    })
    .filter((t) => t.registrationNumber.length >= 4);

const formatTankers = (tankers = []) =>
  tankers.map((t) => `${t.registrationNumber}${t.capacity ? `, ${t.capacity}` : ''}`).join('\n');

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [blacklistTarget, setBlacklistTarget] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState('');

  const fetchVendors = useCallback(async (search = '', page = 1) => {
    setLoading(true);
    try {
      const res = await ErpMasterService.getVendors({
        ...(search ? { search } : {}),
        page,
        limit: 20,
      });
      setVendors(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP Masters is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors('');
  }, [fetchVendors]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    fetchVendors(e.target.value);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (vendor) => {
    setEditingId(vendor._id);
    setForm({
      name: vendor.name || '',
      code: vendor.code || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      contact: {
        person: vendor.contact?.person || '',
        phone: vendor.contact?.phone || '',
        email: vendor.contact?.email || '',
      },
      tdsSection: vendor.tdsSection || '',
      tdsRate: vendor.tdsRate ?? '',
      tankersText: formatTankers(vendor.tankers),
    });
    setShowModal(true);
  };

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const setContact = (name, value) =>
    setForm((p) => ({ ...p, contact: { ...p.contact, [name]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        tankers: parseTankers(form.tankersText),
      };
      if (form.gstin.trim()) payload.gstin = form.gstin.trim().toUpperCase();
      if (form.pan.trim()) payload.pan = form.pan.trim().toUpperCase();
      if (form.tdsSection.trim()) payload.tdsSection = form.tdsSection.trim();
      if (form.tdsRate !== '') payload.tdsRate = Number(form.tdsRate);

      const contact = {};
      if (form.contact.person.trim()) contact.person = form.contact.person.trim();
      if (form.contact.phone.trim()) contact.phone = form.contact.phone.trim();
      if (form.contact.email.trim()) contact.email = form.contact.email.trim();
      if (Object.keys(contact).length) payload.contact = contact;

      if (editingId) {
        await ErpMasterService.updateVendor(editingId, payload);
        toast.success('Vendor updated');
      } else {
        await ErpMasterService.createVendor(payload);
        toast.success('Vendor created');
      }
      setShowModal(false);
      fetchVendors(searchTerm, meta.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlacklist = async (e) => {
    e.preventDefault();
    const turningOn = !blacklistTarget.isBlacklisted;
    if (turningOn && blacklistReason.trim().length < 3) {
      toast.error('A reason is required to blacklist');
      return;
    }
    setSaving(true);
    try {
      await ErpMasterService.setBlacklist(blacklistTarget._id, {
        isBlacklisted: turningOn,
        reason: turningOn ? blacklistReason.trim() : undefined,
      });
      toast.success(turningOn ? 'Vendor blacklisted' : 'Vendor removed from the blacklist');
      setBlacklistTarget(null);
      setBlacklistReason('');
      fetchVendors(searchTerm, meta.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Vendor Master"
      subtitle="Market operators for hired tankers"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Vendor
        </button>
      }
    >
      <div className="erp-toolbar">
        <div className="erp-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="erp-state">
            <ShieldCheck size={48} />
            <p>No vendors yet</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} />
              Add your first vendor
            </button>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Code</th>
                  <th>Tankers</th>
                  <th>TDS</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div className="erp-cell-strong">{v.name}</div>
                      {v.contact?.person && (
                        <div className="erp-cell-muted">{v.contact.person}</div>
                      )}
                    </td>
                    <td className="erp-cell-muted">{v.code}</td>
                    <td className="erp-numeric">{v.tankers?.length || 0}</td>
                    <td className="erp-cell-muted">
                      {v.tdsRate ? `${v.tdsRate}% ${v.tdsSection || ''}`.trim() : '—'}
                    </td>
                    <td>
                      {v.isBlacklisted ? (
                        <span className="erp-badge danger" title={v.blacklistReason}>
                          BLACKLISTED
                        </span>
                      ) : (
                        <span className={`erp-badge ${v.status?.toLowerCase()}`}>{v.status}</span>
                      )}
                    </td>
                    <td>
                      <div className="erp-actions">
                        <button className="btn-icon" onClick={() => openEdit(v)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`btn-icon ${v.isBlacklisted ? '' : 'delete'}`}
                          onClick={() => {
                            setBlacklistTarget(v);
                            setBlacklistReason('');
                          }}
                          title={v.isBlacklisted ? 'Remove from blacklist' : 'Blacklist'}
                        >
                          <Ban size={16} />
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
              <h2>{editingId ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div className="erp-field">
                    <label htmlFor="v-name">
                      Vendor Name <span className="required">*</span>
                    </label>
                    <input
                      id="v-name"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-code">
                      Code <span className="required">*</span>
                    </label>
                    <input
                      id="v-code"
                      value={form.code}
                      onChange={(e) => setField('code', e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-gstin">GSTIN</label>
                    <input
                      id="v-gstin"
                      value={form.gstin}
                      onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-pan">PAN</label>
                    <input
                      id="v-pan"
                      value={form.pan}
                      onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-person">Contact Person</label>
                    <input
                      id="v-person"
                      value={form.contact.person}
                      onChange={(e) => setContact('person', e.target.value)}
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-phone">Contact Phone</label>
                    <input
                      id="v-phone"
                      value={form.contact.phone}
                      onChange={(e) => setContact('phone', e.target.value)}
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-tdssec">TDS Section</label>
                    <input
                      id="v-tdssec"
                      value={form.tdsSection}
                      onChange={(e) => setField('tdsSection', e.target.value)}
                      placeholder="194C"
                    />
                  </div>
                  <div className="erp-field">
                    <label htmlFor="v-tdsrate">TDS Rate (%)</label>
                    <input
                      id="v-tdsrate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.tdsRate}
                      onChange={(e) => setField('tdsRate', e.target.value)}
                    />
                  </div>
                  <div className="erp-field full">
                    <label htmlFor="v-tankers">Tankers</label>
                    <textarea
                      id="v-tankers"
                      value={form.tankersText}
                      onChange={(e) => setField('tankersText', e.target.value)}
                      placeholder={'WB11AA1111, 30\nWB11BB2222, 34'}
                    />
                    <span className="erp-field-hint">
                      One per line: registration number, capacity in KL.
                    </span>
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
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {blacklistTarget && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBlacklistTarget(null);
          }}
        >
          <div className="erp-modal" style={{ maxWidth: 460 }}>
            <div className="erp-modal-header">
              <h2>
                {blacklistTarget.isBlacklisted ? 'Remove from blacklist' : 'Blacklist vendor'}
              </h2>
              <button className="btn-icon" onClick={() => setBlacklistTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBlacklist}>
              <div className="erp-modal-body">
                {blacklistTarget.isBlacklisted ? (
                  <p style={{ margin: 0 }}>
                    Allow <strong>{blacklistTarget.name}</strong> to be placed again?
                    {blacklistTarget.blacklistReason && (
                      <span className="erp-cell-muted">
                        {' '}
                        Blacklisted for: {blacklistTarget.blacklistReason}
                      </span>
                    )}
                  </p>
                ) : (
                  <>
                    <div className="erp-callout info">
                      <AlertTriangle size={16} />
                      <span>
                        A blacklisted vendor cannot be placed at all — not even with an approval.
                      </span>
                    </div>
                    <div className="erp-field full">
                      <label htmlFor="bl-reason">
                        Reason <span className="required">*</span>
                      </label>
                      <textarea
                        id="bl-reason"
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        placeholder="Repeated shortages"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBlacklistTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${blacklistTarget.isBlacklisted ? 'btn-primary' : 'btn-danger'}`}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : blacklistTarget.isBlacklisted ? 'Remove' : 'Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default VendorsPage;
