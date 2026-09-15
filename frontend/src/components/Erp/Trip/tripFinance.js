// Pure helpers shared by the Trip Detail Financials section and the Current
// Action card. Kept framework-free so both can import without a cycle.

export const money = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Receivable / payable lifecycle state → the label + badge tone the cards show.
// Mirrors the states the backend erpTripFinance.service derives.
export const RECEIVABLE_STATES = {
  NOT_GENERATED: { label: 'Not generated', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Pending approval', tone: 'warning' },
  APPROVED_OUTSTANDING: { label: 'Outstanding', tone: 'info' },
  PARTIALLY_PAID: { label: 'Partially paid', tone: 'warning' },
  PAID: { label: 'Fully received', tone: 'success' },
};

export const PAYABLE_STATES = {
  NOT_APPLICABLE: { label: 'Own vehicle', tone: 'neutral' },
  NOT_GENERATED: { label: 'Not generated', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Pending approval', tone: 'warning' },
  APPROVED_UNPAID: { label: 'Payable', tone: 'info' },
  PAID: { label: 'Paid', tone: 'success' },
};

/**
 * The single next step for the "Current Action" card. Walks the operational
 * ladder first (the trip's actual job — CN → close → POD → unload), then the
 * finance ladder once the goods are unloaded. Blocked/waiting steps carry a
 * reason so a card that offers no button never looks broken — the user always
 * knows WHY nothing can happen yet, and finance steps only offer a real action
 * to viewers who are allowed to take it (else an "Accounts only" note).
 *
 * @param {{hasCn:boolean, closed:boolean, hasPod:boolean, hasUnloading:boolean}} ops
 * @param {object|null} finance  the /finance payload (receivable/payable/capabilities/approvals)
 * @returns {{tone:'act'|'wait'|'blocked'|'done', title:string, detail?:string,
 *            cta?:{label:string, drawer?:string, route?:string}, accountsOnly?:boolean}}
 */
export function resolveNextAction(ops, finance) {
  const {
    hasCn, closed, hasPod, hasUnloading,
  } = ops;

  // ── Operations ──
  if (!hasCn) {
    return {
      tone: 'act',
      title: 'Create CN & raise advances',
      detail: 'Confirm the loaded quantity to dispatch the vehicle.',
      cta: { label: 'Create CN', drawer: 'cn' },
    };
  }
  if (!closed) {
    return {
      tone: 'wait',
      title: 'In transit',
      detail: 'Vehicle dispatched. Close the trip once it reaches and unloads.',
      cta: { label: 'Close trip', drawer: 'close' },
    };
  }
  if (!hasPod) {
    return {
      tone: 'act',
      title: 'Upload POD',
      detail: 'Record the proof of delivery to proceed to unloading.',
      cta: { label: 'Upload POD', drawer: 'pod' },
    };
  }
  if (!hasUnloading) {
    return {
      tone: 'act',
      title: 'Enter unloading',
      detail: 'Capture unloaded quantity, shortage and detention.',
      cta: { label: 'Enter unloading', drawer: 'unloading' },
    };
  }

  // ── Finance (post-unloading). Best-effort: if the summary failed to load the
  // operational view still stands. ──
  if (!finance) {
    return { tone: 'wait', title: 'Unloading complete', detail: 'Loading finance status…' };
  }

  const caps = finance.capabilities || {};
  const recv = finance.receivable || {};
  const pay = finance.payable || {};

  if (recv.state === 'NOT_GENERATED') {
    return caps.canRecordReceipt
      ? {
        tone: 'act',
        title: 'Generate the sale bill',
        detail: 'Bill the customer for this trip.',
        cta: { label: 'Generate sale bill', drawer: 'salebill' },
      }
      : {
        tone: 'wait',
        title: 'Ready to bill',
        detail: 'The sale bill is raised by the Accounts team.',
        accountsOnly: true,
      };
  }
  if (recv.state === 'PENDING_APPROVAL') {
    return {
      tone: 'blocked',
      title: 'Blocked — awaiting sale bill approval',
      detail: 'The sale bill is with the approver before it becomes a receivable.',
    };
  }
  if (recv.state === 'APPROVED_OUTSTANDING' || recv.state === 'PARTIALLY_PAID') {
    return caps.canRecordReceipt
      ? {
        tone: 'act',
        title: 'Record customer receipt',
        detail: `${money(recv.outstanding)} outstanding from the customer.`,
        cta: { label: 'Record receipt', drawer: 'receipt' },
      }
      : {
        tone: 'wait',
        title: 'Awaiting customer payment',
        detail: `${money(recv.outstanding)} outstanding. The Accounts team records receipts.`,
        accountsOnly: true,
      };
  }

  // Receivable settled — is the vendor still to be paid on a hire trip?
  if (pay.applicable && pay.state !== 'PAID' && pay.state !== 'NOT_GENERATED') {
    if (pay.state === 'PENDING_APPROVAL') {
      return {
        tone: 'blocked',
        title: 'Blocked — awaiting purchase bill approval',
        detail: 'The hire purchase bill is pending approval.',
      };
    }
    return caps.canCreateVendorPayment
      ? {
        tone: 'act',
        title: 'Pay the vendor',
        detail: `${money(pay.payable)} payable to ${pay.purchaseBill?.vendorName || 'the vendor'}.`,
        cta: { label: 'Create vendor payment', route: '/erp/payables?tab=vendor' },
      }
      : {
        tone: 'wait',
        title: 'Vendor payment pending',
        detail: `${money(pay.payable)} payable. The Accounts team releases vendor payments.`,
        accountsOnly: true,
      };
  }

  return { tone: 'done', title: 'Trip complete', detail: 'Billed and settled. Nothing pending on this trip.' };
}
