/**
 * Party Master (ISOCL ERP)
 *
 * Customers that delivery orders are raised against. Credit limit and credit
 * days feed the Stage 2 DO credit check; the assigned KAM drives Stage 1 call
 * task generation.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import PartyService from './PartyService';
import useApi from '../../hooks/useApi';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const EMPTY_FORM = {
  name: '',
  code: '',
  gstin: '',
  pan: '',
  creditLimit: '',
  creditDays: '',
  kamId: '',
  contact: { person: '', phone: '', email: '' },
};

const formatCurrency = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const PartiesPage = () => {
  const [parties, setParties] = useState([]);
  const [kams, setKams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    data: partiesResponse,
    loading,
    error: partiesError,
    refetch: refetchParties,
  } = useApi(
    () =>
      PartyService.getParties({
        page,
        limit: 20,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    [JSON.stringify({ page, search: searchTerm, status: statusFilter })],
  );

  /** KAM dropdown. Only OWNER/MANAGER can read employees, so failure is silent. */
  const { data: kamsResponse } = useApi(
    (signal) =>
      apiClient.get('/api/employees', {
        params: { role: 'KAM', limit: 200 },
        signal,
      }),
    [],
  );

  useEffect(() => {
    if (partiesResponse) {
      setParties(partiesResponse.data || []);
      setMeta(partiesResponse.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    }
  }, [partiesResponse]);

  useEffect(() => {
    if (kamsResponse) setKams(kamsResponse.data?.data || []);
  }, [kamsResponse]);

  useEffect(() => {
    if (!partiesError) return;
    // The module 404s when the erpMasters flag is off — say so plainly.
    if (partiesError.status === 404) {
      toast.error('ERP Masters is not enabled for your organization');
    } else {
      toast.error(partiesError.message);
    }
    setParties([]);
  }, [partiesError]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (party) => {
    setEditingId(party._id);
    setForm({
      name: party.name || '',
      code: party.code || '',
      gstin: party.gstin || '',
      pan: party.pan || '',
      creditLimit: party.creditLimit ?? '',
      creditDays: party.creditDays ?? '',
      // kamId comes back populated on list responses.
      kamId: party.kamId?._id || party.kamId || '',
      contact: {
        person: party.contact?.person || '',
        phone: party.contact?.phone || '',
        email: party.contact?.email || '',
      },
    });
    setShowModal(true);
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const setContact = (name, value) =>
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, [name]: value } }));

  /** Strip blanks — the API rejects '' for optional pattern-validated fields. */
  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      creditLimit: Number(form.creditLimit) || 0,
      creditDays: Number(form.creditDays) || 0,
    };
    if (form.gstin.trim()) payload.gstin = form.gstin.trim().toUpperCase();
    if (form.pan.trim()) payload.pan = form.pan.trim().toUpperCase();
    payload.kamId = form.kamId || null;

    const contact = {};
    if (form.contact.person.trim()) contact.person = form.contact.person.trim();
    if (form.contact.phone.trim()) contact.phone = form.contact.phone.trim();
    if (form.contact.email.trim()) contact.email = form.contact.email.trim();
    if (Object.keys(contact).length) payload.contact = contact;

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await PartyService.updateParty(editingId, payload);
        toast.success('Party updated');
      } else {
        await PartyService.createParty(payload);
        toast.success('Party created');
      }
      setShowModal(false);
      refetchParties();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (party) => {
    if (party.status === 'INACTIVE') return;
    setSaving(true);
    try {
      await PartyService.deactivateParty(party._id);
      toast.success(`${party.name} deactivated`);
      refetchParties();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const kamName = (party) => {
    const kam = party.kamId;
    if (!kam) return '—';
    if (typeof kam === 'string') return '—';
    return `${kam.firstName || ''} ${kam.lastName || ''}`.trim() || '—';
  };

  return (
    <PageShell
      title="Party Master"
      subtitle="Customers, credit terms and account managers"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Party
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
        <select className="erp-filter" value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading parties...</p>
          </div>
        ) : parties.length === 0 ? (
          <div className="erp-state">
            <Building2 size={48} />
            <p>No parties found</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} />
              Add your first party
            </button>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Code</th>
                    <th>KAM</th>
                    <th>Credit Limit</th>
                    <th>Credit Days</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {parties.map((party) => (
                    <tr key={party._id}>
                      <td>
                        <div className="erp-cell-strong">{party.name}</div>
                        {party.contact?.person && (
                          <div className="erp-cell-muted">{party.contact.person}</div>
                        )}
                      </td>
                      <td className="erp-cell-muted">{party.code}</td>
                      <td>{kamName(party)}</td>
                      <td className="erp-numeric">{formatCurrency(party.creditLimit)}</td>
                      <td className="erp-numeric">{party.creditDays ?? 0}</td>
                      <td>
                        <span className={`erp-badge ${party.status?.toLowerCase()}`}>
                          {party.status}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(party)}
                            title="Edit party"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeactivate(party)}
                            disabled={party.status === 'INACTIVE' || saving}
                            title="Deactivate party"
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
                  Page {meta.page} of {meta.totalPages} · {meta.total} parties
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>{editingId ? 'Edit Party' : 'Add Party'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div className="erp-field">
                    <label htmlFor="party-name">
                      Party Name <span className="required">*</span>
                    </label>
                    <input
                      id="party-name"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="Berger Paints"
                      required
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-code">
                      Code <span className="required">*</span>
                    </label>
                    <input
                      id="party-code"
                      value={form.code}
                      onChange={(e) => setField('code', e.target.value.toUpperCase())}
                      placeholder="BERGER"
                      required
                    />
                    <span className="erp-field-hint">Unique within your organization</span>
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-credit-limit">Credit Limit (₹)</label>
                    <input
                      id="party-credit-limit"
                      type="number"
                      min="0"
                      value={form.creditLimit}
                      onChange={(e) => setField('creditLimit', e.target.value)}
                      placeholder="400000"
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-credit-days">Credit Days</label>
                    <input
                      id="party-credit-days"
                      type="number"
                      min="0"
                      max="365"
                      value={form.creditDays}
                      onChange={(e) => setField('creditDays', e.target.value)}
                      placeholder="30"
                    />
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="party-kam">Key Account Manager</label>
                    <select
                      id="party-kam"
                      value={form.kamId}
                      onChange={(e) => setField('kamId', e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {kams.map((kam) => (
                        <option key={kam._id} value={kam._id}>
                          {kam.firstName} {kam.lastName}
                        </option>
                      ))}
                    </select>
                    <span className="erp-field-hint">
                      {kams.length === 0
                        ? 'No users with the KAM role yet — create one under Employees.'
                        : 'Call schedules can reassign this.'}
                    </span>
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-gstin">GSTIN</label>
                    <input
                      id="party-gstin"
                      value={form.gstin}
                      onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                      placeholder="19AABCB1234C1ZK"
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-pan">PAN</label>
                    <input
                      id="party-pan"
                      value={form.pan}
                      onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                      placeholder="AABCB1234C"
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-contact-person">Contact Person</label>
                    <input
                      id="party-contact-person"
                      value={form.contact.person}
                      onChange={(e) => setContact('person', e.target.value)}
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="party-contact-phone">Contact Phone</label>
                    <input
                      id="party-contact-phone"
                      value={form.contact.phone}
                      onChange={(e) => setContact('phone', e.target.value)}
                    />
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="party-contact-email">Contact Email</label>
                    <input
                      id="party-contact-email"
                      type="email"
                      value={form.contact.email}
                      onChange={(e) => setContact('email', e.target.value)}
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
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default PartiesPage;
