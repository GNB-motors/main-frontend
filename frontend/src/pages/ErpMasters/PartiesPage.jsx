/**
 * Party Master (ISOCL ERP)
 *
 * Customers that delivery orders are raised against. Credit limit and credit
 * days feed the Stage 2 DO credit check; the assigned KAM drives Stage 1 call
 * task generation.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PartyService from './PartyService';
import ErpMasterService from './ErpMasterService';
import useApi from '../../hooks/useApi';
import PageShell from '../../components/Erp/PageShell';
import PartiesTable from './PartiesTable';
import PartyModal from './PartyModal';
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
  const { data: kamsResponse } = useApi((signal) => ErpMasterService.getKams({ signal }), []);

  useEffect(() => {
    if (partiesResponse) {
      setParties(partiesResponse.data || []);
      setMeta(partiesResponse.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    }
  }, [partiesResponse]);

  useEffect(() => {
    if (kamsResponse) setKams(kamsResponse);
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
            aria-label="Search parties"
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
            <PartiesTable
              parties={parties}
              openEdit={openEdit}
              handleDeactivate={handleDeactivate}
              saving={saving}
            />

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
        <PartyModal
          editingId={editingId}
          setShowModal={setShowModal}
          handleSubmit={handleSubmit}
          form={form}
          setField={setField}
          setContact={setContact}
          kams={kams}
          saving={saving}
        />
      )}
    </PageShell>
  );
};

export default PartiesPage;
