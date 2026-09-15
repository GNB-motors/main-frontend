import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import SaleBillApi from '../../../pages/ErpSaleBills/SaleBillService';

const todayInput = () => new Date().toISOString().slice(0, 10);

const SaleBillDrawer = ({
  isOpen,
  onClose,
  unloading = null, // Single unloading object or array
  party = null,
  onSuccess,
}) => {
  const [billDate, setBillDate] = useState(todayInput());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBillDate(todayInput());
    }
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!unloading && !party) return;
    setBusy(true);
    try {
      const partyId = party?._id || party?.partyId || unloading?.partyId?._id || unloading?.partyId;
      const unloadingIds = unloading ? [unloading._id || unloading.unloadingId] : (party?.unloadings || []).map(u => u.unloadingId || u._id);

      await SaleBillApi.create({
        partyId,
        billDate,
        unloadingIds,
      });

      toast.success('Sale bill created — pending approval');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" form="sale-bill-form" className="btn btn-primary" disabled={busy}>
        {busy ? 'Creating…' : 'Generate Sale Bill'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sale Bill"
      subtitle="Generate sale invoice for completed unloading entries"
      footer={footer}
    >
      <form id="sale-bill-form" onSubmit={handleCreate}>
        <div className="erp-form-grid">
          <div className="erp-field full">
            <label>Party</label>
            <input
              disabled
              value={party?.name || unloading?.partyName || unloading?.partyId?.name || 'Pre-selected Party'}
              className="disabled"
            />
          </div>

          <div className="erp-field full">
            <label>Bill Date <span className="required">*</span></label>
            <input
              type="date"
              required
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </div>
        </div>

        {unloading && (
          <div className="erp-card" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Unloading Summary</h4>
            <p style={{ margin: '0 0 4px 0' }}>Trip: <strong>{unloading.tripNumber}</strong></p>
            <p style={{ margin: '0 0 4px 0' }}>CN: <strong>{unloading.cnNumber || '—'}</strong></p>
            <p style={{ margin: 0 }}>Unloaded Qty: <strong>{unloading.unloadedQty}</strong></p>
          </div>
        )}
      </form>
    </ErpDrawer>
  );
};

export default SaleBillDrawer;
