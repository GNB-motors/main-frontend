import { formatDateIST } from '@/utils/dateUtils';
import { formatCurrency } from '../utils';
import {
  LedgerCategoryBadge,
  LedgerSourceBadge,
  TxTitleCell,
  EntityRefCell,
} from './ledgerDetailCells';

/** Column defs for the ledger detail transactions table. */
export function buildLedgerDetailColumns() {
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
        <TxTitleCell title={tx.title} description={tx.description} mileageFlag={tx.mileageFlag} />
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
      render: (tx) => <span className="font-semibold">{formatCurrency(tx.amount)}</span>,
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
    { key: 'source', label: 'Source', render: (tx) => <LedgerSourceBadge source={tx.source} /> },
    {
      key: 'trip',
      label: 'Trip',
      render: (tx) => (
        <span className="text-sm text-muted-foreground">
          {tx.trip ? tx.trip.tripNumber || tx.trip._id?.slice(-6) : '-'}
        </span>
      ),
    },
  ];
}
