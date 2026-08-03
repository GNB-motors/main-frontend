import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, ChevronLeft, ChevronRight, Eye, Truck, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import AddFuelLogModal from './AddFuelLogModal';
import { formatCurrency, getDriverName, getInitialDateRange } from '../utils';

const DriversTab = ({ vehicles = [], drivers: allDrivers = [] }) => {
  const navigate = useNavigate();
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
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (search) params.search = search;
        const data = await KhataLedgerService.getDrivers(params);
        setDrivers(data.results || data.items || data || []);
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || data.total || 0,
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          setDrivers([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
          // Backend endpoint not ready yet; degrade silently
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load drivers');
        }
      } finally {
        setLoading(false);
      }
    },
    [dateRange, search]
  );

  useEffect(() => {
    fetchDrivers(1);
  }, [fetchDrivers]);

  const enrichedDrivers = drivers.map((d) => {
    const full = allDrivers.find((x) => x._id === (d._id || d.driverId));
    return { ...d, name: getDriverName(full) || d.name || 'Unnamed Driver' };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Drivers</h2>
          <p className="text-sm text-muted-foreground">Period totals and entry counts per driver</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none"
                placeholder="Search drivers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : enrichedDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <User size={40} className="opacity-30" />
              <p className="text-sm">No drivers found for this period</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Period Total</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Top Vehicles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedDrivers.map((driver) => (
                  <TableRow key={driver._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <User size={14} />
                        </div>
                        <span className="font-medium">{driver.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(driver.totalAmount)}</TableCell>
                    <TableCell>{driver.entryCount ?? driver.count ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(driver.vehicleSplit || driver.byVehicle || [])
                          .slice(0, 3)
                          .map((split) => {
                            const vehicle = vehicles.find((v) => v._id === (split.vehicleId || split._id));
                            const label = vehicle?.registrationNumber || split.name || 'Unknown';
                            return (
                              <Badge key={split.vehicleId || split._id || label} variant="outline" className="text-xs">
                                <Truck size={10} className="mr-1" />
                                {label}: {formatCurrency(split.amount)}
                              </Badge>
                            );
                          })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setFuelModalDriverId(driver._id)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <Fuel size={13} />
                          Add Fuel
                        </button>
                        <button
                          onClick={() => navigate(`/khata-ledger/drivers/${driver._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
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
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.totalResults} total)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchDrivers(meta.page - 1)}
                  className="rounded-lg border p-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchDrivers(meta.page + 1)}
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
        open={!!fuelModalDriverId}
        onClose={() => setFuelModalDriverId(null)}
        driverId={fuelModalDriverId}
        onAdded={() => fetchDrivers(meta.page)}
      />
    </div>
  );
};

export default DriversTab;
