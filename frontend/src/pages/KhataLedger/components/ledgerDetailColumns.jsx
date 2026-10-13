import React from 'react';
import { formatDateIST } from '@/utils/dateUtils';
import { formatCurrency } from '../utils';
import {
  LedgerCategoryBadge,
  LedgerSourceBadge,
  LedgerStatusBadge,
  TxTitleCell,
  EntityRefCell,
  TripRefCell,
  ReceiptCell,
} from './ledgerDetailCells';

/** Column defs for the ledger detail transactions table. */
export function buildLedgerDetailColumns(handlers = {}) {
  const { onOpenTrip, onPreviewReceipt, onOpenAnomaly } = handlers;

  return [
    {
      key: 'date',
      label: 'Date',
      render: (tx) => (
        <span className="whitespace-nowrap text-sm">
          {formatDateIST(tx.expenseDate || tx.date)}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (tx) => (
        <TxTitleCell
          title={tx.title}
          description={tx.description}
          mileageFlag={tx.mileageFlag}
          onOpenAnomaly={onOpenAnomaly}
        />
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (tx) => <LedgerCategoryBadge category={tx.category} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (tx) => (
        <span className="font-semibold text-gray-900">{formatCurrency(tx.amount)}</span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (tx) => <EntityRefCell entity={tx.vehicle} kind="vehicle" />,
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (tx) => <EntityRefCell entity={tx.driver} kind="driver" />,
    },
    {
      key: 'source',
      label: 'Source',
      render: (tx) => <LedgerSourceBadge source={tx.source} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (tx) => <LedgerStatusBadge status={tx.status} />,
    },
    {
      key: 'trip',
      label: 'ERP Trip',
      render: (tx) => <TripRefCell trip={tx.trip} onOpenTrip={onOpenTrip} />,
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (tx) => (
        <ReceiptCell receiptUrl={tx.receiptUrl} onPreviewReceipt={onPreviewReceipt} />
      ),
    },
  ];
}
