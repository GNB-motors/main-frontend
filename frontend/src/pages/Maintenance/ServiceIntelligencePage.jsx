import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MaintenanceService } from './MaintenanceService.js';
import { getThemeCSS } from '../../utils/colorTheme';
import AlertsTab from './Component/AlertsTab.jsx';
import ResolveIssueModal from './Component/ResolveIssueModal.jsx';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import { buildServiceIntelligenceColumns } from './serviceIntelligenceColumns';
import {
  ITEMS_PER_PAGE,
  EMPTY_SUMMARY,
  VALID_TABS,
} from './serviceIntelligence/serviceIntelligenceConstants.js';
import logger from '../../utils/logger';
import './ServiceIntelligencePage.css';
import '../Profile/VehiclesPage.css';
import ServiceIntelligenceTable from './serviceIntelligence/ServiceIntelligenceTable.jsx';
import RepairFilterPills from './serviceIntelligence/RepairFilterPills.jsx';
import ServiceFilterPills from './serviceIntelligence/ServiceFilterPills.jsx';
import ServiceIntelligenceKpis from './serviceIntelligence/ServiceIntelligenceKpis.jsx';
import ServiceIntelligenceTabBar from './serviceIntelligence/ServiceIntelligenceTabBar.jsx';
import ServiceIntelligenceActions from './serviceIntelligence/ServiceIntelligenceActions.jsx';
} from './serviceIntelligence/serviceIntelligenceFilters.js';
  filterDisplayedRows,
  countFilterPills,
