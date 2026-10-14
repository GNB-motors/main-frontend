import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { documentPathFor } from '../documentRoutes';
import { inr } from '../../../utils/formatMoney';
import { formatDateIST } from '../../../utils/dateUtils';

export function buildOpenItemColumns(accountType) {
  if (accountType === 'PARTY') {
    return [
      {
        header: 'Bill #',
        render: (r) => {
          const to = documentPathFor('SALE_BILL', r.billId);
          return to ? <Link to={to}>{r.billNumber}</Link> : r.billNumber;
        },
      },
      { header: 'Date', render: (r) => formatDateIST(r.billDate) },
      { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
      {
        header: 'Ageing',
        render: (r) => (
          <StatusBadge
            status={r.ageingBucket}
            label={r.overdueDays ? `${r.overdueDays}d` : undefined}
          />
        ),
      },
      {
        header: 'Bill total',
        headerStyle: { textAlign: 'right' },
        cellStyle: { textAlign: 'right' },
        render: (r) => <span className="erp-numeric">{inr(r.netAmount)}</span>,
      },
      {
        header: 'Outstanding',
        headerStyle: { textAlign: 'right' },
        cellStyle: { textAlign: 'right' },
        render: (r) => (
          <span className="erp-numeric">
            <strong>{inr(r.outstandingAmount)}</strong>
          </span>
        ),
      },
    ];
  }
  if (accountType === 'VENDOR') {
    return [
      {
        header: 'Bill #',
        render: (r) => {
          const to = documentPathFor('PURCHASE_BILL', r.purchaseBillId);
          return to ? <Link to={to}>{r.billNumber}</Link> : r.billNumber;
        },
      },
      {
        header: 'Trip',
        render: (r) =>
          r.tripId ? (
            <Link to={`/erp/trips/${r.tripId}`}>{r.tripNumber || 'View'}</Link>
          ) : (
            r.tripNumber || '—'
          ),
      },
      { header: 'Vehicle', render: (r) => r.vehicleNumber || '—' },
      { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
      {
        header: 'Ageing',
        render: (r) => (
          <StatusBadge
            status={r.ageingBucket}
            label={r.overdueDays ? `${r.overdueDays}d` : undefined}
          />
        ),
      },
      {
        header: 'Net',
        headerStyle: { textAlign: 'right' },
        cellStyle: { textAlign: 'right' },
        render: (r) => (
          <span className="erp-numeric">
            <strong>{inr(r.netAmount)}</strong>
          </span>
        ),
      },
    ];
  }
  if (accountType === 'SUPPLIER') {
    return [
      {
        header: 'Ref',
        render: (r) => {
          const to = documentPathFor('SUPPLIER_INVOICE', r.supplierInvoiceId);
          return to ? (
            <Link to={to}>{r.refNumber || r.invoiceNumber}</Link>
          ) : (
            r.refNumber || r.invoiceNumber
          );
        },
      },
      { header: 'Invoice #', render: (r) => r.invoiceNumber || '—' },
      { header: 'Type', render: (r) => <StatusBadge status={r.supplyType} /> },
      { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
      {
        header: 'Ageing',
        render: (r) => (
          <StatusBadge
            status={r.ageingBucket}
            label={r.overdueDays ? `${r.overdueDays}d` : undefined}
          />
        ),
      },
      {
        header: 'Net',
        headerStyle: { textAlign: 'right' },
        cellStyle: { textAlign: 'right' },
        render: (r) => (
          <span className="erp-numeric">
            <strong>{inr(r.netAmount)}</strong>
          </span>
        ),
      },
    ];
  }
  return [];
}
