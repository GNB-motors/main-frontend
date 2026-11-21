import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, User } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import KhataLedgerService from '../KhataLedgerService';
import AddFuelLogModal from './AddFuelLogModal';
import KhataKpiGrid from './KhataKpiGrid';
import {
  KhataCard,
  KhataEmpty,
  KhataPager,
  KhataPill,
  KhataSearch,
  KhataSectionHead,
  KhataTableSkeleton,
} from './khataUi';
import {
  formatCurrency,
  getDriverName,
  getInitialDateRange,
  getVehicleLabel,
  initialsOf,
  plural,
  toSplitArray,
} from '../utils';

const KINDS = {
  driver: {
    load: (params) => KhataLedgerService.getDrivers(params),
    title: 'Driver ledgers',
    subtitle: 'Spend, fuel, advances and trip costs by driver.',
    listTitle: 'Drivers',
    noun: 'driver',
    search: 'Search by name or phone',
    column: 'Driver',
    splitColumn: 'Top vehicles',
    split: (row) => row.vehicleSplit || row.byVehicle,
    detailPath: (id) => `/khata-ledger/drivers/${id}`,
    fuelProp: 'driverId',
    loadError: 'Could not load drivers',
    kpis: { total: 'Driver spend', count: 'Drivers with entries', top: 'Highest spend' },
  },
  vehicle: {
    load: (params) => KhataLedgerService.getVehicles(params),
    title: 'Vehicle ledgers',
    subtitle: 'Costs, fuel logs, maintenance and driver spend by vehicle.',
    listTitle: 'Vehicles',
    noun: 'vehicle',
    search: 'Search by registration number',
    column: 'Vehicle',
    splitColumn: 'Top drivers',
    split: (row) => row.driverSplit || row.byDriver,
    detailPath: (id) => `/khata-ledger/trucks/${id}`,
    fuelProp: 'vehicleId',
    loadError: 'Could not load vehicles',
    kpis: { total: 'Fleet spend', count: 'Vehicles with entries', top: 'Highest cost' },
  },
};

