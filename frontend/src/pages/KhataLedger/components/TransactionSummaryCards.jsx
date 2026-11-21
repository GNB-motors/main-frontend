import KhataKpiGrid from './KhataKpiGrid';
import { formatCurrency, plural } from '../utils';

const HIDDEN = 'Hidden · fuel refills are switched off';

/** Totals for the filtered transaction list. Counts the server did not send read "—". */
export default function TransactionSummaryCards({ summary, meta, includeTripExpenses, loading }) {
  const total = Number(meta.totalResults) || 0;
  const none = total === 0;

  const countTile = (label, count) => {
    if (count == null) return { label, value: '—', sub: 'Not reported for this list' };
    return {
      label,
      value: Number(count).toLocaleString('en-IN'),
      sub: none
        ? 'No entries match these filters'
        : `${Math.round((count / total) * 100)}% of entries`,
      pct: none ? null : (count / total) * 100,
    };
  };

  const spend = summary?.totalAmount;
  const entries = Number.isFinite(summary?.count) ? summary.count : total;

  return (
    <KhataKpiGrid
      loading={loading}
      label="Transaction totals"
      items={[
        {
          label: 'Total spend',
          value: none || spend == null ? '—' : formatCurrency(spend),
          sub: none ? 'No entries match these filters' : plural(entries, 'entry', 'entries'),
        },
        // Every expense row: manual entries, driver bills and detected tolls.
        countTile('Expense entries', meta.totalManual),
        includeTripExpenses
          ? countTile('Fuel refills', meta.totalFuel)
          : { label: 'Fuel refills', value: '—', sub: HIDDEN },
      ]}
    />
  );
}
