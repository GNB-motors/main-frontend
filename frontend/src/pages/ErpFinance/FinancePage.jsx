/**
 * Finance module (ISOCL ERP Stage 15)
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import FinanceApi from './FinanceService';
import PageShell from '../../components/Erp/PageShell';
import EntityPicker from '../../components/Erp/EntityPicker';
import { inr } from '../../utils/formatMoney';
import { toISTDateString } from '../../utils/dateUtils';
import '../../styles/erp.css';

const todayInput = () => toISTDateString(new Date());

let allocationSeq = 0;
const emptyAllocation = () => ({
  // Stable key: allocations can be inserted and removed, so an array index
  // would re-key the wrong row and move focus mid-typing.
  _key: `alloc-${(allocationSeq += 1)}`,
  vehicleId: '',
  labourAmount: '',
  partsAmount: '',
});

const FinancePage = ({ embedded = false }) => {
  const [tab, setTab] = useState('fleet');
  const [busy, setBusy] = useState(false);

  const [fleetForm, setFleetForm] = useState({
    supplierId: '',
    expenseDate: todayInput(),
    invoiceRef: '',
    description: '',
    tdsRate: '10',
    gstRate: '0',
  });

  // The API accepts an unbounded vehicleAllocations array; the old form
  // hardcoded exactly two vehicles, so a three-vehicle job could not be entered.
  const [allocations, setAllocations] = useState([emptyAllocation()]);

  const [othersForm, setOthersForm] = useState({
    partyId: '',
    grossAmount: '',
    taxableValue: '',
    tdsRate: '2',
    narration: '',
  });

  const setAllocation = (idx, patch) => {
    setAllocations((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const addAllocation = () => setAllocations((prev) => [...prev, emptyAllocation()]);

  const removeAllocation = (idx) => {
    setAllocations((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  /**
   * Live preview of what will actually post. TDS applies to labour only, GST to
   * the whole gross — showing the net before submit means the user is not
   * finding out what they posted from a toast afterwards.
   */
  const preview = useMemo(() => {
    const totalLabour = allocations.reduce((s, a) => s + (Number(a.labourAmount) || 0), 0);
    const totalParts = allocations.reduce((s, a) => s + (Number(a.partsAmount) || 0), 0);
    const gross = totalLabour + totalParts;
    const tds = Math.round(((totalLabour * (Number(fleetForm.tdsRate) || 0)) / 100) * 100) / 100;
    const gst = Math.round(((gross * (Number(fleetForm.gstRate) || 0)) / 100) * 100) / 100;
    return {
      totalLabour, totalParts, gross, tds, gst, net: Math.round((gross + gst - tds) * 100) / 100,
    };
  }, [allocations, fleetForm.tdsRate, fleetForm.gstRate]);

  const othersPreview = useMemo(() => {
    const gross = Number(othersForm.grossAmount) || 0;
    const taxable = othersForm.taxableValue ? Number(othersForm.taxableValue) : gross;
    const tds = Math.round(((taxable * (Number(othersForm.tdsRate) || 0)) / 100) * 100) / 100;
    return { gross, taxable, tds, net: Math.round((gross - tds) * 100) / 100 };
  }, [othersForm]);

  const submitFleet = async (e) => {
    e.preventDefault();
    const valid = allocations.filter((a) => a.vehicleId);
    if (valid.length === 0) {
      toast.error('Add at least one vehicle');
      return;
    }
    setBusy(true);
    try {
      await FinanceApi.createFleetExpense({
        supplierId: fleetForm.supplierId || undefined,
        expenseDate: fleetForm.expenseDate,
        invoiceRef: fleetForm.invoiceRef || undefined,
        description: fleetForm.description || undefined,
        vehicleAllocations: valid.map((a) => ({
          vehicleId: a.vehicleId,
          labourAmount: Number(a.labourAmount) || 0,
          partsAmount: Number(a.partsAmount) || 0,
        })),
        tdsRate: Number(fleetForm.tdsRate),
        gstRate: Number(fleetForm.gstRate) || 0,
      });
      toast.success('Fleet expense posted');
      setAllocations([emptyAllocation()]);
      setFleetForm((f) => ({ ...f, invoiceRef: '', description: '' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitOthers = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await FinanceApi.createOthersVoucher({
        partyType: 'SUPPLIER',
        partyId: othersForm.partyId,
        grossAmount: Number(othersForm.grossAmount),
        taxableValue: othersForm.taxableValue ? Number(othersForm.taxableValue) : undefined,
        tdsRate: Number(othersForm.tdsRate),
        narration: othersForm.narration,
      });
      toast.success('Others voucher posted');
      setOthersForm((f) => ({ ...f, grossAmount: '', taxableValue: '', narration: '' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const registerLink = (sub) => (
    <Link to={`/erp/accounts?tab=registers&sub=${sub}`} className="erp-link-btn">
      View register →
    </Link>
  );

  return (
    <PageShell
      embedded={embedded}
      title={<><Landmark size={22} /> Finance</>}
      subtitle="Fleet expense (labour/parts split), others vouchers, prepaid &amp; EMI."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Accounts', to: '/erp/accounts' }, { label: 'Finance' }]}
    >
      <div className="erp-tabs">
        {[['fleet', 'Fleet expense'], ['others', 'Others voucher']].map(([key, label]) => (
          <button key={key} type="button" className={`erp-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'fleet' && (
        <form className="erp-card" onSubmit={submitFleet}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>New fleet expense</h3>
            {registerLink('fleetExpenses')}
          </div>

          <div className="erp-form-grid">
            <label>
              Supplier
              <EntityPicker
                type="SUPPLIER"
                value={fleetForm.supplierId}
                onChange={(id) => setFleetForm({ ...fleetForm, supplierId: id })}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={fleetForm.expenseDate}
                onChange={(e) => setFleetForm({ ...fleetForm, expenseDate: e.target.value })}
              />
            </label>
            <label>
              Invoice ref
              <input
                value={fleetForm.invoiceRef}
                onChange={(e) => setFleetForm({ ...fleetForm, invoiceRef: e.target.value })}
              />
            </label>
            <label>
              Description
              <input
                value={fleetForm.description}
                onChange={(e) => setFleetForm({ ...fleetForm, description: e.target.value })}
              />
            </label>
            <label>
              TDS % <span className="erp-field-hint">on labour only</span>
              <input
                type="number"
                min="0"
                value={fleetForm.tdsRate}
                onChange={(e) => setFleetForm({ ...fleetForm, tdsRate: e.target.value })}
              />
            </label>
            <label>
              GST %
              <input
                type="number"
                min="0"
                value={fleetForm.gstRate}
                onChange={(e) => setFleetForm({ ...fleetForm, gstRate: e.target.value })}
              />
            </label>
          </div>

          <h4 style={{ margin: '22px 0 10px', fontSize: 14 }}>Vehicle allocations</h4>
          <div className="erp-table-wrap">
            <table className="erp-table compact">
              <thead>
                <tr>
                  <th style={{ minWidth: 240 }}>Vehicle</th>
                  <th style={{ textAlign: 'right' }}>Labour</th>
                  <th style={{ textAlign: 'right' }}>Parts</th>
                  <th style={{ textAlign: 'right' }}>Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {allocations.map((a, idx) => (
                  <tr key={a._key}>
                    <td>
                      <EntityPicker
                        type="VEHICLE"
                        value={a.vehicleId}
                        onChange={(id) => setAllocation(idx, { vehicleId: id })}
                        placeholder="Search vehicle…"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={a.labourAmount}
                        onChange={(e) => setAllocation(idx, { labourAmount: e.target.value })}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={a.partsAmount}
                        onChange={(e) => setAllocation(idx, { partsAmount: e.target.value })}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className="erp-numeric" style={{ textAlign: 'right' }}>
                      {inr((Number(a.labourAmount) || 0) + (Number(a.partsAmount) || 0))}
                    </td>
                    <td className="erp-actions">
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => removeAllocation(idx)}
                        disabled={allocations.length === 1}
                        aria-label="Remove vehicle"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="erp-btn small" onClick={addAllocation} style={{ marginTop: 10 }}>
            <Plus size={14} /> Add vehicle
          </button>

          <div className="erp-callout info" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', fontSize: 13 }}>
              <span>Labour <strong className="erp-numeric">{inr(preview.totalLabour)}</strong></span>
              <span>Parts <strong className="erp-numeric">{inr(preview.totalParts)}</strong></span>
              <span>Gross <strong className="erp-numeric">{inr(preview.gross)}</strong></span>
              <span>GST <strong className="erp-numeric">{inr(preview.gst)}</strong></span>
              <span>TDS <strong className="erp-numeric">−{inr(preview.tds)}</strong></span>
              <span>Net payable <strong className="erp-numeric">{inr(preview.net)}</strong></span>
            </div>
          </div>

          <div className="erp-form-actions">
            <button type="submit" className="erp-btn primary" disabled={busy}>
              {busy ? 'Posting…' : 'Post fleet expense'}
            </button>
          </div>
        </form>
      )}

      {tab === 'others' && (
        <form className="erp-card" onSubmit={submitOthers}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>New others voucher</h3>
            {registerLink('othersVouchers')}
          </div>

          <div className="erp-form-grid">
            <label>
              Supplier <span className="required">*</span>
              <EntityPicker
                type="SUPPLIER"
                value={othersForm.partyId}
                onChange={(id) => setOthersForm({ ...othersForm, partyId: id })}
                required
              />
            </label>
            <label>
              Gross amount <span className="required">*</span>
              <input
                type="number"
                min="0.01"
                required
                value={othersForm.grossAmount}
                onChange={(e) => setOthersForm({ ...othersForm, grossAmount: e.target.value })}
              />
            </label>
            <label>
              Taxable value <span className="erp-field-hint">defaults to gross</span>
              <input
                type="number"
                min="0"
                value={othersForm.taxableValue}
                onChange={(e) => setOthersForm({ ...othersForm, taxableValue: e.target.value })}
              />
            </label>
            <label>
              TDS %
              <input
                type="number"
                min="0"
                value={othersForm.tdsRate}
                onChange={(e) => setOthersForm({ ...othersForm, tdsRate: e.target.value })}
              />
            </label>
            <label className="full">
              Narration
              <input
                value={othersForm.narration}
                onChange={(e) => setOthersForm({ ...othersForm, narration: e.target.value })}
              />
            </label>
          </div>

          <div className="erp-callout info" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', fontSize: 13 }}>
              <span>Gross <strong className="erp-numeric">{inr(othersPreview.gross)}</strong></span>
              <span>Taxable <strong className="erp-numeric">{inr(othersPreview.taxable)}</strong></span>
              <span>TDS <strong className="erp-numeric">−{inr(othersPreview.tds)}</strong></span>
              <span>Net <strong className="erp-numeric">{inr(othersPreview.net)}</strong></span>
            </div>
          </div>

          <div className="erp-form-actions">
            <button type="submit" className="erp-btn primary" disabled={busy}>
              {busy ? 'Posting…' : 'Post others voucher'}
            </button>
          </div>
        </form>
      )}
    </PageShell>
  );
};

export default FinancePage;
