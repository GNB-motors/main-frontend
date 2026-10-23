import React from 'react';
import {
  IndianRupee,
  BookOpen,
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

  return (
    <div className="space-y-3">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Cost / Expense */}
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
              <span>{isDriver ? 'Total Expense' : 'Total Cost'}</span>
              <IndianRupee size={16} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-950">
              {formatCurrency(summary.totalAmount)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">{summary.count ?? 0} entries counted</p>
          </CardContent>
        </Card>

        {/* Fuel Expense */}
        <Card className="border-orange-100 bg-gradient-to-br from-orange-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-orange-700 mb-1">
              <span>Fuel Cost</span>
              <Fuel size={16} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-950">{formatCurrency(fuelCost)}</p>
            <p className="text-[11px] text-gray-500 mt-1">Direct fuel refills</p>
          </CardContent>
        </Card>

        {/* Maintenance Expense */}
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
              <span>Maintenance</span>
              <Wrench size={16} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-950">{formatCurrency(maintenanceCost)}</p>
            <p className="text-[11px] text-gray-500 mt-1">Servicing, repairs & tyres</p>
          </CardContent>
        </Card>

        {/* Other Expense */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span>Other Expenses</span>
              <Receipt size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-950">{formatCurrency(otherCost)}</p>
            <p className="text-[11px] text-gray-500 mt-1">Tolls, meals, allowances</p>
          </CardContent>
        </Card>

        {/* Number of Trips */}
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50/40 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-violet-700 mb-1">
              <span>ERP Trips</span>
              <Route size={16} className="text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-violet-950">{tripsCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Commercial trips assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Specific to Driver vs Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {isDriver ? (
          <>
            {/* Pending Amount */}
            <Card className="border-amber-100 bg-gradient-to-br from-amber-50/40 to-white shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700 mb-0.5">
                  <span>Pending Bills</span>
                  <Clock size={15} className="text-amber-500" />
                </div>
                <p className="text-lg font-bold text-amber-950">{formatCurrency(pendingAmount)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Awaiting owner confirmation</p>
              </CardContent>
            </Card>

            {/* Settlement / Wallet Amount */}
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
                  <span>Driver Wallet / Settlement</span>
                  <Wallet size={15} className="text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-emerald-950">
                  {walletAmount != null ? formatCurrency(walletAmount) : 'Not Configured'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {walletAmount != null ? 'Current balance' : 'Driver wallet not active'}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Total Distance */}
            <Card className="border-teal-100 bg-gradient-to-br from-teal-50/40 to-white shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-teal-700 mb-0.5">
                  <span>Distance</span>
                  <Route size={15} className="text-teal-500" />
                </div>
                <p className="text-lg font-bold text-teal-950">
                  {distanceKm != null && distanceKm > 0 ? formatKm(distanceKm) : 'N/A'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {distanceKm ? 'Logged trip distance' : 'Distance unavailable'}
                </p>
              </CardContent>
            </Card>

            {/* Cost / KM */}
            <Card className="border-purple-100 bg-gradient-to-br from-purple-50/40 to-white shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-purple-700 mb-0.5">
                  <span>Cost / KM</span>
                  <Gauge size={15} className="text-purple-500" />
                </div>
                <p className="text-lg font-bold text-purple-950">
                  {costPerKmText || 'Unavailable'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {distanceKm ? `Total Cost / ${formatKm(distanceKm)}` : 'Cost/KM unavailable'}
                </p>
              </CardContent>
            </Card>

            {/* Vehicle Revenue */}
            <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700 mb-0.5">
                  <span>Trip Revenue</span>
                  <TrendingUp size={15} className="text-blue-500" />
                </div>
                <p className="text-lg font-bold text-blue-950">
                  {revenue != null ? formatCurrency(revenue) : '₹0 (Unbilled)'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">From linked ERP trips</p>
              </CardContent>
            </Card>

            {/* Vehicle Profit */}
            <Card
              className={`shadow-sm bg-gradient-to-br to-white ${
                profit != null && profit >= 0
                  ? 'border-emerald-200 from-emerald-50/40'
                  : 'border-rose-200 from-rose-50/40'
              }`}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-0.5">
                  <span
                    className={profit != null && profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}
                  >
                    Net Profit
                  </span>
                  {profitStatus && (
                    <Badge className={`text-[9px] px-1 py-0 ${profitStatus.color}`}>
                      {profitStatus.label}
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-lg font-bold ${
                    profit != null && profit >= 0 ? 'text-emerald-950' : 'text-rose-950'
                  }`}
                >
                  {profit != null ? formatCurrency(profit) : 'N/A'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Revenue minus costs</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
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
