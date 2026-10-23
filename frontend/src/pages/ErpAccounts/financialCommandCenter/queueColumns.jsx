import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { accountPathFor, documentPathFor } from '../documentRoutes';
import { inr } from '../../../utils/formatMoney';
import { formatDateIST } from '../../../utils/dateUtils';

export function buildQueueColumns(queue) {
  if (queue === 'overdue') {
    return [
      {
        header: 'Bill #',
        render: (r) => {
          const to = documentPathFor('SALE_BILL', r.billId);
          return to ? (
            <Link to={to} className="acc-doc-link">
              {r.billNumber}
            </Link>
          ) : (
            <span className="acc-doc-link">{r.billNumber}</span>
          );
        },
      },
      {
        header: 'Party',
        render: (r) => {
          const to = accountPathFor('PARTY', r.partyId);
          return to ? (
            <Link to={to} className="acc-party-link">
              {r.partyName}
            </Link>
          ) : (
            <span className="acc-party-link">{r.partyName}</span>
          );
        },
      },
      {
        header: 'Due',
        render: (r) => (
          <span className="acc-cell-muted">{r.dueDate ? formatDateIST(r.dueDate) : '—'}</span>
        ),
      },
      {
        header: 'Ageing',
        render: (r) => <StatusBadge status={r.ageingBucket} label={`${r.overdueDays ?? 0}d`} />,
      },
      {
        header: 'Outstanding',
        headerStyle: { textAlign: 'right' },
        render: (r) => <span className="erp-numeric acc-amount">{inr(r.outstandingAmount)}</span>,
        cellStyle: { textAlign: 'right' },
      },
    ];
  }
  if (queue === 'payables') {
    return [
      {
        header: 'Vendor',
        render: (r) => {
          const to = accountPathFor('VENDOR', r.vendorId);
          return to ? (
            <Link to={to} className="acc-party-link">
              {r.vendorName}
            </Link>
          ) : (
            <span className="acc-party-link">{r.vendorName}</span>
          );
        },
      },
      { header: 'Bills', accessor: 'billCount' },
      { header: 'POD pending', render: (r) => r.podPendingCount || 0 },
      {
        header: 'Oldest due',
        render: (r) => (
          <span className="acc-cell-muted">
            {r.oldestDueDate ? formatDateIST(r.oldestDueDate) : '—'}
          </span>
        ),
      },
      {
        header: 'Outstanding',
        headerStyle: { textAlign: 'right' },
        render: (r) => <span className="erp-numeric acc-amount">{inr(r.totalOutstanding)}</span>,
        cellStyle: { textAlign: 'right' },
      },
    ];
  }
  return [
    {
      header: 'Receipt #',
      render: (r) => {
        const to = documentPathFor('RECEIPT', r._id);
        return to ? (
          <Link to={to} className="acc-doc-link">
            {r.voucherNumber}
          </Link>
        ) : (
          <span className="acc-doc-link">{r.voucherNumber}</span>
        );
      },
    },
    {
      header: 'Party',
      render: (r) => {
        const to = accountPathFor('PARTY', r.partyId);
        return to ? (
          <Link to={to} className="acc-party-link">
            {r.partyName || '—'}
          </Link>
        ) : (
          <span className="acc-party-link">{r.partyName || '—'}</span>
        );
      },
    },
    {
      header: 'Date',
      render: (r) => <span className="acc-cell-muted">{formatDateIST(r.voucherDate)}</span>,
    },
    { header: 'Mode', render: (r) => <StatusBadge status={r.mode} /> },
    {
      header: 'Unapplied',
      headerStyle: { textAlign: 'right' },
      render: (r) => <span className="erp-numeric acc-amount">{inr(r.unadjustedAmount)}</span>,
      cellStyle: { textAlign: 'right' },
    },
  ];
}
