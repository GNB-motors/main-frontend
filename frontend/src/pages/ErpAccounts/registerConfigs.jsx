import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/Erp/StatusBadge';
import { accountPathFor, documentPathFor } from './documentRoutes';
import { inr } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';

import ReceiptApi from '../ErpReceipts/ReceiptService';
import LedgerApi from '../ErpLedger/LedgerService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import { SupplierPaymentApi, SupplierInvoiceApi } from '../ErpSupplierPayments/SupplierPaymentService';
import FinanceApi from '../ErpFinance/FinanceService';

/**
 * Register definitions.
 *
 * Nine registers, and every endpoint behind them already existed — several of
 * the client methods were dead code that nothing ever called. This is what
 * turns the write-only screens (post a fleet expense, record a receipt, release
 * a payment) into things you can go back and look at.
 *
 * Each config is consumed by RegisterTable, which supplies the search box, date
 * range, pagination and CSV export. A register is therefore ~15 lines of column
 * definitions rather than a page.
 */

const money = (v) => <span className="erp-numeric">{inr(v)}</span>;
const rightAlign = { textAlign: 'right' };

const docLink = (sourceType, id, label, extra) => {
  const to = documentPathFor(sourceType, id, extra);
  return to ? <Link to={to}>{label}</Link> : label;
};

const partyLink = (accountType, id, label) => {
  const to = accountPathFor(accountType, id);
  return to ? <Link to={to}>{label || '—'}</Link> : (label || '—');
};

