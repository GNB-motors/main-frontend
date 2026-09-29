import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Wrench } from 'lucide-react';
import { MaintenanceService } from './MaintenanceService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import AlertsTab from './Component/AlertsTab.jsx';
import { getToken } from '../../utils/session.js';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import NewButton from '../../components/ui/NewButton';
import KpiCard from '../../components/ui/KpiCard';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { buildServiceIntelligenceColumns } from './serviceIntelligenceColumns';
import '../Profile/VehiclesPage.css';

const TABS = [
  { key: 'SERVICE', label: 'Service' },
  { key: 'REPAIR', label: 'Repair' },
  { key: 'ALERTS', label: 'Alerts' },
];

const ITEMS_PER_PAGE = 20;
const EMPTY_SUMMARY = { total: 0, totalAmount: 0, last30: 0 };

const ServiceIntelligencePage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  // Optional focusTab from location.state — set when navigating back from the
  // add-page so the user lands on the tab they just contributed to.
  const navState = typeof window !== 'undefined' ? window.history.state?.usr || {} : {};
  const [activeTab, setActiveTab] = useState(navState.focusTab || 'SERVICE');
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    const handler = () => setThemeColors(getThemeCSS());
    handler();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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
    setSearch('');
    setPage(1);
    isFirstRenderRef.current = true; // re-fire immediate load
  };

  const handlePageChange = (next) => {
    if (next >= 1 && next <= totalPages) setPage(next);
  };

  const isService = activeTab === 'SERVICE';
  const isAlerts = activeTab === 'ALERTS';

  const columns = isAlerts
    ? []
    : buildServiceIntelligenceColumns({
        isService,
        onOpenVehicle: openVehicle,
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
          subtitle="Manage vehicle service and repair history, and track fleet alerts for overdue service, high repair spend, and expiring documents."
          filters={
            !isAlerts ? (
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={`Search workshop, ${isService ? 'service' : 'repair'} type, notes…`}
                right={
                  <NewButton
                    variant="primary"
                    type="button"
                    text={isService ? 'Add Service' : 'Add Repair'}
                    prependIcon={<Plus size={16} />}
                    onClick={goToAdd}
                  />
                }
              />
            ) : null
          }
        >
          <Tabs value={activeTab} onValueChange={switchTab}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isAlerts ? (
            <AlertsTab />
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0 20px' }}>
                <KpiCard
                  title={`Total ${isService ? 'Services' : 'Repairs'}`}
                  value={summary.total}
                  accent="#3b82f6"
                  icon={<Wrench size={18} />}
                />
                <KpiCard
                  title="Last 30 days"
                  value={summary.last30}
                  accent="#f59e0b"
                  icon={<Wrench size={18} />}
                />
                <KpiCard
                  title="Total Spend"
                  value={`₹${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  accent="#16a34a"
                  icon={<Wrench size={18} />}
                />
              </div>

              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r._id}
                loading={loading}
                showing={rows.length}
                total={totalRecords}
                activeFilters={search.trim() ? 1 : 0}
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
                    : `No ${isService ? 'service' : 'repair'} entries match your search`
                }
                emptyHint={
                  totalRecords === 0
                    ? `Click "${isService ? 'Add Service' : 'Add Repair'}" to log one.`
                    : 'Try a different workshop, type, or note.'
                }
              />
            </>
          )}
        </PageShell>
      </div>
    </div>
  );
};

export default ServiceIntelligencePage;
