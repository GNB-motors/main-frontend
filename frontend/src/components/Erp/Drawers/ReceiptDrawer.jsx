import React, { useState, useEffect, useId } from 'react';
import { toast } from 'react-toastify';
import ErpDrawer from '../ErpDrawer';
import ReceiptService from '../../../pages/ErpReceipts/ReceiptService';

const todayInput = () => new Date().toISOString().slice(0, 10);

const ReceiptDrawer = ({ isOpen, onClose, bill = null, party = null, onSuccess }) => {
  const uid = useId();
  const [receiptDate, setReceiptDate] = useState(todayInput());
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReceiptDate(todayInput());
      setPaymentMode('BANK');
      // SaleBill carries netAmount/outstandingAmount; `netReceivable` belongs to
      // Unloading and `grandTotal` to nothing at all, so the box never filled.
      // Default to what is still owed, not the full invoice.
      setAmount(
        bill ? String(bill.outstandingAmount ?? bill.netAmount ?? bill.netReceivable ?? '') : '',
      );
      setReference('');
      setRemarks('');
    }
  }, [isOpen, bill]);

  const handleRecord = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const partyId = party?._id || bill?.partyId?._id || bill?.partyId;
      await ReceiptService.create({
        partyId,
        receiptDate,
        mode: paymentMode,
        paymentMode,
        amount: Number(amount),
        instrumentNo: reference,
        reference,
        narration: remarks,
        remarks,
        allocations: bill ? [{ billId: bill._id, amount: Number(amount) }] : [],
      });

      toast.success('Receipt recorded successfully');
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
      <button
        type="submit"
        form="receipt-form"
        className="btn btn-primary"
        disabled={busy || !amount}
      >
        {busy ? 'Recording…' : 'Record Receipt'}
      </button>
    </>
  );

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={bill ? `Record Receipt for ${bill.billNumber}` : 'Record Customer Receipt'}
      subtitle="Allocate incoming payment against outstanding sale bills"
      footer={footer}
    >
      <form id="receipt-form" onSubmit={handleRecord}>
        <div className="erp-form-grid">
          <div className="erp-field full">
            <label htmlFor={`${uid}-party`}>Party</label>
            <input
              id={`${uid}-party`}
              aria-label="Party"
              disabled
              value={party?.name || bill?.partyId?.name || 'Pre-selected Party'}
              className="disabled"
            />
          </div>

          <div className="erp-field">
            <label htmlFor={`${uid}-receipt-date`}>
              Receipt Date <span className="required">*</span>
            </label>
            <input
              id={`${uid}-receipt-date`}
              aria-label="Receipt Date"
              type="date"
              required
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </div>

          <div className="erp-field">
            <label htmlFor={`${uid}-payment-mode`}>
              Payment Mode <span className="required">*</span>
            </label>
            <select
              id={`${uid}-payment-mode`}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="BANK">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div className="erp-field">
            <label htmlFor={`${uid}-amount`}>
              Amount (₹) <span className="required">*</span>
            </label>
            <input
              id={`${uid}-amount`}
              aria-label="Amount (₹)"
              type="number"
              step="any"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="erp-field">
            <label htmlFor={`${uid}-reference`}>Reference / UTR No.</label>
            <input
              id={`${uid}-reference`}
              aria-label="Reference / UTR No."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR12345678"
            />
          </div>

          <div className="erp-field full">
            <label htmlFor={`${uid}-remarks`}>Remarks</label>
            <textarea
              id={`${uid}-remarks`}
              aria-label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional receipt notes..."
            />
          </div>
        </div>
      </form>
    </ErpDrawer>
  );
};

export default ReceiptDrawer;