/** The Drivers and Vehicles tabs: a period summary and one row per driver or vehicle. */
export default function LedgerListTab({ kind, vehicles = [], drivers = [] }) {
  const config = KINDS[kind];
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  // Totals over every row, not just this page. Older backends don't send it.
  const [summary, setSummary] = useState(null);
  const [fuelFor, setFuelFor] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRows = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        // The location travels in the X-Branch-Id header; a branchId query field is a 400.
        const params = { page, limit: 20 };
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        if (search) params.search = search;
        const data = await config.load(params);
        setRows(data.results || data.items || (Array.isArray(data) ? data : []));
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || data.total || 0,
        });
        setSummary(data.summary || null);
      } catch (err) {
        if (err?.response?.status === 404) {
          setRows([]);
          setMeta({ page: 1, totalPages: 1, totalResults: 0 });
          setSummary(null);
        } else {
          toast.error(err?.response?.data?.message || err?.message || config.loadError);
        }
      } finally {
        setLoading(false);
      }
    },
    [dateRange, search, config],
  );

  useEffect(() => {
    fetchRows(1);
  }, [fetchRows]);

  const named = useMemo(
    () =>
      rows.map((row) => {
        const id = row._id || row.driverId || row.vehicleId;
        if (kind === 'driver') {
          const own = [row.firstName, row.lastName].filter(Boolean).join(' ');
          const listed = getDriverName(drivers.find((d) => d._id === id));
          return { ...row, id, name: own || (listed !== '-' && listed) || 'Unnamed driver' };
        }
        const listed = getVehicleLabel(vehicles.find((v) => v._id === id));
        const name = row.registrationNumber || (listed !== '-' && listed) || 'Unknown vehicle';
        return { ...row, id, name };
      }),
    [rows, drivers, vehicles, kind],
  );

  const totals = useMemo(() => {
    if (summary) {
      const withEntries = Number(summary.withEntries) || 0;
      return {
        whole: true,
        spend: Number(summary.totalAmount) || 0,
        entries: Number(summary.entryCount) || 0,
        withEntries,
        average: withEntries ? summary.totalAmount / withEntries : null,
      };
    }
    let spend = 0;
    let entries = 0;
    let withEntries = 0;
    named.forEach((row) => {
      spend += Number(row.totalAmount) || 0;
      const count = Number(row.entryCount ?? row.count ?? 0);
      entries += count;
      if (count > 0) withEntries += 1;
    });
    return {
      whole: meta.totalPages <= 1,
      spend,
      entries,
      withEntries,
      average: withEntries ? spend / withEntries : null,
    };
  }, [summary, named, meta.totalPages]);

  // Rows come back largest spend first, so page 1 opens with the top one.
  const top = summary?.top
    ? { name: summary.top.name, totalAmount: summary.top.totalAmount }
    : meta.page === 1 && Number(named[0]?.totalAmount) > 0
      ? named[0]
      : null;

  const splitLabel = (split) => {
    const id = split.vehicleId || split.driverId || split._id;
    if (kind === 'driver') {
      const vehicle = vehicles.find((v) => v._id === id);
      return vehicle?.registrationNumber || split.name || 'Unknown';
    }
    const driver = drivers.find((d) => d._id === id);
    return (driver && getDriverName(driver)) || split.name || 'Unknown';
  };

  const empty = !loading && named.length === 0;
  const noSpend = empty || totals.entries === 0;
  const onPage = totals.whole ? '' : ' on this page';

  return (
    <>
      <KhataSectionHead
        title={config.title}
        subtitle={config.subtitle}
        actions={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      />
      <KhataKpiGrid
        label={`${config.listTitle} summary`}
        loading={loading}
        items={[
          {
            label: config.kpis.total,
            value: noSpend ? '—' : formatCurrency(totals.spend),
            sub: noSpend
              ? 'No entries in this period'
              : `${plural(totals.entries, 'entry', 'entries')}${onPage}`,
          },
          {
            label: config.kpis.count,
            value: noSpend ? '0' : totals.withEntries.toLocaleString('en-IN'),
            qualifier: `of ${(meta.totalResults || named.length).toLocaleString('en-IN')}`,
            pct: meta.totalResults ? (totals.withEntries / meta.totalResults) * 100 : null,
            sub: `${config.noun[0].toUpperCase()}${config.noun.slice(1)}s on record${onPage}`,
          },
          {
            label: `Average per ${config.noun}`,
            value: totals.average == null ? '—' : formatCurrency(totals.average),
            sub:
              totals.average == null
                ? 'No entries in this period'
                : `Over ${config.noun}s with entries${onPage}`,
          },
          {
            label: config.kpis.top,
            value: top?.name || '—',
            sub: top
              ? `${formatCurrency(top.totalAmount)}${totals.spend > 0 ? ` · ${Math.round((top.totalAmount / totals.spend) * 100)}% of spend` : ''}`
              : 'No entries in this period',
            pct: top && totals.spend > 0 ? (top.totalAmount / totals.spend) * 100 : null,
          },
        ]}
      />

      <KhataCard
        flush
        title={
          <>
            {config.listTitle}
            {!loading ? (
              <span className="khata-count">
                {plural(meta.totalResults || named.length, config.noun)}
              </span>
            ) : null}
          </>
        }
        actions={
          <KhataSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder={config.search}
            label={`Search ${config.noun}s`}
          />
        }
      >
        {loading ? (
          <KhataTableSkeleton />
        ) : empty ? (
          <KhataEmpty
            icon={kind === 'driver' ? User : Truck}
            title={`No ${config.noun}s with entries in this period`}
          >
            Pick a wider date range or another location.
          </KhataEmpty>
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                <TableHead>{config.column}</TableHead>
                <TableHead className="is-num">Period total</TableHead>
                <TableHead className="is-num">Entries</TableHead>
                <TableHead>{config.splitColumn}</TableHead>
                <TableHead className="is-end">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {named.map((row) => {
                const splits = toSplitArray(config.split(row)).slice(0, 3);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="khata-entity">
                        <span className="khata-avatar" aria-hidden="true">
                          {kind === 'driver' ? initialsOf(row.name) : <Truck size={14} />}
                        </span>
                        <span>
                          <span
                            className={`khata-cell-main${kind === 'vehicle' ? ' is-code' : ''}`}
                          >
                            {row.name}
                          </span>
                          {row.mobileNumber ? (
                            <span className="khata-cell-sub">{row.mobileNumber}</span>
                          ) : null}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="is-num">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell className="is-num">{row.entryCount ?? row.count ?? 0}</TableCell>
                    <TableCell>
                      {splits.length ? (
                        <span className="khata-tags">
                          {splits.map((split) => {
                            const label = splitLabel(split);
                            return (
                              <KhataPill
                                key={split.vehicleId || split.driverId || split._id || label}
                              >
                                {label} · {formatCurrency(split.amount)}
                              </KhataPill>
                            );
                          })}
                        </span>
                      ) : (
                        <span className="khata-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="is-end">
                      <span className="khata-cell-actions">
                        <button
                          type="button"
                          className="khata-link"
                          onClick={() => setFuelFor(row.id)}
                        >
                          Add fuel
                        </button>
                        <button
                          type="button"
                          className="khata-link"
                          onClick={() => navigate(config.detailPath(row.id))}
                          aria-label={`Open ledger for ${row.name}`}
                        >
                          Ledger →
                        </button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!loading && !empty ? (
          <KhataPager
            summary={plural(meta.totalResults || named.length, config.noun)}
            page={meta.page}
            totalPages={meta.totalPages}
            onPage={fetchRows}
          />
        ) : null}
      </KhataCard>

      <AddFuelLogModal
        open={Boolean(fuelFor)}
        onClose={() => setFuelFor(null)}
        {...{ [config.fuelProp]: fuelFor }}
        onAdded={() => fetchRows(meta.page)}
      />
    </>
  );
}
