import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Fuel, User, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import TableShimmer from '@/components/ui/TableShimmer';
import DateRangeFilter from '../Superadmin/components/DateRangeFilter';
import KhataLedgerService from './KhataLedgerService';
import LedgerPageHeader from './components/LedgerPageHeader';
import StatRow from './components/StatRow';
import FilterBar from './components/FilterBar';
import PaginationFooter from './components/PaginationFooter';
import EmptyState from './components/EmptyState';
import {
  describeDateRange,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  getInitialDateRange,
  toSplitArray,
} from './utils';

const DriversPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, grandTotal: 0, grandEntries: 0 });
  // Results come back sorted by spend desc, so the top row of page 1 is the
  // period leader. Hold on to it so paging doesn't blank the stat.
  const [leader, setLeader] = useState(null);

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
        const results = data.results || [];
        setDrivers(results);
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total ?? data.totalResults ?? 0,
          grandTotal: data.grandTotal || 0,
          grandEntries: data.grandEntries || 0,
        });
        if ((data.page || 1) === 1) setLeader(results[0] || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load driver totals');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, search],
  );

  useEffect(() => {
    fetchDrivers(1);
  }, [fetchDrivers]);

  const driverName = (d) => [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Unnamed driver';
  const periodLabel = describeDateRange(dateRange);

  const stats = [
    {
      label: 'Total spend',
      value: formatCurrencyCompact(meta.grandTotal),
      context: periodLabel,
      accent: true,
    },
    {
      label: 'Entries',
      value: formatNumber(meta.grandEntries),
      context: 'Across all sources',
    },
    {
      label: 'Drivers with spend',
      value: formatNumber(meta.total),
      context: search ? `Matching “${search}”` : periodLabel,
    },
    {
      label: 'Highest spend',
      value: leader ? driverName(leader) : '—',
      context: leader ? formatCurrency(leader.totalAmount) : 'No entries yet',
      mono: false,
    },
  ];

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        title="Drivers"
        icon={Users}
        description="What each driver has spent in the period, across every truck they drove."
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Button
          size="lg"
          onClick={() => navigate('/khata-ledger/fuel/new', { state: { from: '/khata-ledger/drivers' } })}
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
        >
          <Fuel size={16} />
          Add Fuel
        </Button>
      </LedgerPageHeader>

      <StatRow items={stats} loading={loading} />

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by driver name or mobile number…"
        activeFilters={
          search ? [{ key: 'search', label: `Search: ${search}`, onClear: () => setSearchInput('') }] : []
        }
        onClearAll={search ? () => setSearchInput('') : undefined}
      />

      <Card className="card-static overflow-hidden p-0">
        <CardContent className="p-0">
          {loading ? (
            <TableShimmer columns={5} rows={6} />
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={User}
              title={search ? 'No drivers match that search' : 'No driver spend in this period'}
              hint={
                search
                  ? 'Check the spelling, or clear the search to see every driver.'
                  : 'Widen the date range, or log a fuel entry to start building the ledger.'
              }
              action={
                !search && (
                  <Button
                    size="lg"
                    onClick={() =>
                      navigate('/khata-ledger/fuel/new', { state: { from: '/khata-ledger/drivers' } })
                    }
                    style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
                  >
                    <Fuel size={16} />
                    Add Fuel
                  </Button>
                )
              }
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Period spend</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead>Trucks driven</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => {
                    const splits = toSplitArray(driver.vehicleSplit);
                    return (
                      <TableRow
                        key={driver._id}
                        onClick={() => navigate(`/khata-ledger/drivers/${driver._id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <User size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{driverName(driver)}</p>
                              {driver.mobileNumber && (
                                <p className="num truncate text-xs text-muted-foreground">
                                  {driver.mobileNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="num whitespace-nowrap text-right font-semibold">
                          {formatCurrency(driver.totalAmount)}
                        </TableCell>
                        <TableCell className="num text-right text-muted-foreground">
                          {formatNumber(driver.entryCount ?? 0)}
                        </TableCell>
                        <TableCell>
                          {splits.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              {splits.slice(0, 3).map((split) => (
                                <span key={split.name} className="reg-plate">
                                  {split.name}
                                </span>
                              ))}
                              {splits.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{splits.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <PaginationFooter
            page={meta.page}
            totalPages={meta.totalPages}
            totalResults={meta.total}
            unit="drivers"
            onPageChange={fetchDrivers}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DriversPage;
