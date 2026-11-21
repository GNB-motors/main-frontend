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

/**
 * Column defs for the ledger detail transactions table. A driver's ledger shows
 * the vehicle of each entry and a vehicle's ledger the driver; the ledger's own
 * entity would repeat on every row.
 */
export function buildLedgerDetailColumns({ isDriver = true, ...handlers } = {}) {
  const { onOpenTrip, onPreviewReceipt, onOpenAnomaly } = handlers;

  return [
    {
      key: 'date',
      label: 'Date',
      className: 'is-secondary',
      render: (tx) => (
        <span className="khata-nowrap">{formatDateIST(tx.expenseDate || tx.date)}</span>
      ),
    },
    {
      key: 'title',
      label: 'Entry',
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
    isDriver
      ? {
          key: 'vehicle',
          label: 'Vehicle',
          render: (tx) => <EntityRefCell entity={tx.vehicle} kind="vehicle" />,
        }
      : {
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
      key: 'trip',
      label: 'ERP trip',
      render: (tx) => <TripRefCell trip={tx.trip} onOpenTrip={onOpenTrip} />,
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (tx) => (
        <ReceiptCell receiptUrl={tx.receiptUrl} onPreviewReceipt={onPreviewReceipt} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (tx) => <LedgerStatusBadge status={tx.status} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'is-num',
      render: (tx) => formatCurrency(tx.amount),
    },
  ];
}
