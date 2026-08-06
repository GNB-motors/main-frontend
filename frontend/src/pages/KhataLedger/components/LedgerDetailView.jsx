import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Truck, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DateRangeFilter from '../../Superadmin/components/DateRangeFilter';
import TripService from '../../Trip/services/TripService';
import KhataLedgerService from '../KhataLedgerService';
import LedgerPageHeader from './LedgerPageHeader';
import StatRow from './StatRow';
import FilterBar, { FilterSelect } from './FilterBar';
import LedgerTable from './LedgerTable';
import PaginationFooter from './PaginationFooter';
import ShareBars from './ShareBars';
import {
  CATEGORIES,
  CATEGORY_DOTS,
  CATEGORY_LABELS,
  SOURCES,
  SOURCE_LABELS,
  describeDateRange,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  getDriverName,
  getVehicleLabel,
  getInitialDateRange,
  toSplitArray,
} from '../utils';

const LedgerDetailView = ({ entityType, entityId }) => {
  const navigate = useNavigate();
  const isDriver = entityType === 'driver';
  const listPath = isDriver ? '/khata-ledger/drivers' : '/khata-ledger/trucks';

  const [entityName, setEntityName] = useState('');
  const [entityLoading, setEntityLoading] = useState(true);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0, byCategory: {}, bySource: {} });

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [crossFilterId, setCrossFilterId] = useState('');
  const [crossOptions, setCrossOptions] = useState([]);

  useEffect(() => {
    const loadEntity = async () => {
      setEntityLoading(true);
      try {
        const res = isDriver
          ? await TripService.getDriverById(entityId)
          : await TripService.getVehicleById(entityId);
        const data = res?.data ?? res;
        setEntityName((isDriver ? getDriverName(data) : getVehicleLabel(data)) || '');
      } catch {
        setEntityName(isDriver ? 'Driver ledger' : 'Truck ledger');
      } finally {
        setEntityLoading(false);
      }
    };

    const loadCrossOptions = async () => {
      try {
        const res = isDriver
          ? await TripService.getVehicles({ limit: 200 })
          : await TripService.getDrivers({ limit: 200 });
        setCrossOptions(res?.data || res?.results || res || []);
      } catch {
        // The cross filter is an enhancement; the ledger still loads without it.
      }
    };

    loadEntity();
    loadCrossOptions();
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
        if (crossFilterId) params[isDriver ? 'vehicleId' : 'driverId'] = crossFilterId;

        const [ledgerData, summaryData] = await Promise.all([
          isDriver
            ? KhataLedgerService.getDriverLedger(entityId, params)
            : KhataLedgerService.getVehicleLedger(entityId, params),
          isDriver
            ? KhataLedgerService.getDriverSummary(entityId, params)
            : KhataLedgerService.getVehicleSummary(entityId, params),
        ]);

        setRows(ledgerData.results || []);
        setMeta({
          page: ledgerData.page || 1,
          totalPages: ledgerData.totalPages || 1,
          totalResults: ledgerData.total ?? ledgerData.totalResults ?? 0,
        });
        setSummary(summaryData || { totalAmount: 0, count: 0 });
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load this ledger');
      } finally {
        setLoading(false);
      }
    },
    [entityId, isDriver, dateRange, category, source, crossFilterId],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const categoryItems = Object.entries(summary.byCategory || {})
    .map(([key, amount]) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      amount,
      dotClass: CATEGORY_DOTS[key] || CATEGORY_DOTS.MISCELLANEOUS,
    }))
    .sort((a, b) => b.amount - a.amount);

  const sourceItems = Object.entries(summary.bySource || {})
    .map(([key, amount]) => ({ key, label: SOURCE_LABELS[key] || key, amount }))
    .sort((a, b) => b.amount - a.amount);

  const splitItems = toSplitArray(isDriver ? summary.byVehicle : summary.byDriver).map((s) => ({
    key: s.name,
    label: s.name,
    amount: s.amount,
  }));

  const clearAll = () => {
    setCategory('');
    setSource('');
    setCrossFilterId('');
  };

  const crossLabel = (id) => {
    const match = crossOptions.find((o) => o._id === id);
    return isDriver ? getVehicleLabel(match) : getDriverName(match);
  };

  const activeFilters = [
    category && {
      key: 'category',
      label: `Category: ${CATEGORY_LABELS[category] || category}`,
      onClear: () => setCategory(''),
    },
    source && {
      key: 'source',
      label: `Source: ${SOURCE_LABELS[source] || source}`,
      onClear: () => setSource(''),
    },
    crossFilterId && {
      key: 'cross',
      label: `${isDriver ? 'Truck' : 'Driver'}: ${crossLabel(crossFilterId)}`,
      onClear: () => setCrossFilterId(''),
    },
  ].filter(Boolean);

  const periodLabel = describeDateRange(dateRange);
  const unattributed = summary.unattributedAmount || 0;

  const stats = [
    {
      label: 'Total spend',
      value: formatCurrencyCompact(summary.totalAmount),
      context: periodLabel,
      accent: true,
    },
    { label: 'Entries', value: formatNumber(summary.count ?? 0), context: 'In this period' },
    {
      label: 'Top category',
      value: categoryItems[0]?.label || '—',
      context: categoryItems[0] ? formatCurrency(categoryItems[0].amount) : 'No entries yet',
      mono: false,
    },
    {
      label: isDriver ? 'Top truck' : 'Top driver',
      value: splitItems[0]?.label || '—',
      context: splitItems[0] ? formatCurrency(splitItems[0].amount) : 'No entries yet',
      mono: false,
    },
  ];

  const fuelHref = `/khata-ledger/fuel/new?${isDriver ? 'driverId' : 'vehicleId'}=${entityId}`;

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        eyebrow={isDriver ? 'Driver ledger' : 'Truck ledger'}
        title={entityLoading ? '' : entityName || (isDriver ? 'Driver' : 'Truck')}
        icon={isDriver ? User : Truck}
        description={
          isDriver
            ? 'Everything filed against this driver, across every truck they drove.'
            : "Everything filed against this truck, including its drivers' entries."
        }
        backTo={listPath}
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Button
          size="lg"
          onClick={() => navigate(fuelHref, { state: { from: `${listPath}/${entityId}` } })}
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
        >
          <Fuel size={16} />
          Add Fuel
        </Button>
      </LedgerPageHeader>

      {entityLoading && <Skeleton className="h-6 w-48" />}

      <StatRow items={stats} loading={loading} />

      {unattributed > 0 && (
        <Card className="card-static border-l-4 border-l-amber-400">
          <CardContent className="p-4 text-sm">
            <span className="font-medium text-foreground">
              {formatCurrency(unattributed)} unattributed
            </span>{' '}
            <span className="text-muted-foreground">
              — these entries have no {isDriver ? 'truck' : 'driver'} on them. Add an assignment
              covering those dates so future entries resolve automatically.
            </span>
          </CardContent>
        </Card>
      )}

      <FilterBar
        hideSearch
        searchValue=""
        onSearchChange={() => {}}
        activeFilters={activeFilters}
        onClearAll={activeFilters.length ? clearAll : undefined}
      >
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          allLabel="All categories"
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
        />
        <FilterSelect
          label="Source"
          value={source}
          onChange={setSource}
          allLabel="All sources"
          options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
        />
        <FilterSelect
          label={isDriver ? 'Truck' : 'Driver'}
          value={crossFilterId}
          onChange={setCrossFilterId}
          allLabel={isDriver ? 'All trucks' : 'All drivers'}
          options={crossOptions.map((o) => ({
            value: o._id,
            label: isDriver ? getVehicleLabel(o) : getDriverName(o),
          }))}
        />
      </FilterBar>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ShareBars title="By category" items={categoryItems} />
        <ShareBars title="By source" items={sourceItems} />
        <ShareBars title={isDriver ? 'By truck' : 'By driver'} items={splitItems} />
      </div>

      <Card className="card-static overflow-hidden p-0">
        <CardContent className="p-0">
          <LedgerTable rows={rows} loading={loading} showTrip />
          <PaginationFooter
            page={meta.page}
            totalPages={meta.totalPages}
            totalResults={meta.totalResults}
            onPageChange={fetchData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LedgerDetailView;