import {

const ServiceIntelligencePage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab')?.toUpperCase();
  const navState = typeof window !== 'undefined' ? window.history.state?.usr || {} : {};
  const initialTab = VALID_TABS.includes(urlTab) ? urlTab : navState.focusTab || 'SERVICE';
  const [activeTab, setActiveTab] = useState(initialTab);
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  // Filter pills state
  const [activePriorityFilter, setActivePriorityFilter] = useState('ALL');
  const [activeServiceFilter, setActiveServiceFilter] = useState('ALL');

  // Modal resolution state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedResolveItem, setSelectedResolveItem] = useState(null);

  // Active alerts count for tab badge
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);
  const [alertsRefreshing, setAlertsRefreshing] = useState(false);

  useEffect(() => {
    const handler = () => setThemeColors(getThemeCSS());
    handler();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Fetch active alerts count for badge
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const alerts = await MaintenanceService.getAlerts();
        if (mounted && Array.isArray(alerts)) {
          const activeCount = alerts.filter((a) => !a.resolved).length;
          setActiveAlertsCount(activeCount);
        }
      } catch {
        // Silently skip if alerts cannot be fetched
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // Race-safe loader: only the most recent request's response wins.
  const requestIdRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const load = useCallback(async (recordType, q, pageNum) => {
    if (recordType === 'ALERTS') {
      setRows([]);
      return;
    }
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        MaintenanceService.listRecords({
          recordType,
          search: q || undefined,
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        }),
        MaintenanceService.getSummary({ recordType, search: q || undefined }),
      ]);
      if (myId !== requestIdRef.current) return;
      setRows(recordsRes.data);
      setTotalPages(recordsRes.meta?.totalPages || 1);
      setTotalRecords(recordsRes.meta?.total ?? recordsRes.data.length);
      setSummary(summaryRes);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.message || 'Failed to load records');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Reset to page 1 when the search term changes.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Tab change: load immediately. Search/page change: debounced.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      load(activeTab, '', 1);
      return undefined;
    }
    const t = setTimeout(() => load(activeTab, search.trim(), page), 300);
    return () => clearTimeout(t);
  }, [search, activeTab, page, load]);

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: `Delete this ${activeTab.toLowerCase()} entry?`,
      body: 'This cannot be undone.',
      confirmLabel: 'Delete entry',
      danger: true,
    });
    if (!ok) return;
    try {
      await MaintenanceService.deleteRecord(row._id);
      setRows((prev) => prev.filter((r) => r._id !== row._id));
      toast.success('Record deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const handleOpenResolveModal = (row) => {
    setSelectedResolveItem(row);
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async ({
    targetItem,
    workshop,
    resolutionNote,
    amount,
    resolveDate,
  }) => {
    const existingNotes = targetItem.notes || '';
    const resolutionTag = `[RESOLVED: ${resolutionNote} (${resolveDate})]`;
    const updatedNotes = existingNotes ? `${existingNotes} ${resolutionTag}` : resolutionTag;

    try {
      const updatedRecord = await MaintenanceService.updateRecord(targetItem._id, {
        notes: updatedNotes,
        workshop: workshop || targetItem.workshop,
        amount: amount !== undefined ? amount : targetItem.amount,
      });

      // Optimistically update local rows
      setRows((prev) =>
        prev.map((r) => {
          if (r._id === targetItem._id) {
            return {
              ...r,
              ...updatedRecord,
              notes: updatedNotes,
              workshop: workshop || r.workshop,
              amount: amount !== undefined ? amount : r.amount,
              status: 'RESOLVED',
              resolved: true,
            };
          }
          return r;
        }),
      );

      const vehReg = targetItem.vehicleId?.registrationNumber || targetItem.vehicleReg || 'Vehicle';
      toast.success(`🎉 Issue on ${vehReg} marked as Resolved & Roadworthy!`);
      setResolveModalOpen(false);
      setSelectedResolveItem(null);
    } catch (err) {
      logger.warn('ServiceIntelligencePage', 'Failed to resolve issue', err);
      toast.error(err?.message || 'Failed to mark issue as resolved');
    }
  };

  const goToAdd = () => {
    navigate(
      activeTab === 'SERVICE'
        ? '/vehicles/service-intelligence/add-service'
        : '/vehicles/service-intelligence/add-repair',
    );
  };

  const openVehicle = (veh) =>
    navigate('/vehicles/add', {
      state: {
        editingVehicle: {
          id: veh._id,
          _id: veh._id,
          registrationNumber: veh.registrationNumber,
          chassisNumber: veh.chassisNumber,
          model: veh.model,
        },
      },
    });

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
    setSearch('');
    setPage(1);
    setActivePriorityFilter('ALL');
    setActiveServiceFilter('ALL');
    isFirstRenderRef.current = true; // re-fire immediate load
  };

  // Synchronize when URL search parameters change externally
  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toUpperCase();
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
      setSearch('');
      setPage(1);
      setActivePriorityFilter('ALL');
      setActiveServiceFilter('ALL');
      isFirstRenderRef.current = true;
    }
  }, [searchParams, activeTab]);

  const handlePageChange = (next) => {
    if (next >= 1 && next <= totalPages) setPage(next);
  };

  const isService = activeTab === 'SERVICE';
  const isAlerts = activeTab === 'ALERTS';

  // Dynamic filter pill counts computed from current rows
  const filterCounts = useMemo(() => countFilterPills(rows, activeTab), [rows, activeTab]);

  // Client-side row filtering based on active filter pill
  const displayedRows = useMemo(
    () => filterDisplayedRows(rows, activeTab, activePriorityFilter, activeServiceFilter),
    [rows, activeTab, activePriorityFilter, activeServiceFilter],
  );

  const columns = isAlerts
    ? []
    : buildServiceIntelligenceColumns({
        isService,
        onOpenVehicle: openVehicle,
        onResolveRow: handleOpenResolveModal,
        onDeleteRow: handleDelete,
      });

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div
        className="vehicles-content-wrapper"
        style={{ paddingBottom: 48, alignItems: 'stretch' }}
      >
        <PageShell
          title="Service Intelligence"
          subtitle="Manage vehicle service and repair history, track issue criticality (Axles, Brakes, Tyres), and resolve maintenance alerts."
          actions={
            <ServiceIntelligenceActions
              isAlerts={isAlerts}
              isService={isService}
              alertsRefreshing={alertsRefreshing}
              setAlertsRefreshing={setAlertsRefreshing}
              setAlertsRefreshKey={setAlertsRefreshKey}
              goToAdd={goToAdd}
            />
          }
        >
          {/* Segmented Glassmorphic Tab Bar - Always stationary at top */}
          <ServiceIntelligenceTabBar
            activeTab={activeTab}
            activeAlertsCount={activeAlertsCount}
            switchTab={switchTab}
          />

          <div style={{ margin: '14px 0 6px 0' }}>
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                isAlerts
                  ? 'Search alerts by vehicle, category, or notes…'
                  : `Search vehicle, workshop, ${isService ? 'service category' : 'issue type'}, notes…`
              }
            />
          </div>

          <div
            className="si-tab-view-container"
            style={{ transition: 'all 0.2s ease-in-out', width: '100%' }}
          >
            {isAlerts ? (
              <AlertsTab search={search} refreshKey={alertsRefreshKey} />
            ) : (
              <>
                {/* Upgraded KPI Stats Strip */}
                <ServiceIntelligenceKpis
                  isService={isService}
                  summary={summary}
                  filterCounts={filterCounts}
                />

                {/* Priority & Category Quick Filter Pills Bar */}
                <div className="si-filter-pills-row" role="toolbar" aria-label="Issue filters">
                  {isService ? (
                    <ServiceFilterPills
                      activeServiceFilter={activeServiceFilter}
                      setActiveServiceFilter={setActiveServiceFilter}
                      filterCounts={filterCounts}
                    />
                  ) : (
                    <RepairFilterPills
                      activePriorityFilter={activePriorityFilter}
                      setActivePriorityFilter={setActivePriorityFilter}
                      filterCounts={filterCounts}
                    />
                  )}
                </div>

                {/* Data Table */}
                <ServiceIntelligenceTable
                  columns={columns}
                  displayedRows={displayedRows}
                  loading={loading}
                  totalRecords={totalRecords}
                  search={search}
                  activePriorityFilter={activePriorityFilter}
                  activeServiceFilter={activeServiceFilter}
                  totalPages={totalPages}
                  page={page}
                  handlePageChange={handlePageChange}
                  isService={isService}
                />
              </>
            )}
          </div>
        </PageShell>

        {/* Modal for marking repair issues as resolved */}
        <ResolveIssueModal
          isOpen={resolveModalOpen}
          targetItem={selectedResolveItem}
          onClose={() => {
            setResolveModalOpen(false);
            setSelectedResolveItem(null);
          }}
          onConfirmResolve={handleConfirmResolve}
        />
      </div>
    </div>
  );
};

export default ServiceIntelligencePage;
