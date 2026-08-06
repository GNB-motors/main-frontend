import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Fuel, Truck } from 'lucide-react';
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

const TrucksPage = () => {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, grandTotal: 0, grandEntries: 0 });
  const [leader, setLeader] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTrucks = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (search) params.search = search;

        const data = await KhataLedgerService.getVehicles(params);
        const results = data.results || [];
        setTrucks(results);
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total ?? data.totalResults ?? 0,
          grandTotal: data.grandTotal || 0,
          grandEntries: data.grandEntries || 0,
        });
        if ((data.page || 1) === 1) setLeader(results[0] || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load truck totals');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, search],
  );

  useEffect(() => {
    fetchTrucks(1);
  }, [fetchTrucks]);

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
      label: 'Trucks with spend',
      value: formatNumber(meta.total),
      context: search ? `Matching “${search}”` : periodLabel,
    },
    {
      label: 'Highest spend',
      value: leader?.registrationNumber || '—',
      context: leader ? formatCurrency(leader.totalAmount) : 'No entries yet',
    },
  ];

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        title="Trucks"
        icon={Truck}
        description="What each truck has cost in the period, including its drivers' entries."
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Button
          size="lg"
          onClick={() => navigate('/khata-ledger/fuel/new', { state: { from: '/khata-ledger/trucks' } })}
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
        searchPlaceholder="Search by registration number…"
        activeFilters={
          search ? [{ key: 'search', label: `Search: ${search}`, onClear: () => setSearchInput('') }] : []
        }
        onClearAll={search ? () => setSearchInput('') : undefined}
      />

      <Card className="card-static overflow-hidden p-0">
        <CardContent className="p-0">
          {loading ? (
            <TableShimmer columns={5} rows={6} />
          ) : trucks.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={search ? 'No trucks match that search' : 'No truck spend in this period'}
              hint={
                search
                  ? 'Check the registration number, or clear the search to see every truck.'
                  : 'Widen the date range, or log a fuel entry to start building the ledger.'
              }
              action={
                !search && (
                  <Button
                    size="lg"
                    onClick={() =>
                      navigate('/khata-ledger/fuel/new', { state: { from: '/khata-ledger/trucks' } })
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
                    <TableHead>Truck</TableHead>
                    <TableHead className="text-right">Period spend</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead>Drivers</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trucks.map((truck) => {
                    const splits = toSplitArray(truck.driverSplit);
                    return (
                      <TableRow
                        key={truck._id}
                        onClick={() => navigate(`/khata-ledger/trucks/${truck._id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <Truck size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className="reg-plate">{truck.registrationNumber || '—'}</span>
                              {truck.model && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {truck.model}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="num whitespace-nowrap text-right font-semibold">
                          {formatCurrency(truck.totalAmount)}
                        </TableCell>
                        <TableCell className="num text-right text-muted-foreground">
                          {formatNumber(truck.entryCount ?? 0)}
                        </TableCell>
                        <TableCell>
                          {splits.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {splits.slice(0, 2).map((split) => (
                                <span key={split.name} className="text-sm text-foreground">
                                  {split.name}
                                </span>
                              ))}
                              {splits.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{splits.length - 2}
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
            unit="trucks"
            onPageChange={fetchTrucks}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrucksPage;
