import { BookOpen, IndianRupee, Route, Fuel } from 'lucide-react';
import KhataKpiGrid from './KhataKpiGrid';
import { formatCurrency } from '../utils';

export default function TransactionSummaryCards({ summary, meta, includeTripExpenses, loading }) {
  return (
    <KhataKpiGrid
      loading={loading}
      items={[
        {
          label: 'Total Expenses',
          icon: IndianRupee,
          value: formatCurrency(summary.totalAmount),
        },
        { label: 'Manual Entries', icon: BookOpen, value: meta.totalManual },
        {
          label: 'Fuel Refills',
          icon: Fuel,
          value: includeTripExpenses ? meta.totalFuel : 'Filtered',
        },
        {
          label: 'Trip Generated',
          icon: Route,
          value: includeTripExpenses ? meta.totalTrip : 'Filtered',
        },
      ]}
    />
  );
}
