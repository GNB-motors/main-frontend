import React from 'react';
import {
  IndianRupee,
  Fuel,
  Wrench,
  Receipt,
  Route,
  Gauge,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KhataKpiGrid from './KhataKpiGrid';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  formatCurrency,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
} from '../utils';
import { getLedgerSplitItems, resolveLedgerSplitLabel } from './ledgerDetailLogic';

const TOP_N = 6;

export const LedgerSummaryCards = ({
  summary,
  isDriver,
  tripsCount = 0,
  distanceKm = null,
  revenue = null,
  profit = null,
  pendingAmount = 0,
  walletAmount = null,
}) => {
  const fuelCost = summary.byCategory?.FUEL || 0;
  const maintenanceCost =
    (summary.byCategory?.MAINTENANCE || 0) + (summary.byCategory?.REPAIR || 0);
  const otherCost = Math.max(0, (summary.totalAmount || 0) - (fuelCost + maintenanceCost));

  const costPerKmText = formatCostPerKm(summary.totalAmount, distanceKm);
  const profitStatus =
    revenue != null ? getProfitabilityStatus(revenue, summary.totalAmount) : null;

  const primary = [
    {
      label: isDriver ? 'Total Expense' : 'Total Cost',
      icon: IndianRupee,
      value: formatCurrency(summary.totalAmount),
      sub: `${summary.count ?? 0} entries counted`,
    },
    { label: 'Fuel Cost', icon: Fuel, value: formatCurrency(fuelCost), sub: 'Direct fuel refills' },
    {
      label: 'Maintenance',
      icon: Wrench,
      value: formatCurrency(maintenanceCost),
      sub: 'Servicing, repairs & tyres',
    },
    {
      label: 'Other Expenses',
      icon: Receipt,
      value: formatCurrency(otherCost),
      sub: 'Tolls, meals, allowances',
    },
    { label: 'ERP Trips', icon: Route, value: tripsCount, sub: 'Commercial trips assigned' },
  ];
  const secondary = isDriver
    ? [
        {
          label: 'Pending Bills',
          icon: Clock,
          value: formatCurrency(pendingAmount),
          sub: 'Awaiting owner confirmation',
          status: pendingAmount > 0 ? 'Needs review' : null,
          tone: 'warning',
        },
        {
          label: 'Driver Wallet / Settlement',
          icon: Wallet,
          value: walletAmount != null ? formatCurrency(walletAmount) : 'Not Configured',
          sub: walletAmount != null ? 'Current balance' : 'Driver wallet not active',
        },
      ]
    : [
        {
          label: 'Distance',
          icon: Route,
          value: distanceKm != null && distanceKm > 0 ? formatKm(distanceKm) : 'N/A',
          sub: distanceKm ? 'Logged trip distance' : 'Distance unavailable',
        },
        {
          label: 'Cost / KM',
          icon: Gauge,
          value: costPerKmText || 'Unavailable',
          sub: distanceKm ? `Total Cost / ${formatKm(distanceKm)}` : 'Cost/KM unavailable',
        },
        {
          label: 'Trip Revenue',
          icon: TrendingUp,
          value: revenue != null ? formatCurrency(revenue) : '₹0 (Unbilled)',
          sub: 'From linked ERP trips',
        },
        {
          label: 'Net Profit',
          icon: profit < 0 ? TrendingDown : TrendingUp,
          value: profit != null ? formatCurrency(profit) : 'N/A',
          sub: 'Revenue minus costs',
          status: profitStatus?.label,
          tone: profit < 0 ? 'critical' : profit > 0 ? 'ok' : 'neutral',
        },
      ];

  return (
    <div className="space-y-3">
      <KhataKpiGrid columns={5} items={primary} />
      <KhataKpiGrid columns={isDriver ? 2 : 4} items={secondary} />
    </div>
  );
};

export const LedgerBreakdownCards = ({ summary, isDriver, vehicles, drivers }) => {
  const categoryEntries = Object.entries(summary.byCategory || {});
  const sourceEntries = Object.entries(summary.bySource || {});
  const splitItems = getLedgerSplitItems(summary, isDriver);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Category Breakdown */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">By Expense Category</p>
          <div className="space-y-2">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              categoryEntries.slice(0, TOP_N).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <Badge
                    className={`text-[10px] ${CATEGORY_COLORS[key] || CATEGORY_COLORS.MISCELLANEOUS}`}
                  >
                    {CATEGORY_LABELS[key] || key}
                  </Badge>
                  <span className="font-semibold text-gray-800">{formatCurrency(value)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source Breakdown */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">By Transaction Source</p>
          <div className="space-y-2">
            {sourceEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              sourceEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase ${
                      SOURCE_COLORS[key] || SOURCE_COLORS.MANUAL
                    }`}
                  >
                    {SOURCE_LABELS[key] || key}
                  </Badge>
                  <span className="font-semibold text-gray-800">{formatCurrency(value)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entity Split (Vehicle split for Driver, Driver split for Vehicle) */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {isDriver ? 'Vehicle Utilization' : 'Driver Distribution'}
          </p>
          <div className="space-y-2">
            {splitItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              splitItems.slice(0, TOP_N).map((item) => (
                <div
                  key={item.vehicleId || item.driverId || item._id || item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 truncate max-w-[160px]">
                    {resolveLedgerSplitLabel({
                      isDriver,
                      item,
                      vehicles,
                      drivers,
                      fallback: 'Unattributed',
                    })}
                  </span>
                  <span className="font-semibold text-gray-800">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
