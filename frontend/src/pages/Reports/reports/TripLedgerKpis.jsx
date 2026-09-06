// KPI strip + Alert for TripLedgerReport. Extracted (WS0.7); markup preserved.
import { TrendingUp, Wallet, Percent, MapPin, DollarSign, Loader2 } from 'lucide-react';

const ALERT_SEVERITY_CLASSES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-green-200 bg-green-50 text-green-700',
};

export const Alert = ({ severity = 'info', className = '', children }) => (
  <div
    role="alert"
    className={`rounded-md border px-3 py-2 ${ALERT_SEVERITY_CLASSES[severity] || ALERT_SEVERITY_CLASSES.info} ${className}`}
  >
    {children}
  </div>
);

const SummaryCard = (props) => {
  const { icon: Icon, label, value, iconColor = '#2F58EE' } = props;
  return (
    <div className="trip-ledger-kpi-card">
      <div className="trip-ledger-kpi-icon" style={{ background: `rgba(47, 88, 238, 0.10)` }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div className="trip-ledger-kpi-content">
        <span className="trip-ledger-kpi-label">{label}</span>
        <span className="trip-ledger-kpi-value">{value}</span>
      </div>
    </div>
  );
};

export default function TripLedgerKpis({
  summaryData,
  isLoadingSummary,
  summaryError,
  formatCurrency,
}) {
  return (
    <div className="trip-ledger-summary-cards">
      {isLoadingSummary ? (
        <div className="flex justify-center w-full py-4">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : summaryError ? (
        <Alert severity="error" className="w-full">
          {summaryError}
        </Alert>
      ) : (
        summaryData && (
          <>
            <SummaryCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(summaryData.totalRevenue)}
              iconColor="#2F58EE"
            />
            <SummaryCard
              icon={Wallet}
              label="Total Expense"
              value={formatCurrency(summaryData.totalExpense)}
              iconColor="#EE2F2F"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Total Profit"
              value={formatCurrency(summaryData.totalProfit)}
              iconColor="#2ECC71"
            />
            <SummaryCard
              icon={Percent}
              label="Avg Margin"
              value={`${summaryData.avgProfitMargin?.toFixed(2) || 0}%`}
              iconColor="#F39C12"
            />
            <SummaryCard
              icon={MapPin}
              label="Total Distance"
              value={`${summaryData.totalDistanceKm?.toLocaleString('en-IN') || 0} km`}
              iconColor="#9B59B6"
            />
          </>
        )
      )}
    </div>
  );
}