const REGISTERS = [
  {
    key: 'receipts',
    label: 'Receipts',
    hint: 'Every party receipt recorded, adjusted or not.',
    fetch: (params) => ReceiptApi.list(params),
    dateFilter: true,
    searchPlaceholder: 'Receipt no, instrument no, narration…',
    columns: [
      { header: 'Receipt #', render: (r) => docLink('RECEIPT', r._id, r.voucherNumber) },
      { header: 'Date', render: (r) => formatDateIST(r.voucherDate) },
      { header: 'Party', render: (r) => partyLink('PARTY', r.partyId, r.partyName) },
      { header: 'Mode', render: (r) => <StatusBadge status={r.mode} /> },
      { header: 'Instrument', render: (r) => r.instrumentNo || '—' },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Amount', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.amount) },
      { header: 'Unapplied', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.unadjustedAmount) },
    ],
  },
  {
    key: 'adjustments',
    label: 'Adjustments',
    hint: 'CN-wise allocations of receipts against bills, including deductions.',
    fetch: (params) => ReceiptApi.listAdjustments(params),
    dateFilter: true,
    searchPlaceholder: 'Adjustment no…',
    columns: [
      { header: 'Adjustment #', accessor: 'adjustmentNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.adjustmentDate) },
      { header: 'Party', render: (r) => partyLink('PARTY', r.partyId, r.partyName) },
      { header: 'Bills', render: (r) => (r.billAllocations?.length || 0) },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Allocated', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.totalAllocated) },
      { header: 'Deductions', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.totalDeductions) },
    ],
  },
  {
    key: 'vouchers',
    label: 'Vouchers',
    hint: 'All receipt, payment, journal and on-account vouchers.',
    fetch: (params) => LedgerApi.getVouchers(params),
    dateFilter: true,
    searchPlaceholder: 'Voucher no, instrument no, narration…',
    columns: [
      { header: 'Voucher #', render: (r) => docLink(r.voucherType, r._id, r.voucherNumber) },
      { header: 'Type', render: (r) => <StatusBadge status={r.voucherType} /> },
      { header: 'Date', render: (r) => formatDateIST(r.voucherDate) },
      { header: 'Account', render: (r) => partyLink(r.partyType, r.partyId, r.partyType) },
      { header: 'Mode', render: (r) => <StatusBadge status={r.mode} /> },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Amount', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.amount) },
    ],
  },
  {
    key: 'vendorPayments',
    label: 'Vendor payments',
    hint: 'Payment history — submitted, approved, released and cancelled.',
    fetch: (params) => VendorPaymentApi.list({ ...params, partyType: 'VENDOR' }),
    dateFilter: true,
    searchPlaceholder: 'Payment no, instrument no…',
    columns: [
      { header: 'Payment #', accessor: 'paymentNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.paymentDate) },
      { header: 'Vendor', render: (r) => partyLink('VENDOR', r.partyId, r.partyName || 'Vendor') },
      { header: 'Bills', render: (r) => (r.billAllocations?.length || 0) },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Email', render: (r) => (r.emailStatus ? <StatusBadge status={r.emailStatus} /> : '—') },
      { header: 'Net payable', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.netPayable) },
    ],
  },
  {
    key: 'supplierPayments',
    label: 'Supplier payments',
    hint: 'Same flow as vendors, for tyre/parts/service suppliers.',
    fetch: (params) => SupplierPaymentApi.list({ ...params, partyType: 'SUPPLIER' }),
    dateFilter: true,
    searchPlaceholder: 'Payment no, instrument no…',
    columns: [
      { header: 'Payment #', accessor: 'paymentNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.paymentDate) },
      { header: 'Supplier', render: (r) => partyLink('SUPPLIER', r.partyId, r.partyName || 'Supplier') },
      { header: 'Invoices', render: (r) => (r.billAllocations?.length || 0) },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Net payable', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.netPayable) },
    ],
  },
  {
    key: 'supplierInvoices',
    label: 'Supplier invoices',
    hint: 'Manually entered supplier bills awaiting or cleared for payment.',
    fetch: (params) => SupplierInvoiceApi.list(params),
    dateFilter: true,
    searchPlaceholder: 'Invoice no, ref no, description…',
    columns: [
      { header: 'Ref', render: (r) => docLink('SUPPLIER_INVOICE', r._id, r.refNumber || r.invoiceNumber) },
      { header: 'Invoice #', accessor: 'invoiceNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.invoiceDate) },
      { header: 'Supplier', render: (r) => partyLink('SUPPLIER', r.supplierId?._id || r.supplierId, r.supplierId?.name) },
      { header: 'Type', render: (r) => <StatusBadge status={r.supplyType} /> },
      { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { header: 'Net', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.netAmount) },
    ],
  },
  {
    key: 'fleetExpenses',
    label: 'Fleet expenses',
    hint: 'Labour and parts posted against one or more vehicles.',
    fetch: (params) => FinanceApi.listFleetExpenses(params),
    dateFilter: true,
    searchPlaceholder: 'Expense no, invoice ref, description…',
    columns: [
      { header: 'Expense #', accessor: 'expenseNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.expenseDate) },
      { header: 'Invoice ref', render: (r) => r.invoiceRef || '—' },
      { header: 'Vehicles', render: (r) => (r.vehicleAllocations?.length || 0) },
      { header: 'Labour', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.totalLabour) },
      { header: 'Parts', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.totalParts) },
      { header: 'TDS', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.tdsAmount) },
      { header: 'Net', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.netAmount) },
    ],
  },
  {
    key: 'othersVouchers',
    label: 'Others vouchers',
    hint: 'Miscellaneous expenses with TDS on taxable value.',
    fetch: (params) => FinanceApi.listOthersVouchers(params),
    dateFilter: true,
    searchPlaceholder: 'Voucher no, narration, category…',
    columns: [
      { header: 'Voucher #', accessor: 'voucherNumber' },
      { header: 'Date', render: (r) => formatDateIST(r.voucherDate) },
      { header: 'Category', render: (r) => r.category || '—' },
      { header: 'Account', render: (r) => partyLink(r.partyType, r.partyId, r.partyType) },
      { header: 'Narration', render: (r) => r.narration || '—' },
      { header: 'Net', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.netAmount) },
    ],
  },
  {
    key: 'vehiclePapers',
    label: 'Vehicle papers',
    hint: 'Insurance, permits and fitness — each amortised monthly as prepaid.',
    fetch: (params) => FinanceApi.listVehiclePapers(params),
    dateFilter: false,
    searchable: false,
    columns: [
      { header: 'Document', accessor: 'documentNumber' },
      { header: 'Type', render: (r) => <StatusBadge status={r.paperType} /> },
      { header: 'From', render: (r) => formatDateIST(r.startDate) },
      { header: 'Expires', render: (r) => formatDateIST(r.endDate) },
      { header: 'Amount', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.amount) },
    ],
  },
  {
    key: 'instalments',
    label: 'Instalments due',
    hint: 'EMIs falling due. Bounded by a look-ahead horizon, not the life of the loan.',
    fetch: (params) => FinanceApi.getInstalmentDueList({ ...params, horizonDays: 90 }),
    dateFilter: false,
    searchable: false,
    columns: [
      { header: 'Plan', accessor: 'planNumber' },
      { header: 'Financier', accessor: 'financierName' },
      { header: '#', accessor: 'instalmentNo' },
      { header: 'Due', render: (r) => formatDateIST(r.dueDate) },
      {
        header: 'Overdue',
        render: (r) => (r.isOverdue
          ? <StatusBadge status="OVERDUE" label={`${r.overdueDays}d`} />
          : <span className="erp-muted">—</span>),
      },
      { header: 'Principal', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.principalComponent) },
      { header: 'Interest', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.interestComponent) },
      { header: 'Total', headerStyle: rightAlign, cellStyle: rightAlign, render: (r) => money(r.totalAmount) },
    ],
  },
];

export default REGISTERS;
