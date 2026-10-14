import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Filter } from 'lucide-react';
import { VehicleService } from './VehicleService.js';
import { getThemeCSS } from '../../utils/colorTheme';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import NewButton from '@/components/ui/NewButton';
import {
  computeVehicleDashboardKpis,
  DOC_COLS,
  bucketFor,
  EXPIRED_FILTER_PILLS,
} from './vehicleDashboardLogic';
import { LegendDot } from './vehicleDashboardCells';
import VehicleDashboardDocFilter from './VehicleDashboardDocFilter.jsx';
import VehicleDashboardKpis from './VehicleDashboardKpis.jsx';
import { buildVehicleDashboardColumns } from './vehicleDashboardColumns';
import VehicleDashboardPanel from './VehicleDashboardPanel';
import ChallanModal from './ChallanModal';
import './VehiclesPage.css';
import './VehicleDashboardPage.css';

const VehicleDashboardPage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected vehicle & doc for WheelsEye-style right side panel
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDocKey, setSelectedDocKey] = useState(null);
  const [docFilter, setDocFilter] = useState('ALL');
  const [challanModalOpen, setChallanModalOpen] = useState(false);

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Track in-flight request so a stale fetch can't overwrite a fresher one
  const requestIdRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const load = useCallback(async (q) => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await VehicleService.getFleetDashboard({ search: q || undefined });
      if (myId !== requestIdRef.current) return;
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.message || 'Failed to load vehicle dashboard');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Fire immediately on mount, debounce search changes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      load('');
      return undefined;
    }
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // If selected vehicle is in rows, keep its reference fresh when rows update
  useEffect(() => {
    if (selectedVehicle?._id) {
      const fresh = rows.find((r) => r._id === selectedVehicle._id);
      if (fresh) setSelectedVehicle(fresh);
    }
  }, [rows, selectedVehicle]);

  const kpis = useMemo(() => computeVehicleDashboardKpis(rows), [rows]);

  // Count vehicles across compliance buckets for the dropdown options
  const filterOptionsWithCounts = useMemo(() => {
    let anyExpiredCount = 0;
    let anyExpiringSoonCount = 0;
    let anyMissingCount = 0;

    const expiredByDoc = {};
    const soonByDoc = {};

    DOC_COLS.forEach(({ key }) => {
      expiredByDoc[key] = 0;
      soonByDoc[key] = 0;
    });

    rows.forEach((r) => {
      let hasExpired = false;
      let hasSoon = false;
      let hasMissing = false;

      DOC_COLS.forEach(({ key }) => {
        const b = bucketFor(r.documents?.[key]);
        if (b === 'expired') {
          hasExpired = true;
          expiredByDoc[key] += 1;
        } else if (b === 'critical' || b === 'warning') {
          hasSoon = true;
          soonByDoc[key] += 1;
        } else if (b === 'missing') {
          hasMissing = true;
        }
      });

      if (hasExpired) anyExpiredCount += 1;
      if (hasSoon) anyExpiringSoonCount += 1;
      if (hasMissing) anyMissingCount += 1;
    });

    return {
      anyExpiredCount,
      anyExpiringSoonCount,
      anyMissingCount,
      expiredByDoc,
      soonByDoc,
    };
  }, [rows]);

  // Filter rows based on active dropdown document filter
  const displayRows = useMemo(() => {
    if (docFilter === 'ALL') return rows;

    if (docFilter === 'EXPIRING_SOON') {
      return rows.filter((r) =>
        DOC_COLS.some((col) => {
          const b = bucketFor(r.documents?.[col.key]);
          return b === 'critical' || b === 'warning';
        }),
      );
    }

    if (docFilter === 'EXPIRED_ANY') {
      return rows.filter((r) =>
        DOC_COLS.some((col) => bucketFor(r.documents?.[col.key]) === 'expired'),
      );
    }

    if (docFilter === 'MISSING_ANY') {
      return rows.filter((r) =>
        DOC_COLS.some((col) => bucketFor(r.documents?.[col.key]) === 'missing'),
      );
    }

    if (docFilter.startsWith('EXPIRED_')) {
      const docKey = docFilter.replace('EXPIRED_', '');
      return rows.filter((r) => bucketFor(r.documents?.[docKey]) === 'expired');
    }

    if (docFilter.startsWith('SOON_')) {
      const docKey = docFilter.replace('SOON_', '');
      return rows.filter((r) => {
        const b = bucketFor(r.documents?.[docKey]);
        return b === 'critical' || b === 'warning';
      });
    }

    return rows;
  }, [rows, docFilter]);

  const goEdit = useCallback(
    (row) =>
      navigate('/vehicles/add', {
        state: {
          editingVehicle: {
            id: row._id,
            _id: row._id,
            registrationNumber: row.registrationNumber,
            chassisNumber: row.chassisNumber,
            model: row.model,
          },
        },
      }),
    [navigate],
  );

  const handleSelectVehicle = (row) => {
    setSelectedVehicle(row);
    setSelectedDocKey(null);
  };

  const handleSelectDoc = (row, docKey) => {
    setSelectedVehicle(row);
    setSelectedDocKey(docKey);
  };

  const handleClosePanel = () => {
    setSelectedVehicle(null);
    setSelectedDocKey(null);
  };

  const columns = useMemo(
    () =>
      buildVehicleDashboardColumns({
        onManage: goEdit,
        onSelectVehicle: handleSelectVehicle,
        onSelectDoc: handleSelectDoc,
        selectedVehicleId: selectedVehicle?._id,
        selectedDocKey,
      }),
    [goEdit, selectedVehicle?._id, selectedDocKey],
  );

  return (
    <div className="vehicles-page-container v-dash-page" style={themeColors}>
      <div
        className="vehicles-content-wrapper"
        style={{ paddingBottom: 48, alignItems: 'stretch' }}
      >
        <PageShell
          title="Vehicle Compliance & Documents"
          subtitle="Fleet-wide document compliance and live expiry tracking. Badges update automatically."
          actions={
            <NewButton
              variant="primary"
              text="Check & Pay Challans"
              prependIcon={<ShieldCheck size={16} />}
              onClick={() => setChallanModalOpen(true)}
            />
          }
          filters={
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search vehicle"
              right={
                loading && rows.length > 0 ? (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Updating…</span>
                ) : null
              }
            />
          }
        >
          {/* Document Compliance Dropdown Filter Bar */}
          <VehicleDashboardDocFilter
            docFilter={docFilter}
            setDocFilter={setDocFilter}
            rows={rows}
            displayRows={displayRows}
            filterOptionsWithCounts={filterOptionsWithCounts}
          />

          {/* Metric Summary Cards */}
          <VehicleDashboardKpis kpis={kpis} />

          {/* WheelsEye-Inspired Split Layout Container */}
          <div className="v-dash-split-container">
            {/* Left Main Table Pane */}
            <div className="v-dash-main-pane">
              <DataTable
                columns={columns}
                rows={displayRows}
                rowKey={(row) => row._id}
                loading={loading}
                showing={displayRows.length}
                total={rows.length}
                onRowClick={handleSelectVehicle}
                rowClassName={(row) =>
                  row._id === selectedVehicle?._id ? 'v-dash-row--selected' : ''
                }
                emptyTitle={
                  docFilter !== 'ALL'
                    ? 'No vehicles matching selected document filter'
                    : 'No vehicles found'
                }
                emptyAction={
                  docFilter !== 'ALL' ? (
                    <button
                      type="button"
                      onClick={() => setDocFilter('ALL')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      Show all vehicles
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/vehicles/add')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Add one
                    </button>
                  )
                }
              />
            </div>

            {/* Right Side WheelsEye-Style Details Panel */}
            <div className="v-dash-side-panel-wrap">
              <VehicleDashboardPanel
                selectedVehicle={selectedVehicle}
                selectedDocKey={selectedDocKey}
                onSelectDoc={(docKey) => setSelectedDocKey(docKey)}
                onBackToOverview={() => setSelectedDocKey(null)}
                onClose={handleClosePanel}
                onManageVehicle={goEdit}
                onOpenChallanModal={() => setChallanModalOpen(true)}
              />
            </div>
          </div>

          {/* Full-Width Color-Coding Legend Spanning Bottom */}
          <div className="v-dash-legend-bar">
            <LegendDot color="#16a34a" label=">30 days" />
            <LegendDot color="#f59e0b" label="15-30 days" />
            <LegendDot color="#dc2626" label="<15 days or expired" />
            <LegendDot color="#94a3b8" label="Not uploaded / OCR pending" />
          </div>

          {/* Challan Modal */}
          <ChallanModal
            isOpen={challanModalOpen}
            onClose={() => setChallanModalOpen(false)}
            selectedVehicle={selectedVehicle}
          />
        </PageShell>
      </div>
    </div>
  );
};

export default VehicleDashboardPage;
