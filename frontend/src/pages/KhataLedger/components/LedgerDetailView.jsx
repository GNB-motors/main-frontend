import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, IndianRupee, User, Truck, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import TripService from '../../Trip/services/TripService';
import AddFuelLogModal from './AddFuelLogModal';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  formatCurrency,
  formatDate,
  getDriverName,
  getVehicleLabel,
  getInitialDateRange,
} from '../utils';

const LedgerDetailView = ({ entityType, entityId }) => {
  const navigate = useNavigate();
  const isDriver = entityType === 'driver';

  const [entityName, setEntityName] = useState('');
  const [entityLoading, setEntityLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0, byCategory: {}, bySource: {}, split: [] });

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [crossFilterId, setCrossFilterId] = useState('');
  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  const [filterOptions, setFilterOptions] = useState({ vehicles: [], drivers: [] });

  useEffect(() => {
    const loadEntity = async () => {
      setEntityLoading(true);
      try {
        if (isDriver) {
          const res = await TripService.getDriverById(entityId);
          const data = res?.data ?? res;
          setEntityName(getDriverName(data) || 'Driver Ledger');
        } else {
          const res = await TripService.getVehicleById(entityId);
          const data = res?.data ?? res;
          setEntityName(getVehicleLabel(data) || 'Truck Ledger');
        }
      } catch {
        setEntityName(isDriver ? 'Driver Ledger' : 'Truck Ledger');
      } finally {
        setEntityLoading(false);
      }
    };

    const loadFilterOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setFilterOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
          drivers: dRes?.data || dRes?.results || dRes || [],
        });
      } catch {
        // non-critical
      }
    };

    loadEntity();
    loadFilterOptions();
  }, [entityId, isDriver]);

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (category) params.category = category;
        if (source) params.source = source;
        if (crossFilterId) {
          params[isDriver ? 'vehicleId' : 'driverId'] = crossFilterId;
        }

        const [ledgerData, summaryData] = await Promise.all([
          isDriver
            ? KhataLedgerService.getDriverLedger(entityId, params)
            : KhataLedgerService.getVehicleLedger(entityId, params),
          isDriver
            ? KhataLedgerService.getDriverSummary(entityId, params)
            : KhataLedgerService.getVehicleSummary(entityId, params),
        ]);

        setTransactions(ledgerData.results || ledgerData.items || ledgerData || []);
        setMeta({
          page: ledgerData.page || 1,
          totalPages: ledgerData.totalPages || 1,
          totalResults: ledgerData.totalResults || ledgerData.total || 0,
        });
        setSummary(summaryData || { totalAmount: 0, count: 0 });
      } catch (err) {
        if (err?.response?.status === 404) {
          setTransactions([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
          setSummary({ totalAmount: 0, count: 0, byCategory: {}, bySource: {}, split: [] });
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load ledger');
        }
      } finally {
        setLoading(false);
      }
    },
    [entityId, isDriver, dateRange, category, source, crossFilterId]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const splitItems = summary.split || (isDriver ? summary.byVehicle : summary.byDriver) || [];
  const categoryEntries = Object.entries(summary.byCategory || {});
  const sourceEntries = Object.entries(summary.bySource || {});
  const crossOptions = isDriver ? filterOptions.vehicles : filterOptions.drivers;

  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/khata-ledger', { state: { tab: isDriver ? 'drivers' : 'trucks' } })}
            className="rounded-lg border p-2 hover:bg-muted"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              {isDriver ? <User size={24} style={{ color: 'var(--primary-color, #4f46e5)' }} /> : <Truck size={24} style={{ color: 'var(--primary-color, #4f46e5)' }} />}
              {entityLoading ? <Skeleton className="h-8 w-40" /> : entityName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDriver ? 'Driver' : 'Truck'} ledger — merged transactions and summaries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFuelModalOpen(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
          >
            <Fuel size={18} />
            Add Fuel
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--primary-light, #eef2ff)', color: 'var(--primary-color, #4f46e5)' }}
            >
              <IndianRupee size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-0.5 text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entries</p>
              <p className="mt-0.5 text-xl font-bold">{summary.count ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Category</p>
            <p className="mt-0.5 text-lg font-semibold">
              {categoryEntries[0] ? CATEGORY_LABELS[categoryEntries[0][0]] || categoryEntries[0][0] : '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              {categoryEntries[0] ? formatCurrency(categoryEntries[0][1]) : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isDriver ? 'Top Vehicle' : 'Top Driver'}
            </p>
            <p className="mt-0.5 text-lg font-semibold">
              {splitItems[0]
                ? isDriver
                  ? getVehicleLabel(filterOptions.vehicles.find((v) => v._id === splitItems[0].vehicleId || v._id === splitItems[0]._id)) || splitItems[0].name || '-'
                  : getDriverName(filterOptions.drivers.find((d) => d._id === splitItems[0].driverId || d._id === splitItems[0]._id)) || splitItems[0].name || '-'
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground">{splitItems[0] ? formatCurrency(splitItems[0].amount) : ''}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Category</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Source</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">All Sources</option>
                {Object.keys(SOURCE_LABELS).map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">{isDriver ? 'Vehicle' : 'Driver'}</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={crossFilterId}
                onChange={(e) => setCrossFilterId(e.target.value)}
              >
                <option value="">All {isDriver ? 'Vehicles' : 'Drivers'}</option>
                {crossOptions.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {isDriver ? getVehicleLabel(opt) : getDriverName(opt)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setCategory('');
                setSource('');
                setCrossFilterId('');
              }}
              className="rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">By Category</p>
            <div className="space-y-2">
              {categoryEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                categoryEntries.slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <Badge className={`text-xs ${CATEGORY_COLORS[key] || CATEGORY_COLORS.MISCELLANEOUS}`}>
                      {CATEGORY_LABELS[key] || key}
                    </Badge>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">By Source</p>
            <div className="space-y-2">
              {sourceEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                sourceEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[key] || SOURCE_COLORS.MANUAL}`}>
                      {SOURCE_LABELS[key] || key}
                    </Badge>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">{isDriver ? 'By Vehicle' : 'By Driver'}</p>
            <div className="space-y-2">
              {splitItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                splitItems.slice(0, 6).map((item) => {
                  const label = isDriver
                    ? getVehicleLabel(filterOptions.vehicles.find((v) => v._id === (item.vehicleId || item._id))) || item.name || 'Unknown'
                    : getDriverName(filterOptions.drivers.find((d) => d._id === (item.driverId || item._id))) || item.name || 'Unknown';
                  return (
                    <div key={item.vehicleId || item.driverId || item._id || item.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <BookOpen size={40} className="opacity-30" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Trip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={`${tx.source}-${tx._id}`}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(tx.expenseDate || tx.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{tx.title}</p>
                        {tx.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.MISCELLANEOUS}`}>
                        {CATEGORY_LABELS[tx.category] || tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="text-sm">
                      {tx.vehicle ? (
                        <span className="flex items-center gap-1">
                          <Truck size={14} className="text-gray-400" />
                          {getVehicleLabel(tx.vehicle)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tx.driver ? (
                        <span className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          {getDriverName(tx.driver)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[tx.source] || SOURCE_COLORS.MANUAL}`}>
                        {SOURCE_LABELS[tx.source] || tx.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.trip ? tx.trip.tripNumber || tx.trip._id?.slice(-6) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchData(meta.page - 1)}
                  className="rounded-lg border p-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchData(meta.page + 1)}
                  className="rounded-lg border p-2 text-sm disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddFuelLogModal
        open={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        driverId={isDriver ? entityId : undefined}
        vehicleId={!isDriver ? entityId : undefined}
        onAdded={() => fetchData(meta.page)}
      />
    </div>
  );
};

export default LedgerDetailView;
