import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus,
  Wrench,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Check,
  Bell,
  Droplets,
  ShieldAlert,
  Zap,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import { MaintenanceService } from './MaintenanceService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import AlertsTab from './Component/AlertsTab.jsx';
import ResolveIssueModal from './Component/ResolveIssueModal.jsx';
import { getToken } from '../../utils/session.js';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import NewButton from '../../components/ui/NewButton';
import KpiCard from '../../components/ui/KpiCard';
import { buildServiceIntelligenceColumns } from './serviceIntelligenceColumns';
import {
  classifyIssuePriority,
  isRecordResolved,
  formatCurrencyINR,
} from './serviceIntelligenceLogic';
import '../Profile/VehiclesPage.css';
import './ServiceIntelligencePage.css';

const TABS = [
  { key: 'SERVICE', label: 'Service History', icon: Wrench },
  { key: 'REPAIR', label: 'Repair & Breakdowns', icon: AlertOctagon },
  { key: 'ALERTS', label: 'Fleet Alerts', icon: Bell },
];

const ITEMS_PER_PAGE = 20;
const EMPTY_SUMMARY = { total: 0, totalAmount: 0, last30: 0 };
const VALID_TABS = ['SERVICE', 'REPAIR', 'ALERTS'];

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
        const token = getToken();
        const alerts = await MaintenanceService.getAlerts(token);
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
      const token = getToken();
      const [recordsRes, summaryRes] = await Promise.all([
        MaintenanceService.listRecords(token, {
          recordType,
          search: q || undefined,
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        }),
        MaintenanceService.getSummary(token, { recordType, search: q || undefined }),
      ]);
      if (myId !== requestIdRef.current) return;
      setRows(recordsRes.data);
      setTotalPages(recordsRes.meta?.totalPages || 1);
      setTotalRecords(recordsRes.meta?.total ?? recordsRes.data.length);
      setSummary(summaryRes);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load records');
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
      const token = getToken();
      await MaintenanceService.deleteRecord(token, row._id);
      setRows((prev) => prev.filter((r) => r._id !== row._id));
      toast.success('Record deleted');
    } catch (err) {
      toast.error(err?.detail || 'Failed to delete');
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
    const token = getToken();
    const existingNotes = targetItem.notes || '';
    const resolutionTag = `[RESOLVED: ${resolutionNote} (${resolveDate})]`;
    const updatedNotes = existingNotes ? `${existingNotes} ${resolutionTag}` : resolutionTag;

    try {
      const updatedRecord = await MaintenanceService.updateRecord(token, targetItem._id, {
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
      console.error('Failed to resolve issue', err);
      toast.error(err?.detail || err?.message || 'Failed to mark issue as resolved');
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
  const filterCounts = useMemo(() => {
    if (activeTab === 'REPAIR') {
      let p0 = 0;
      let p1 = 0;
      let p2 = 0;
      let p3 = 0;
      let open = 0;
      let resolved = 0;
      rows.forEach((r) => {
        const p = classifyIssuePriority(r);
        if (p.code === 'P0') p0 += 1;
        else if (p.code === 'P1') p1 += 1;
        else if (p.code === 'P2') p2 += 1;
        else if (p.code === 'P3') p3 += 1;

        if (isRecordResolved(r)) resolved += 1;
        else open += 1;
      });
      return { all: rows.length, p0, p1, p2, p3, open, resolved };
    }
    if (activeTab === 'SERVICE') {
      let periodic = 0;
      let oil = 0;
      let brake = 0;
      let electrical = 0;
      rows.forEach((r) => {
        const t =
          `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
        if (
          t.includes('periodic') ||
          t.includes('scheduled') ||
          t.includes('general') ||
          t.includes('routine')
        )
          periodic += 1;
        else if (t.includes('oil') || t.includes('lube') || t.includes('filter')) oil += 1;
        else if (
          t.includes('brake') ||
          t.includes('clutch') ||
          t.includes('suspension') ||
          t.includes('steering')
        )
          brake += 1;
        else if (
          t.includes('electric') ||
          t.includes('battery') ||
          t.includes('light') ||
          t.includes('wiring')
        )
          electrical += 1;
      });
      return { all: rows.length, periodic, oil, brake, electrical };
    }
    return {};
  }, [rows, activeTab]);

  // Client-side row filtering based on active filter pill
  const displayedRows = useMemo(() => {
    if (activeTab === 'REPAIR') {
      if (activePriorityFilter === 'ALL') return rows;
      if (activePriorityFilter === 'OPEN') return rows.filter((r) => !isRecordResolved(r));
      if (activePriorityFilter === 'RESOLVED') return rows.filter((r) => isRecordResolved(r));
      return rows.filter((r) => classifyIssuePriority(r).code === activePriorityFilter);
    }
    if (activeTab === 'SERVICE') {
      if (activeServiceFilter === 'ALL') return rows;
      if (activeServiceFilter === 'PERIODIC') {
        return rows.filter((r) => {
          const t =
            `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
          return (
            t.includes('periodic') ||
            t.includes('scheduled') ||
            t.includes('general') ||
            t.includes('routine')
          );
        });
      }
      if (activeServiceFilter === 'OIL') {
        return rows.filter((r) => {
          const t =
            `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
          return t.includes('oil') || t.includes('lube') || t.includes('filter');
        });
      }
      if (activeServiceFilter === 'BRAKE') {
        return rows.filter((r) => {
          const t =
            `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
          return (
            t.includes('brake') ||
            t.includes('clutch') ||
            t.includes('suspension') ||
            t.includes('steering')
          );
        });
      }
      if (activeServiceFilter === 'ELECTRICAL') {
        return rows.filter((r) => {
          const t =
            `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
          return (
            t.includes('electric') ||
            t.includes('battery') ||
            t.includes('light') ||
            t.includes('wiring')
          );
        });
      }
    }
    return rows;
  }, [rows, activeTab, activePriorityFilter, activeServiceFilter]);

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
            isAlerts ? (
              <NewButton
                variant="secondary"
                type="button"
                text="Refresh Alerts"
                prependIcon={
                  <RefreshCw size={15} className={alertsRefreshing ? 'spin-anim' : ''} />
                }
                onClick={() => {
                  setAlertsRefreshing(true);
                  setAlertsRefreshKey((prev) => prev + 1);
                  setTimeout(() => setAlertsRefreshing(false), 600);
                  toast.info('Refreshing fleet alerts…');
                }}
              />
            ) : (
              <NewButton
                variant="primary"
                type="button"
                text={isService ? 'Add Service' : 'Add Repair'}
                prependIcon={<Plus size={16} />}
                onClick={goToAdd}
              />
            )
          }
        >
          {/* Segmented Glassmorphic Tab Bar - Always stationary at top */}
          <div className="si-tabs-container" role="tablist" aria-label="Service Intelligence Views">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`si-tab-btn ${isActive ? 'si-tab-btn--active' : ''}`}
                  onClick={() => switchTab(t.key)}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  {t.key === 'ALERTS' && activeAlertsCount > 0 && (
                    <span className="si-tab-badge si-tab-badge--critical">{activeAlertsCount}</span>
                  )}
                </button>
              );
            })}
          </div>

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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0 16px' }}>
                  <KpiCard
                    title={`Total ${isService ? 'Services' : 'Repairs'}`}
                    value={summary.total}
                    accent={isService ? '#2563eb' : '#dc2626'}
                    icon={isService ? <Wrench size={18} /> : <AlertOctagon size={18} />}
                  />
                  {isService ? (
                    <>
                      <KpiCard
                        title="Last 30 days"
                        value={summary.last30}
                        accent="#2563eb"
                        icon={<CalendarCheck size={18} />}
                      />
                      <KpiCard
                        title="Total Spend"
                        value={`₹${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        accent="#16a34a"
                        icon={<Wrench size={18} />}
                      />
                      <KpiCard
                        title="Average Service Cost"
                        value={formatCurrencyINR(
                          summary.total > 0 ? summary.totalAmount / summary.total : 0,
                        )}
                        accent="#0284c7"
                        icon={<Droplets size={18} />}
                      />
                    </>
                  ) : (
                    <>
                      <KpiCard
                        title="Critical (P0 Grounded)"
                        value={filterCounts.p0 ?? 0}
                        accent="#dc2626"
                        icon={<AlertOctagon size={18} />}
                      />
                      <KpiCard
                        title="Open Issues"
                        value={filterCounts.open ?? 0}
                        accent="#e11d48"
                        icon={<AlertTriangle size={18} />}
                      />
                      <KpiCard
                        title="Total Spend"
                        value={`₹${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        accent="#16a34a"
                        icon={<Wrench size={18} />}
                      />
                    </>
                  )}
                </div>

                {/* Priority & Category Quick Filter Pills Bar */}
                <div className="si-filter-pills-row" role="toolbar" aria-label="Issue filters">
                  {isService ? (
                    <>
                      <button
                        type="button"
                        className={`si-filter-pill ${activeServiceFilter === 'ALL' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActiveServiceFilter('ALL')}
                      >
                        <span>All Services</span>
                        <span className="si-filter-pill-count">{filterCounts.all ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activeServiceFilter === 'PERIODIC' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActiveServiceFilter('PERIODIC')}
                      >
                        <CalendarCheck size={13} />
                        <span>Periodic / Scheduled</span>
                        <span className="si-filter-pill-count">{filterCounts.periodic ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activeServiceFilter === 'OIL' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActiveServiceFilter('OIL')}
                      >
                        <Droplets size={13} />
                        <span>Oil & Lubrication</span>
                        <span className="si-filter-pill-count">{filterCounts.oil ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activeServiceFilter === 'BRAKE' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActiveServiceFilter('BRAKE')}
                      >
                        <ShieldAlert size={13} />
                        <span>Brakes & Suspension</span>
                        <span className="si-filter-pill-count">{filterCounts.brake ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activeServiceFilter === 'ELECTRICAL' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActiveServiceFilter('ELECTRICAL')}
                      >
                        <Zap size={13} />
                        <span>Electrical & Battery</span>
                        <span className="si-filter-pill-count">{filterCounts.electrical ?? 0}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'ALL' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('ALL')}
                      >
                        <span>All Issues</span>
                        <span className="si-filter-pill-count">{filterCounts.all ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'P0' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('P0')}
                        style={
                          activePriorityFilter !== 'P0'
                            ? { borderColor: '#fca5a5', color: '#dc2626' }
                            : {}
                        }
                      >
                        <AlertOctagon
                          size={13}
                          color={activePriorityFilter === 'P0' ? '#fff' : '#dc2626'}
                        />
                        <span>P0 Critical (Axle / Engine / Brakes)</span>
                        <span className="si-filter-pill-count">{filterCounts.p0 ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'P1' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('P1')}
                        style={
                          activePriorityFilter !== 'P1'
                            ? { borderColor: '#fdba74', color: '#ea580c' }
                            : {}
                        }
                      >
                        <AlertTriangle
                          size={13}
                          color={activePriorityFilter === 'P1' ? '#fff' : '#ea580c'}
                        />
                        <span>P1 High (Clutch / Suspension)</span>
                        <span className="si-filter-pill-count">{filterCounts.p1 ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'P2' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('P2')}
                        style={
                          activePriorityFilter !== 'P2'
                            ? { borderColor: '#fde047', color: '#ca8a04' }
                            : {}
                        }
                      >
                        <Wrench
                          size={13}
                          color={activePriorityFilter === 'P2' ? '#fff' : '#ca8a04'}
                        />
                        <span>P2 Medium (Tyres / Roadside)</span>
                        <span className="si-filter-pill-count">{filterCounts.p2 ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'P3' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('P3')}
                        style={
                          activePriorityFilter !== 'P3'
                            ? { borderColor: '#86efac', color: '#16a34a' }
                            : {}
                        }
                      >
                        <CheckCircle2
                          size={13}
                          color={activePriorityFilter === 'P3' ? '#fff' : '#16a34a'}
                        />
                        <span>P3 Routine / Minor</span>
                        <span className="si-filter-pill-count">{filterCounts.p3 ?? 0}</span>
                      </button>
                      <div
                        style={{
                          width: 1,
                          height: 22,
                          background: '#e2e8f0',
                          margin: '0 4px',
                          flexShrink: 0,
                        }}
                      />
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'OPEN' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('OPEN')}
                        style={
                          activePriorityFilter !== 'OPEN'
                            ? { borderColor: '#fecdd3', color: '#e11d48' }
                            : {}
                        }
                      >
                        <span className="si-status-dot" />
                        <span>Open Issues</span>
                        <span className="si-filter-pill-count">{filterCounts.open ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`si-filter-pill ${activePriorityFilter === 'RESOLVED' ? 'si-filter-pill--active' : ''}`}
                        onClick={() => setActivePriorityFilter('RESOLVED')}
                        style={
                          activePriorityFilter !== 'RESOLVED'
                            ? { borderColor: '#bbf7d0', color: '#16a34a' }
                            : {}
                        }
                      >
                        <Check
                          size={13}
                          color={activePriorityFilter === 'RESOLVED' ? '#fff' : '#16a34a'}
                        />
                        <span>Resolved</span>
                        <span className="si-filter-pill-count">{filterCounts.resolved ?? 0}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Data Table */}
                <DataTable
                  columns={columns}
                  rows={displayedRows}
                  rowKey={(r) => r._id}
                  loading={loading}
                  showing={displayedRows.length}
                  total={totalRecords}
                  activeFilters={
                    (search.trim() ? 1 : 0) +
                    (activePriorityFilter !== 'ALL' ? 1 : 0) +
                    (activeServiceFilter !== 'ALL' ? 1 : 0)
                  }
                  paginated={true}
                  pagination={
                    totalPages > 1 ? (
                      <div className="vehicles-pagination-controls">
                        <button
                          className="vehicles-pagination-btn"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          type="button"
                          title="Previous page"
                        >
                          <span>←</span>
                        </button>
                        <span style={{ fontSize: 13, color: '#5d5d5e', fontWeight: 500 }}>
                          Page {page} of {totalPages}
                        </span>
                        <button
                          className="vehicles-pagination-btn"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          type="button"
                          title="Next page"
                        >
                          <span>→</span>
                        </button>
                      </div>
                    ) : null
                  }
                  emptyTitle={
                    totalRecords === 0
                      ? `No ${isService ? 'service' : 'repair'} entries yet`
                      : `No ${isService ? 'service' : 'repair'} entries match your filters`
                  }
                  emptyHint={
                    totalRecords === 0
                      ? `Click "${isService ? 'Add Service' : 'Add Repair'}" to log one.`
                      : 'Try selecting "All Issues" or clearing search query.'
                  }
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
