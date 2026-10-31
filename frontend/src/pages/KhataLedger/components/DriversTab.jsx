import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  Fuel,
  DollarSign,
  Users,
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
import { formatCurrency, getDriverName, getInitialDateRange, toSplitArray } from '../utils';

const DriversTab = ({ vehicles = [], drivers: allDrivers = [] }) => {
  const navigate = useNavigate();
  const { branchId, activeBranch } = useActiveBranch();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [fuelModalDriverId, setFuelModalDriverId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchDrivers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (branchId) params.branchId = branchId;
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (search) params.search = search;
        const data = await KhataLedgerService.getDrivers(params);
        setDrivers(data.results || data.items || (Array.isArray(data) ? data : []));
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || data.total || 0,
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          setDrivers([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load drivers');
        }
      } finally {
        setLoading(false);
      }
    },
    [branchId, dateRange, search],
  );

  useEffect(() => {
    fetchDrivers(1);
  }, [fetchDrivers]);

  const enrichedDrivers = useMemo(() => {
    return drivers.map((d) => {
      const full = allDrivers.find((x) => x._id === (d._id || d.driverId));
      return { ...d, name: getDriverName(full) || d.name || 'Unnamed Driver' };
    });
  }, [drivers, allDrivers]);

  // Aggregate KPI numbers for visible drivers
  const driverKpis = useMemo(() => {
    let totalSpend = 0;
    let totalEntries = 0;
    let topSpender = null;

    enrichedDrivers.forEach((d) => {
      const amt = Number(d.totalAmount) || 0;
      totalSpend += amt;
      totalEntries += Number(d.entryCount || d.count || 0);
      if (!topSpender || amt > (topSpender.totalAmount || 0)) {
        topSpender = d;
      }
    });

    return {
      totalSpend,
      totalEntries,
      topSpender,
      avgPerDriver: enrichedDrivers.length > 0 ? totalSpend / enrichedDrivers.length : 0,
    };
  }, [enrichedDrivers]);

  return (
    <div className="space-y-4">
      {/* Title & Filter Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Driver Ledgers</h2>
            <Badge
              variant="outline"
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {activeBranch ? activeBranch.name : 'All Locations'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Financial spend, fuel refills, advances and trip attributions by driver
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <KhataKpiGrid
        loading={loading}
        items={[
          {
            label: 'Total Driver Spend',
            icon: DollarSign,
            value: formatCurrency(driverKpis.totalSpend),
            sub: `${driverKpis.totalEntries} entries recorded`,
          },
          {
            label: 'Active Drivers',
            icon: Users,
            value: meta.totalResults || enrichedDrivers.length,
            sub: 'Drivers with active logs',
          },
          {
            label: 'Avg Spend / Driver',
            icon: User,
            value: formatCurrency(driverKpis.avgPerDriver),
            sub: 'For selected date period',
          },
          {
            label: 'Highest Contributor',
            icon: Award,
            value: driverKpis.topSpender?.name || '—',
            sub: driverKpis.topSpender
              ? formatCurrency(driverKpis.topSpender.totalAmount)
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
                aria-label="Search drivers"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="Search drivers by name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : enrichedDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground text-center">
              <User size={40} className="opacity-30" />
              <p className="text-sm font-medium">No drivers found for this period</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Try widening your date range or selecting a different location.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 text-xs">
                  <TableHead>Driver</TableHead>
                  <TableHead>Period Total</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Top Vehicles Utilized</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedDrivers.map((driver) => (
                  <TableRow key={driver._id} className="hover:bg-slate-50/70 text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">{driver.name}</span>
                          {driver.mobileNumber && (
                            <span className="text-[11px] text-gray-400">{driver.mobileNumber}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {formatCurrency(driver.totalAmount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {driver.entryCount ?? driver.count ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {toSplitArray(driver.vehicleSplit || driver.byVehicle)
                          .slice(0, 3)
                          .map((split) => {
                            const vehicle = vehicles.find(
                              (v) => v._id === (split.vehicleId || split._id),
                            );
                            const label = vehicle?.registrationNumber || split.name || 'Unknown';
                            return (
                              <Badge
                                key={split.vehicleId || split._id || label}
                                variant="outline"
                                className="text-[10px] text-gray-700"
                              >
                                <Truck size={10} className="mr-1 text-gray-400" />
                                {label}: {formatCurrency(split.amount)}
                              </Badge>
                            );
                          })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setFuelModalDriverId(driver._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Fuel size={13} className="text-orange-500" />
                          Add Fuel
                        </button>
                        <button
                          onClick={() => navigate(`/khata-ledger/drivers/${driver._id}`)}
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
                  onClick={() => fetchDrivers(meta.page - 1)}
                  className="rounded-lg border bg-white p-2 text-sm disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchDrivers(meta.page + 1)}
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
        open={Boolean(fuelModalDriverId)}
        onClose={() => setFuelModalDriverId(null)}
        driverId={fuelModalDriverId}
        onAdded={() => fetchDrivers(meta.page)}
      />
    </div>
  );
};

export default DriversTab;
