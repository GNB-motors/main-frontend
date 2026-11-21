import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import KhataLedgerService from '../KhataLedgerService';
import KhataKpiGrid from './KhataKpiGrid';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import { KhataCard, KhataEmpty, KhataPill } from './khataUi';
import { tripStateLabel, tripStateTone } from './erpTripStates';
import logger from '../../../utils/logger.js';
import {
  formatCurrency,
  formatDate,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
  SOURCE_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  getDriverName,
  getVehicleLabel,
  plural,
} from '../utils';
import '../KhataLedger.css';
import './khataTrips.css';

const PROFIT_TONES = { PROFITABLE: 'ok', LOSS_MAKING: 'critical' };
const EXPENSE_STATUS_TONES = { PENDING: 'warn', CONFIRMED: 'ok', APPROVED: 'ok', REJECTED: 'bad' };

const named = (label) => (label && label !== '-' ? label : null);

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

  const revenue =
    finance?.margin?.revenue != null
      ? finance.margin.revenue
      : trip?.saleBill?.netAmount != null
        ? trip.saleBill.netAmount
        : 0;

  // Cost comes from the trip finance, else the hire purchase bill, else the linked transactions.
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

  const distanceKm =
    trip?.telematics?.actual?.km != null
      ? trip.telematics.actual.km
      : trip?.totalKm != null
        ? trip.totalKm
        : null;

  const costPerKmText = formatCostPerKm(cost, distanceKm);

  const sumWhere = (match) =>
    transactions.filter(match).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const fuelCost = sumWhere((t) => t.source === 'FUEL' || t.category === 'FUEL');
  const maintenanceCost = sumWhere(
    (t) => t.source === 'MAINTENANCE' || ['MAINTENANCE', 'REPAIR'].includes(t.category),
  );
  const driverCost = sumWhere((t) =>
    ['DRIVER_SALARY', 'DRIVER_ALLOWANCE', 'DRIVER_MEAL'].includes(t.category),
  );
  const otherCost = Math.max(0, (cost || txSum) - (fuelCost + maintenanceCost + driverCost));
  const noTransactions = transactions.length === 0;
  const breakdown = (value) => (noTransactions ? '—' : formatCurrency(value));

  const tripNumber =
    trip?.tripNumber || (tripId ? `TRIP-${tripId.slice(-6).toUpperCase()}` : 'Trip details');
  const route =
    trip?.fromLocation && trip?.toLocation
      ? `${trip.fromLocation} → ${trip.toLocation}`
      : trip?.fromLocation || trip?.toLocation || 'Route not set';
  const vehicleLabel =
    trip?.vehicleNumber ||
    (typeof trip?.vehicleId === 'object' && named(getVehicleLabel(trip.vehicleId))) ||
    null;
  const driverLabel =
    (typeof trip?.driverId === 'object' && named(getDriverName(trip.driverId))) ||
    (trip?.driver && named(getDriverName(trip.driver))) ||
    null;
  const description = [route, trip?.tripDate ? formatDate(trip.tripDate) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog
        open={Boolean(isOpen)}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="khata-dialog khata-dialog--wide">
          <div className="khata-dialog-head">
            <div>
              <DialogTitle className="khata-dialog-title">
                <span className="is-code">{tripNumber}</span>
                <KhataPill tone={tripStateTone(trip?.state)}>
                  {tripStateLabel(trip?.state)}
                </KhataPill>
                {trip?.vehicleType ? <KhataPill>{trip.vehicleType}</KhataPill> : null}
              </DialogTitle>
              <DialogDescription className="khata-dialog-desc">{description}</DialogDescription>
            </div>
            <div className="khata-dialog-head-actions">
              {trip?._id ? (
                <button
                  type="button"
                  className="khata-link"
                  onClick={() => {
                    onClose();
                    navigate(`/erp/trips/${trip._id}`);
                  }}
                >
                  Open in ERP →
                </button>
              ) : null}
              <button type="button" className="khata-icon-btn" aria-label="Close" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="khata-dialog-body">
            {loading ? (
              <div role="status" aria-busy="true" className="khata-dialog-body">
                <span className="sr-only">Loading…</span>
                <Skeleton className="h-24 w-full rounded" />
                <Skeleton className="h-24 w-full rounded" />
                <Skeleton className="h-40 w-full rounded" />
              </div>
            ) : (
              <>
                <div className="khata-rows">
                  <div>
                    <span>Vehicle</span>
                    <span className="is-code">
                      {vehicleLabel || <span className="khata-muted">Not assigned</span>}
                    </span>
                  </div>
                  <div>
                    <span>Driver</span>
                    <span>{driverLabel || <span className="khata-muted">Not assigned</span>}</span>
                  </div>
                  <div>
                    <span>Material</span>
                    <span>
                      {trip?.material || <span className="khata-muted">Not on record</span>}
                    </span>
                  </div>
                </div>

                <KhataKpiGrid
                  variant="strip"
                  label="Trip finances"
                  items={[
                    {
                      label: 'Revenue',
                      value: formatCurrency(revenue),
                      sub: finance?.receivable?.saleBill?.billNumber
                        ? `Sale bill ${finance.receivable.saleBill.billNumber}`
                        : 'From the sale bill',
                      status: revenue > 0 ? 'Billed' : 'Unbilled',
                      tone: revenue > 0 ? 'neutral' : 'warning',
                    },
                    {
                      label: 'Total cost',
                      value: formatCurrency(cost),
                      sub:
                        trip?.vehicleType === 'HIRE'
                          ? 'Hire purchase bill'
                          : 'Driver advance, fuel and logs',
                    },
                    {
                      label: 'Profit / loss',
                      value: formatCurrency(profit),
                      sub: marginPct != null ? `Margin ${marginPct}%` : 'Margin unavailable',
                      status: profitStatus.label,
                      tone: PROFIT_TONES[profitStatus.status] || 'neutral',
                    },
                    {
                      label: 'Cost per km',
                      value: costPerKmText || '—',
                      sub: distanceKm ? formatKm(distanceKm) : 'No distance recorded',
                    },
                  ]}
                />

                <KhataCard
                  flush
                  title="Trip cost breakdown"
                  subtitle="From the expenses linked to this trip."
                >
                  <KhataKpiGrid
                    variant="strip"
                    items={[
                      { label: 'Fuel', value: breakdown(fuelCost), sub: 'Fuel logs and bills' },
                      {
                        label: 'Maintenance',
                        value: breakdown(maintenanceCost),
                        sub: 'Repairs and servicing',
                      },
                      {
                        label: 'Driver',
                        value: breakdown(driverCost),
                        sub: 'Salary, allowance, meals',
                      },
                      { label: 'Other', value: breakdown(otherCost), sub: 'Tolls, fines, loading' },
                    ]}
                  />
                </KhataCard>

                <KhataCard
                  flush
                  title={
                    <>
                      Linked transactions
                      <span className="khata-count">{plural(transactions.length, 'record')}</span>
                    </>
                  }
                  subtitle={`Expenses mapped to ${tripNumber}.`}
                >
                  {noTransactions ? (
                    <KhataEmpty icon={FileCheck} title="No linked transactions yet">
                      Expenses mapped to this trip in Add expense, and automatic fuel logs, show up
                      here.
                    </KhataEmpty>
                  ) : (
                    <Table className="khata-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="is-num">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="is-end">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx, index) => (
                          <TableRow key={tx._id || index}>
                            <TableCell className="is-secondary is-date">
                              {formatDate(tx.expenseDate || tx.createdAt)}
                            </TableCell>
                            <TableCell>
                              <KhataPill>
                                {SOURCE_LABELS[tx.source] || tx.source || 'Manual'}
                              </KhataPill>
                            </TableCell>
                            <TableCell>
                              <span className="khata-cell-main">{tx.title}</span>
                              {tx.description ? (
                                <span className="khata-cell-sub khata-truncate">
                                  {tx.description}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <KhataPill>
                                {CATEGORY_LABELS[tx.category] || tx.category || 'Miscellaneous'}
                              </KhataPill>
                            </TableCell>
                            <TableCell className="is-num">{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>
                              <KhataPill tone={EXPENSE_STATUS_TONES[tx.status] || 'ok'}>
                                {STATUS_LABELS[tx.status] || tx.status || 'Confirmed'}
                              </KhataPill>
                            </TableCell>
                            <TableCell className="is-end">
                              {tx.receiptUrl ? (
                                <button
                                  type="button"
                                  className="khata-link"
                                  onClick={() => setSelectedReceipt(tx.receiptUrl)}
                                  aria-label={`View receipt for ${tx.title || 'this expense'}`}
                                >
                                  View
                                </button>
                              ) : (
                                <span className="khata-muted">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </KhataCard>
              </>
            )}
          </div>

          <div className="khata-dialog-foot khata-dialog-foot--split">
            <span className="khata-hint is-code">{tripId ? `ID ${tripId}` : ''}</span>
            <button type="button" className="khata-btn" onClick={onClose}>
              Close
            </button>
          </div>

          <ReceiptPreviewModal
            isOpen={Boolean(selectedReceipt)}
            receiptUrl={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ErpTripDetailModal;
