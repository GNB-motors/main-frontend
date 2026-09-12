import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Wrench } from 'lucide-react';
import { MaintenanceService } from './MaintenanceService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import AlertsTab from './Component/AlertsTab.jsx';
import { getToken } from '../../utils/session.js';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { computeServiceKpi } from './serviceIntelligenceKpi';
import { buildServiceIntelligenceColumns } from './serviceIntelligenceColumns';
import '../Profile/VehiclesPage.css';

const TABS = [
  { key: 'SERVICE', label: 'Service' },
  { key: 'REPAIR', label: 'Repair' },
  { key: 'ALERTS', label: 'Alerts' },
];

const Kpi = ({ title, value, accent, icon }) => (
  <div
    style={{
      flex: '1 1 220px',
      minWidth: 200,
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        background: `${accent}1a`,
        color: accent,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

const BackToVehicles = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      padding: 0,
      fontSize: 13,
      color: '#2563eb',
      cursor: 'pointer',
    }}
  >
    <ArrowLeft size={14} />
    Vehicles
  </button>
);

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

  useEffect(() => {
    const handler = () => setThemeColors(getThemeCSS());
    handler();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Race-safe loader: only the most recent request's response wins.
  const requestIdRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const load = useCallback(async (recordType, q) => {
    if (recordType === 'ALERTS') {
      setRows([]);
      return;
    }
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const token = getToken();
      const res = await MaintenanceService.listRecords(token, {
        recordType,
        search: q || undefined,
      });
      if (myId !== requestIdRef.current) return;
      setRows(res.data);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load records');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Tab change: load immediately. Search change: debounced.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      load(activeTab, '');
      return undefined;
    }
    const t = setTimeout(() => load(activeTab, search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, activeTab, load]);

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
    isFirstRenderRef.current = true; // re-fire immediate load
  };

  const isService = activeTab === 'SERVICE';
  const isAlerts = activeTab === 'ALERTS';

  // KPI summary across the loaded set (current tab).
  const kpi = useMemo(() => (isAlerts ? null : computeServiceKpi(rows)), [rows, isAlerts]);

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
          subtitle="Manage vehicle service and repair history. Alerts will surface automatically once we wire the rules."
          actions={<BackToVehicles onClick={() => navigate('/vehicles')} />}
          filters={
            !isAlerts ? (
              <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={`Search workshop, ${isService ? 'service' : 'repair'} type, notes…`}
                right={
                  <button
                    onClick={goToAdd}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} />
                    {isService ? 'Add Service' : 'Add Repair'}
                  </button>
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
                <Kpi
                  title={`Total ${isService ? 'Services' : 'Repairs'}`}
                  value={kpi.total}
                  accent="#3b82f6"
                  icon={<Wrench size={18} />}
                />
                <Kpi
                  title="Last 30 days"
                  value={kpi.last30}
                  accent="#f59e0b"
                  icon={<Wrench size={18} />}
                />
                <Kpi
                  title="Total Spend"
                  value={`₹${kpi.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  accent="#16a34a"
                  icon={<Wrench size={18} />}
                />
              </div>

              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r._id}
                loading={loading}
                emptyTitle={`No ${isService ? 'service' : 'repair'} entries yet`}
                emptyHint={`Click "${isService ? 'Add Service' : 'Add Repair'}" to log one.`}
              />
            </>
          )}
        </PageShell>
      </div>
    </div>
  );
};

export default ServiceIntelligencePage;
