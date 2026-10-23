import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Route,
  Truck,
  User,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Gauge,
  Fuel,
  Wrench,
  Receipt,
  ExternalLink,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import KhataLedgerService from '../KhataLedgerService';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
  TRIP_STATE_LABELS,
  TRIP_STATE_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  getDriverName,
  getVehicleLabel,
} from '../utils';

const ErpTripDetailModal = ({ isOpen, onClose, tripId, initialTripData = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(initialTripData);
  const [finance, setFinance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (!isOpen || !tripId) return;

    let isMounted = true;
    const loadTripDetails = async () => {
      setLoading(true);
      try {
        const [tripRes, financeRes, txRes] = await Promise.all([
          KhataLedgerService.getErpTripById(tripId).catch(() => initialTripData || null),
          KhataLedgerService.getErpTripFinance(tripId).catch(() => null),
          KhataLedgerService.getTripExpenses(tripId).catch(() => ({ results: [] })),
        ]);

        if (isMounted) {
          if (tripRes) setTrip(tripRes);
          if (financeRes) setFinance(financeRes);
          setTransactions(txRes?.results || txRes?.data || txRes || []);
        }
      } catch (err) {
        logger.error('Failed to load ERP Trip financial details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTripDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId, initialTripData]);

  if (!isOpen) return null;

  // Determine Revenue, Cost, Profit honestly from the real API
  const revenue =
    finance?.margin?.revenue != null
      ? finance.margin.revenue
      : trip?.saleBill?.netAmount != null
        ? trip.saleBill.netAmount
        : 0;

  // Real Cost: either from finance.margin.cost OR advances / purchase bill OR sum of real transactions
  const txSum = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const cost =
    finance?.margin?.cost != null
      ? finance.margin.cost
      : trip?.vehicleType === 'HIRE' && trip?.purchaseBill?.netAmount != null
        ? trip.purchaseBill.netAmount
        : txSum > 0
          ? txSum
          : 0;

  const profitStatus = getProfitabilityStatus(revenue, cost);
  const profit = revenue - cost;
  const marginPct = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : null;

  // Real Distance from telematics or trip totalKm
  const distanceKm =
    trip?.telematics?.actual?.km != null
      ? trip.telematics.actual.km
      : trip?.totalKm != null
        ? trip.totalKm
        : null;

  const costPerKmText = formatCostPerKm(cost, distanceKm);

  // Expense breakdown calculated from linked transactions
  const fuelCost = transactions
    .filter((t) => t.source === 'FUEL' || t.category === 'FUEL')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const maintenanceCost = transactions
    .filter((t) => t.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(t.category))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const driverCost = transactions
    .filter((t) => ['DRIVER_SALARY', 'DRIVER_ALLOWANCE', 'DRIVER_MEAL'].includes(t.category))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const otherCost = Math.max(0, (cost || txSum) - (fuelCost + maintenanceCost + driverCost));

  const tripNumber =
    trip?.tripNumber || (tripId ? `TRIP-${tripId.slice(-6).toUpperCase()}` : 'Trip Details');
  const routeDisplay =
    trip?.fromLocation && trip?.toLocation
      ? `${trip.fromLocation} → ${trip.toLocation}`
      : trip?.fromLocation || trip?.toLocation || 'Route Unassigned';

  const vehicleDisplay =
    trip?.vehicleNumber ||
    (trip?.vehicleId && getVehicleLabel(trip.vehicleId)) ||
    'Unassigned Vehicle';

  const driverDisplay =
    (trip?.driverId && getDriverName(trip.driverId)) ||
    (trip?.driver && getDriverName(trip.driver)) ||
    'Unassigned Driver';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Route size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{tripNumber}</h2>
                <Badge
                  className={`text-xs uppercase font-semibold ${
                    TRIP_STATE_COLORS[trip?.state] || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {TRIP_STATE_LABELS[trip?.state] || trip?.state || 'ONGOING'}
                </Badge>
                {trip?.vehicleType && (
                  <Badge variant="outline" className="text-[11px] text-slate-300 border-slate-600">
                    {trip.vehicleType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{routeDisplay}</span>
                {trip?.tripDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(trip.tripDate)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trip?._id && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/erp/trips/${trip._id}`);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="Open operational ERP Trip view"
              >
                <span>ERP View</span>
                <ExternalLink size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Trip Context Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                    <Truck size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Vehicle</span>
                    <span className="font-semibold text-slate-900">{vehicleDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Driver</span>
                    <span className="font-semibold text-slate-900">{driverDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Material / Cargo</span>
                    <span className="font-semibold text-slate-900">
                      {trip?.material || 'General Freight'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Financial KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block mb-1">
                    Revenue
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-blue-950">
                      {formatCurrency(revenue)}
                    </span>
                    <span className="text-[11px] font-medium text-blue-600">
                      {revenue > 0 ? 'Billed' : 'Unbilled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600/80 mt-1">
                    {finance?.receivable?.saleBill?.billNumber
                      ? `Sale Bill: ${finance.receivable.saleBill.billNumber}`
                      : 'From commercial sale bills'}
                  </p>
                </div>

                {/* Total Cost */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 block mb-1">
                    Total Cost
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-amber-950">
                      {formatCurrency(cost)}
                    </span>
                    <span className="text-[11px] font-medium text-amber-700">Trip Expenses</span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    {trip?.vehicleType === 'HIRE'
                      ? 'Hire purchase bill'
                      : 'Driver advance + fuel & logs'}
                  </p>
                </div>

                {/* Net Profit / Loss */}
                <div
                  className={`p-4 rounded-xl border ${
                    profit >= 0
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
                      profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    Profit / Loss
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-2xl font-bold flex items-center gap-1 ${
                        profit >= 0 ? 'text-emerald-950' : 'text-rose-950'
                      }`}
                    >
                      {profit >= 0 ? (
                        <TrendingUp size={20} className="text-emerald-600" />
                      ) : (
                        <TrendingDown size={20} className="text-rose-600" />
                      )}
                      {formatCurrency(Math.abs(profit))}
                    </span>
                    <Badge className={`text-xs ${profitStatus.color}`}>{profitStatus.label}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {marginPct != null ? `Margin: ${marginPct}%` : 'Margin unavailable'}
                  </p>
                </div>

                {/* Cost / KM */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
                    Cost per KM
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-purple-950">
                      {costPerKmText || 'Unavailable'}
                    </span>
                    <span className="text-[11px] font-medium text-purple-700">
                      {distanceKm ? formatKm(distanceKm) : 'No distance'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700/80 mt-1">
                    {distanceKm ? `Total Distance: ${formatKm(distanceKm)}` : 'Cost/KM unavailable'}
                  </p>
                </div>
              </div>

              {/* Expense Breakdown Strip */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/60">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <IndianRupee size={16} className="text-gray-500" />
                  Trip Cost Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Fuel size={14} className="text-orange-500" />
                      <span>Fuel Cost</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(fuelCost)}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Wrench size={14} className="text-purple-500" />
                      <span>Maintenance</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(maintenanceCost)}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <User size={14} className="text-green-600" />
                      <span>Driver Expense</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(driverCost)}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Receipt size={14} className="text-blue-500" />
                      <span>Other Expenses</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(otherCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Transactions Drill-down Section (Mandatory Requirement) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <FileCheck size={18} className="text-indigo-600" />
                      Related Financial Transactions
                    </h3>
                    <p className="text-xs text-gray-500">
                      Underlying transactions linked to {tripNumber}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {transactions.length} record{transactions.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                    <AlertCircle size={28} className="mx-auto text-gray-400 mb-2 opacity-60" />
                    <p className="text-sm font-medium text-gray-700">
                      No linked transactions recorded yet
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      Transactions mapped to {tripNumber} in the Add Expense modal or through
                      automated fuel logs will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4">Title / Description</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                          <tr
                            key={tx._id || Math.random()}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-medium">
                              {formatDate(tx.expenseDate || tx.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${
                                  SOURCE_COLORS[tx.source] || SOURCE_COLORS.MANUAL
                                }`}
                              >
                                {SOURCE_LABELS[tx.source] || tx.source || 'MANUAL'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-gray-900 block">{tx.title}</span>
                              {tx.description && (
                                <span className="text-[11px] text-gray-500 truncate max-w-xs block mt-0.5">
                                  {tx.description}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={`text-[11px] ${
                                  CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.MISCELLANEOUS
                                }`}
                              >
                                {CATEGORY_LABELS[tx.category] || tx.category || 'MISC'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={`text-[10px] ${
                                  STATUS_COLORS[tx.status] || STATUS_COLORS.CONFIRMED
                                }`}
                              >
                                {STATUS_LABELS[tx.status] || tx.status || 'CONFIRMED'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {tx.receiptUrl ? (
                                <button
                                  onClick={() => setSelectedReceipt(tx.receiptUrl)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                  title="View attached receipt"
                                >
                                  <Eye size={12} />
                                  Receipt
                                </button>
                              ) : (
                                <span className="text-gray-400 text-[11px]">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3.5 bg-gray-50 text-xs text-gray-500">
          <span>{tripId ? `ID: ${tripId}` : ''}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <ReceiptPreviewModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt}
      />
    </div>
  );
};

export default ErpTripDetailModal;
