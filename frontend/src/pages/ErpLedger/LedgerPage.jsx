/**
 * Ledger & Vouchers (ISOCL ERP — ledger foundation)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import LedgerApi from './LedgerService';
import PartyService from '../ErpMasters/PartyService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const LedgerPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('statement');
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [statement, setStatement] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    voucherType: 'RECEIPT',
    partyId: '',
    amount: '',
    mode: 'NEFT',
    instrumentNo: '',
    narration: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    PartyService.getParties({ limit: 200 })
      .then((res) => setParties(res.data || []))
      .catch(() => setParties([]));
  }, []);

  const loadStatement = useCallback(async () => {
    if (!partyId) {
      setStatement(null);
      return;
    }
    setLoading(true);
    try {
      const res = await LedgerApi.getStatement({
        accountType: 'PARTY',
        accountId: partyId,
        limit: 100,
      });
      setStatement(res.data);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Accounts / ledger is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setStatement(null);
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LedgerApi.getVouchers({ limit: 50 });
      setVouchers(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'statement') loadStatement();
    else loadVouchers();
  }, [tab, loadStatement, loadVouchers]);

  const submitVoucher = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await LedgerApi.createVoucher({
        voucherType: voucherForm.voucherType,
        partyType: 'PARTY',
        partyId: voucherForm.partyId,
        amount: Number(voucherForm.amount),
        mode: voucherForm.mode,
        instrumentNo: voucherForm.instrumentNo,
        narration: voucherForm.narration,
      });
      toast.success('Voucher created');
      setShowVoucher(false);
      loadVouchers();
      if (voucherForm.partyId === partyId) loadStatement();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={<><BookOpen size={22} style={{ marginRight: 8 }} /> Ledger</>}
      subtitle="Party / vendor / supplier / driver accounts. Stages 8–14 post entries here."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Accounts', to: '/erp/accounts' }, { label: 'Ledger' }]}
      actions={(
        <button type="button" className="btn btn-primary" onClick={() => setShowVoucher(true)}>
          <Plus size={16} /> New voucher
        </button>
      )}
    >

      <div className="erp-toolbar">
        <div className="erp-tabs">
          <button
            type="button"
            className={`erp-tab ${tab === 'statement' ? 'active' : ''}`}
            onClick={() => setTab('statement')}
          >
            Statement
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setTab('vouchers')}
          >
            Vouchers
          </button>
        </div>
        {tab === 'statement' && (
          <select
            className="erp-filter"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
          >
            <option value="">Select party</option>
            {parties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="erp-muted">Loading…</p>
      ) : tab === 'statement' ? (
        !partyId ? (
          <p className="erp-muted">Choose a party to view its ledger.</p>
        ) : !statement ? (
          <p className="erp-muted">No statement</p>
        ) : (
          <>
            <div className="erp-inline" style={{ gap: 24, margin: '16px 0' }}>
              <span>
                Opening: <strong>{money(statement.openingBalance)}</strong>
              </span>
              <span>
                Closing: <strong>{money(statement.closingBalance)}</strong>
              </span>
              <span>
                Debit: <strong>{money(statement.totals?.debit)}</strong>
              </span>
              <span>
                Credit: <strong>{money(statement.totals?.credit)}</strong>
              </span>
            </div>
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Narration</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(statement.entries || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="erp-muted">
                        No entries
                      </td>
                    </tr>
                  ) : (
                    statement.entries.map((e) => (
                      <tr key={e._id}>
                        <td>{e.entryDate ? String(e.entryDate).slice(0, 10) : '—'}</td>
                        <td>{e.sourceLabel || e.sourceType}</td>
                        <td>{e.narration || '—'}</td>
                        <td>{e.debit ? money(e.debit) : '—'}</td>
                        <td>{e.credit ? money(e.credit) : '—'}</td>
                        <td>{money(e.runningBalance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Unadjusted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-muted">
                    No vouchers yet
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v._id}>
                    <td>{v.voucherNumber}</td>
                    <td>{v.voucherType}</td>
                    <td>{v.voucherDate ? String(v.voucherDate).slice(0, 10) : '—'}</td>
                    <td>{money(v.amount)}</td>
                    <td>{money(v.unadjustedAmount)}</td>
                    <td>
                      <span className="erp-badge neutral">{v.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showVoucher && (
        <div className="erp-modal-backdrop" onClick={() => setShowVoucher(false)} role="presentation">
          <div className="erp-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="erp-modal-header">
              <h2>New voucher</h2>
              <button
                type="button"
                className="erp-icon-btn"
                onClick={() => setShowVoucher(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className="erp-form" onSubmit={submitVoucher}>
              <div className="erp-form-grid">
                <label>
                  Type
                  <select
                    value={voucherForm.voucherType}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, voucherType: e.target.value })
                    }
                  >
                    <option value="RECEIPT">Receipt</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="ON_ACCOUNT">On account</option>
                    <option value="JOURNAL">Journal</option>
                  </select>
                </label>
                <label>
                  Party
                  <select
                    required
                    value={voucherForm.partyId}
                    onChange={(e) => setVoucherForm({ ...voucherForm, partyId: e.target.value })}
                  >
                    <option value="">Select</option>
                    {parties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                  />
                </label>
                <label>
                  Mode
                  <select
                    value={voucherForm.mode}
                    onChange={(e) => setVoucherForm({ ...voucherForm, mode: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </label>
                <label>
                  Instrument / UTR
                  <input
                    value={voucherForm.instrumentNo}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, instrumentNo: e.target.value })
                    }
                  />
                </label>
                <label>
                  Narration
                  <input
                    value={voucherForm.narration}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, narration: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="erp-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVoucher(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default LedgerPage;
