import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import { ReportsService } from '../ReportsService.jsx';
import { DriverService } from '../../Drivers/DriverService';
import TripLedgerKpis, { Alert } from './TripLedgerKpis.jsx';
import ProfitFilterModal from './ProfitFilterModal.jsx';
import { useTripLedgerColumns } from './useTripLedgerColumns.jsx';
import {
  formatProfitLabel,
  formatLedgerCurrency,
  extractDriverOptions,
  extractVehicleOptions,
  extractRouteOptions,
  filterLedgerRows,
  paginateRows,
  computeProfitBounds,
  renderPageItems,
  LEDGER_EXPORT_COLUMNS,
  mapLedgerRowForExport,
  ledgerExportMeta,
} from './tripLedger';

const DEFAULT_PROFIT_RANGE = [-1000000, 10000000];

// --- Main Trip Ledger Report Component ---
const TripLedgerReport = () => {
  const navigate = useNavigate();

  // Data states
  const [ledgerData, setLedgerData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [ledgerError, setLedgerError] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // Filter states
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState('all');

  // Profit Range & Modal States
  const [profitRange, setProfitRange] = useState(DEFAULT_PROFIT_RANGE);
  const [minProfit, setMinProfit] = useState(DEFAULT_PROFIT_RANGE[0]);
  const [maxProfit, setMaxProfit] = useState(DEFAULT_PROFIT_RANGE[1]);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [localProfit, setLocalProfit] = useState(['', '']);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch ledger data
  const fetchLedgerData = async () => {
    setIsLoadingLedger(true);
    setLedgerError(null);
    try {
      const data = await ReportsService.getTripLedger();
      setLedgerData(data);

      // Calculate profit range from data
      const bounds = computeProfitBounds(data);
      if (bounds) {
        setMinProfit(bounds.min);
        setMaxProfit(bounds.max);
        setProfitRange([bounds.min, bounds.max]);
      }
    } catch (err) {
      console.error('Failed to fetch trip ledger:', err);
      setLedgerError(err.detail || 'Could not load trip ledger data.');
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  // Fetch summary data
  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoadingSummary(true);
      setSummaryError(null);
      try {
        const data = await ReportsService.getTripLedgerSummary();
        setSummaryData(data);
      } catch (err) {
        console.error('Failed to fetch trip ledger summary:', err);
        setSummaryError(err.detail || 'Could not load summary data.');
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummaryData();
  }, []);

  // Fetch employees (drivers)
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await DriverService.getAllDrivers(null, { limit: 100 });
        const driverList = Array.isArray(data?.data || data) ? data?.data || data : [];
        setEmployees(driverList);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const data = await DriverService.getAvailableVehicles(null);
        setVehicles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  // Extract unique options for filters from API data
  const driverOptions = useMemo(() => extractDriverOptions(employees), [employees]);
  const vehicleOptions = useMemo(() => extractVehicleOptions(vehicles), [vehicles]);
  const routeOptions = useMemo(() => extractRouteOptions(ledgerData), [ledgerData]);

  // Filter data
  const filteredData = useMemo(
    () =>
      filterLedgerRows(ledgerData, { selectedDriver, selectedVehicle, selectedRoute, profitRange }),
    [ledgerData, selectedDriver, selectedVehicle, selectedRoute, profitRange],
  );

  const exportRows = useMemo(() => filteredData.map(mapLedgerRowForExport), [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(
    () => paginateRows(filteredData, currentPage, itemsPerPage),
    [filteredData, currentPage, itemsPerPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDriver, selectedVehicle, selectedRoute, profitRange]);

  // Navigation
  const handleViewTripDetail = (row) => {
    navigate(`/reports/trip/${row._id}`, { state: { trip: row } });
  };

  // Profit Modal Handlers
  const handleOpenProfitModal = () => {
    setLocalProfit([
      profitRange[0] === minProfit ? '' : profitRange[0].toString(),
      profitRange[1] === maxProfit ? '' : profitRange[1].toString(),
    ]);
    setIsProfitModalOpen(true);
  };

  const handleApplyProfit = () => {
    // Safe parsing & clamping protection
    let parsedMin =
      localProfit[0] === '' || isNaN(Number(localProfit[0])) ? minProfit : Number(localProfit[0]);
    let parsedMax =
      localProfit[1] === '' || isNaN(Number(localProfit[1])) ? maxProfit : Number(localProfit[1]);

    parsedMin = Math.max(minProfit, parsedMin);
    parsedMax = Math.min(maxProfit, parsedMax);

    if (parsedMin > parsedMax) {
      setProfitRange([parsedMax, parsedMin]);
    } else {
      setProfitRange([parsedMin, parsedMax]);
    }
    setIsProfitModalOpen(false);
  };

  const handleResetProfit = () => {
    setProfitRange([minProfit, maxProfit]);
    setLocalProfit(['', '']);
    setIsProfitModalOpen(false);
  };

  const handleLocalSliderChange = (newValue) => {
    setLocalProfit([newValue[0].toString(), newValue[1].toString()]);
  };

  // Safe slider values for real-time rendering
  const safeSliderMin =
    localProfit[0] === '' || isNaN(Number(localProfit[0])) ? minProfit : Number(localProfit[0]);
  const safeSliderMax =
    localProfit[1] === '' || isNaN(Number(localProfit[1])) ? maxProfit : Number(localProfit[1]);

  const isDefaultProfitRange = profitRange[0] === minProfit && profitRange[1] === maxProfit;
  const activeFilterCount =
    (selectedDriver !== 'all' ? 1 : 0) +
    (selectedVehicle !== 'all' ? 1 : 0) +
    (selectedRoute !== 'all' ? 1 : 0) +
    (!isDefaultProfitRange ? 1 : 0);

  const clearFilters = () => {
    setSelectedDriver('all');
    setSelectedVehicle('all');
    setSelectedRoute('all');
    setProfitRange([minProfit, maxProfit]);
  };

  const columns = useTripLedgerColumns();

  return (
    <PageShell
      className="p-6"
      title="Trip Report"
      count={filteredData.length}
      actions={
        <ExportButton
          rows={exportRows}
          columns={LEDGER_EXPORT_COLUMNS}
          filename="trip-ledger"
          meta={ledgerExportMeta({
            selectedDriver,
            selectedVehicle,
            selectedRoute,
            profitRange,
            minProfit,
            maxProfit,
          })}
          disabled={!exportRows.length}
        />
      }
      filters={
        <FilterBar
          activeCount={activeFilterCount}
          onClear={clearFilters}
          right={
            <div className="report-filters trip-ledger-filters">
              <div className="date-input-group">
                <label>Driver</label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger className="h-10 w-[180px] text-sm">
                    <SelectValue>
                      {isLoadingEmployees
                        ? 'Loading...'
                        : selectedDriver === 'all'
                          ? 'All Drivers'
                          : selectedDriver}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Drivers</SelectItem>
                    {driverOptions.map((driver) => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="date-input-group">
                <label>Vehicle</label>
                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                  disabled={isLoadingVehicles}
                >
                  <SelectTrigger className="h-10 w-[180px] text-sm">
                    <SelectValue>
                      {isLoadingVehicles
                        ? 'Loading...'
                        : selectedVehicle === 'all'
                          ? 'All Vehicles'
                          : selectedVehicle}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicleOptions.map((vehicle) => (
                      <SelectItem key={vehicle} value={vehicle}>
                        {vehicle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="date-input-group">
                <label>Route</label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="h-10 w-[220px] text-sm">
                    <SelectValue>
                      {selectedRoute === 'all' ? 'All Routes' : selectedRoute}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Routes</SelectItem>
                    {routeOptions.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="date-input-group">
                <label>Profit Filter</label>
                <Button
                  variant="outline"
                  onClick={handleOpenProfitModal}
                  className="h-10 min-w-[200px] justify-start font-normal"
                >
                  <Filter size={16} />
                  {isDefaultProfitRange
                    ? 'All Profits'
                    : `${formatProfitLabel(profitRange[0])} - ${formatProfitLabel(profitRange[1])}`}
                </Button>
              </div>
            </div>
          }
        />
      }
      footer={`Showing ${paginatedData.length} of ${filteredData.length} trips`}
    >
      <TripLedgerKpis
        summaryData={summaryData}
        isLoadingSummary={isLoadingSummary}
        summaryError={summaryError}
        formatCurrency={formatLedgerCurrency}
      />

      {ledgerError && !isLoadingLedger && (
        <Alert severity="error" className="my-4">
          {ledgerError}
        </Alert>
      )}

      <div className="report-content">
        <div className="table-wrapper">
          <DataTable
            columns={columns}
            rows={paginatedData}
            rowKey={(row) => row._id}
            loading={isLoadingLedger}
            error={ledgerError}
            onRetry={fetchLedgerData}
            showing={paginatedData.length}
            total={filteredData.length}
            activeFilters={activeFilterCount}
            emptyTitle="No trips found"
            emptyHint="Try adjusting your filters."
            onRowClick={handleViewTripDetail}
          />
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && totalPages > 1 && (
          <div className="pagination-wrapper">
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
                {renderPageItems(currentPage, totalPages).map((item, idx) =>
                  item === '...' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={currentPage === item}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <ProfitFilterModal
        isOpen={isProfitModalOpen}
        onClose={() => setIsProfitModalOpen(false)}
        localProfit={localProfit}
        onLocalProfitChange={setLocalProfit}
        minProfit={minProfit}
        maxProfit={maxProfit}
        safeSliderMin={safeSliderMin}
        safeSliderMax={safeSliderMax}
        onLocalSliderChange={handleLocalSliderChange}
        onApply={handleApplyProfit}
        onReset={handleResetProfit}
      />
    </PageShell>
  );
};

export default TripLedgerReport;
