/**
 * Finance module (ISOCL ERP Stage 15) — phase 1 UI
 */

import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { toast } from 'react-toastify';
import FinanceApi from './FinanceService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

const FinancePage = ({ embedded = false }) => {
  const [tab, setTab] = useState('fleet');
  const [busy, setBusy] = useState(false);

  const [fleetForm, setFleetForm] = useState({
    supplierId: '',
    expenseDate: todayInput(),
    vehicleId1: '',
    labour1: '',
    parts1: '',
    vehicleId2: '',
    labour2: '',
    parts2: '',
    tdsRate: '10',
  });

  const [othersForm, setOthersForm] = useState({
    partyId: '',
    grossAmount: '',
    taxableValue: '',
    tdsRate: '2',
    narration: '',
  });

  const submitFleet = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const allocations = [
        {
          vehicleId: fleetForm.vehicleId1,
          labourAmount: Number(fleetForm.labour1) || 0,
          partsAmount: Number(fleetForm.parts1) || 0,
        },
      ];
      if (fleetForm.vehicleId2) {
        allocations.push({
          vehicleId: fleetForm.vehicleId2,
          labourAmount: Number(fleetForm.labour2) || 0,
          partsAmount: Number(fleetForm.parts2) || 0,
        });
      }
      await FinanceApi.createFleetExpense({
        supplierId: fleetForm.supplierId || undefined,
        expenseDate: fleetForm.expenseDate,
        vehicleAllocations: allocations,
        tdsRate: Number(fleetForm.tdsRate),
      });
      toast.success('Fleet expense posted');
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
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
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={<><Landmark size={22} /> Finance</>}
      subtitle="Fleet expense (labour/parts split), others vouchers, prepaid &amp; EMI — phase 1."
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
        <form className="erp-card erp-form-grid" onSubmit={submitFleet}>
          <label>
            Supplier ID
            <input
              value={fleetForm.supplierId}
              onChange={(e) => setFleetForm({ ...fleetForm, supplierId: e.target.value })}
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
            Vehicle 1 ID
            <input
              required
              value={fleetForm.vehicleId1}
              onChange={(e) => setFleetForm({ ...fleetForm, vehicleId1: e.target.value })}
            />
          </label>
          <label>
            Labour 1
            <input
              type="number"
              min="0"
              value={fleetForm.labour1}
              onChange={(e) => setFleetForm({ ...fleetForm, labour1: e.target.value })}
            />
          </label>
          <label>
            Parts 1
            <input
              type="number"
              min="0"
              value={fleetForm.parts1}
              onChange={(e) => setFleetForm({ ...fleetForm, parts1: e.target.value })}
            />
          </label>
          <label>
            Vehicle 2 ID (multi)
            <input
              value={fleetForm.vehicleId2}
              onChange={(e) => setFleetForm({ ...fleetForm, vehicleId2: e.target.value })}
            />
          </label>
          <label>
            Labour 2
            <input
              type="number"
              min="0"
              value={fleetForm.labour2}
              onChange={(e) => setFleetForm({ ...fleetForm, labour2: e.target.value })}
            />
          </label>
          <label>
            Parts 2
            <input
              type="number"
              min="0"
              value={fleetForm.parts2}
              onChange={(e) => setFleetForm({ ...fleetForm, parts2: e.target.value })}
            />
          </label>
          <label>
            TDS % (labour only)
            <input
              type="number"
              min="0"
              value={fleetForm.tdsRate}
              onChange={(e) => setFleetForm({ ...fleetForm, tdsRate: e.target.value })}
            />
          </label>
          <div className="erp-form-actions full-width">
            <button type="submit" className="erp-btn primary" disabled={busy}>
              Post fleet expense
            </button>
          </div>
        </form>
      )}

      {tab === 'others' && (
        <form className="erp-card erp-form-grid" onSubmit={submitOthers}>
          <label>
            Supplier ID
            <input
              required
              value={othersForm.partyId}
              onChange={(e) => setOthersForm({ ...othersForm, partyId: e.target.value })}
            />
          </label>
          <label>
            Gross amount
            <input
              type="number"
              min="0.01"
              required
              value={othersForm.grossAmount}
              onChange={(e) => setOthersForm({ ...othersForm, grossAmount: e.target.value })}
            />
          </label>
          <label>
            Taxable value
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
          <label className="full-width">
            Narration
            <input
              value={othersForm.narration}
              onChange={(e) => setOthersForm({ ...othersForm, narration: e.target.value })}
            />
          </label>
          <div className="erp-form-actions full-width">
            <button type="submit" className="erp-btn primary" disabled={busy}>
              Post others voucher
            </button>
          </div>
        </form>
      )}
    </PageShell>
  );
};

export default FinancePage;
