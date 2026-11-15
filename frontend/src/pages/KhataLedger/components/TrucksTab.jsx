import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Fuel,
  DollarSign,
  Award,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KhataKpiGrid from './KhataKpiGrid';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import AddFuelLogModal from './AddFuelLogModal';
import { useActiveBranch } from '../../../contexts/BranchContext';
import {
  formatCurrency,
  getDriverName,
  getVehicleLabel,
  getInitialDateRange,
  toSplitArray,
} from '../utils';

const TrucksTab = ({ vehicles: allVehicles = [], drivers = [] }) => {
  const navigate = useNavigate();
  const { branchId, activeBranch } = useActiveBranch();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [fuelModalVehicleId, setFuelModalVehicleId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTrucks = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (branchId) params.branchId = branchId;
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (search) params.search = search;
        const data = await KhataLedgerService.getVehicles(params);
        setTrucks(data.results || data.items || (Array.isArray(data) ? data : []));
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || data.total || 0,
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          setTrucks([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load trucks');
        }
      } finally {
        setLoading(false);
      }
    },
    [branchId, dateRange, search],
  );

  useEffect(() => {
    fetchTrucks(1);
  }, [fetchTrucks]);

  const enrichedTrucks = useMemo(() => {
    return trucks.map((t) => {
      const full = allVehicles.find((v) => v._id === (t._id || t.vehicleId));
      return {
        ...t,
        label: getVehicleLabel(full) || t.registrationNumber || t.name || 'Unknown Truck',
      };
    });
  }, [trucks, allVehicles]);

  const truckKpis = useMemo(() => {
    let totalSpend = 0;
    let totalEntries = 0;
    let topSpender = null;

    enrichedTrucks.forEach((t) => {
      const amt = Number(t.totalAmount) || 0;
      totalSpend += amt;
      totalEntries += Number(t.entryCount ?? t.count ?? 0);
      if (!topSpender || amt > (topSpender.totalAmount || 0)) {
        topSpender = t;
      }
    });

    return {
      totalSpend,
      totalEntries,
      topSpender,
      avgPerTruck: enrichedTrucks.length > 0 ? totalSpend / enrichedTrucks.length : 0,
    };
  }, [enrichedTrucks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Vehicle Ledgers</h2>
            <Badge
              variant="outline"
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {activeBranch ? activeBranch.name : 'All Locations'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vehicle costs, fuel logs, maintenance, and assigned driver allocations
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <KhataKpiGrid
        loading={loading}
        items={[
          {
            label: 'Total Fleet Spend',
            icon: DollarSign,
            value: formatCurrency(truckKpis.totalSpend),
            sub: `${truckKpis.totalEntries} entries recorded`,
          },
          {
            label: 'Active Vehicles',
            icon: Truck,
            value: meta.totalResults || enrichedTrucks.length,
            sub: 'Vehicles with active entries',
          },
          {
            label: 'Avg Spend / Truck',
            icon: Truck,
            value: formatCurrency(truckKpis.avgPerTruck),
            sub: 'For selected date period',
          },
          {
            label: 'Highest Cost Truck',
            icon: Award,
            value: truckKpis.topSpender?.label || '—',
            sub: truckKpis.topSpender
              ? formatCurrency(truckKpis.topSpender.totalAmount)
              : 'No spending recorded',
          },
        ]}
      />

      {/* Search Input */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search trucks"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="Search trucks by registration number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trucks Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : enrichedTrucks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground text-center">
              <Truck size={40} className="opacity-30" />
              <p className="text-sm font-medium">No trucks found for this period</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Try widening your date range or selecting a different location.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 text-xs">
                  <TableHead>Truck</TableHead>
                  <TableHead>Period Total</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Top Drivers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedTrucks.map((truck) => (
                  <TableRow key={truck._id} className="hover:bg-slate-50/70 text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border">
                          <Truck size={14} />
                        </div>
                        <span className="font-semibold text-gray-900">{truck.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {formatCurrency(truck.totalAmount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {truck.entryCount ?? truck.count ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {toSplitArray(truck.driverSplit || truck.byDriver)
                          .slice(0, 3)
                          .map((split) => {
                            const driver = drivers.find(
                              (d) => d._id === (split.driverId || split._id),
                            );
                            const label =
                              (driver && getDriverName(driver)) || split.name || 'Unknown';
                            return (
                              <Badge
                                key={split.driverId || split._id || label}
                                variant="outline"
                                className="text-[10px] text-gray-700"
                              >
                                <User size={10} className="mr-1 text-gray-400" />
                                {label}: {formatCurrency(split.amount)}
                              </Badge>
                            );
                          })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setFuelModalVehicleId(truck._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Fuel size={13} className="text-orange-500" />
                          Add Fuel
                        </button>
                        <button
                          onClick={() => navigate(`/khata-ledger/trucks/${truck._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <Eye size={13} />
                          View Ledger
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchTrucks(meta.page - 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchTrucks(meta.page + 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddFuelLogModal
        open={Boolean(fuelModalVehicleId)}
        onClose={() => setFuelModalVehicleId(null)}
        vehicleId={fuelModalVehicleId}
        onAdded={() => fetchTrucks(meta.page)}
      />
    </div>
  );
};

export default TrucksTab;
