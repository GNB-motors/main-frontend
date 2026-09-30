import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  FileText,
  Filter,
} from 'lucide-react';
import { VehicleService } from './VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import { getToken } from '../../utils/session.js';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import {
  computeVehicleDashboardKpis,
  DOC_COLS,
  bucketFor,
  EXPIRED_FILTER_PILLS,
} from './vehicleDashboardLogic';
import { StatCard, LegendDot } from './vehicleDashboardCells';
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
      const token = getToken();
      const data = await VehicleService.getFleetDashboard(token, q || undefined);
      if (myId !== requestIdRef.current) return;
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load vehicle dashboard');
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
          title="Documents And Challans"
          subtitle="Fleet-wide document compliance and live expiry tracking. Badges update automatically."
          actions={
            /* WheelsEye Pay Challan Box in top right header */
            <div
              className="v-dash-pay-banner"
              role="button"
              tabIndex={0}
              onClick={() => setChallanModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setChallanModalOpen(true);
              }}
              title="Open Parivahan / ULIP live challan check"
            >
              <div className="v-dash-emblem-badge">
                <ShieldCheck size={20} color="#16a34a" />
              </div>
              <div className="v-dash-pay-banner-info">
                <span className="v-dash-pay-banner-title">Directly pay Your Challan</span>
                <span className="v-dash-pay-banner-sub">MoRTH Parivahan / ULIP Gateway</span>
              </div>
              <button
                type="button"
                className="v-dash-pay-banner-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setChallanModalOpen(true);
                }}
              >
                Pay / Check
              </button>
            </div>
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
          <div className="v-dash-filter-dropdown-bar" aria-label="Document compliance filters">
            <div className="v-dash-dropdown-wrapper">
              <label htmlFor="v-dash-doc-filter" className="v-dash-filter-label">
                <FileText size={15} color="#2563eb" />
                <span>Document Filter:</span>
              </label>
              <select
                id="v-dash-doc-filter"
                className="v-dash-filter-select"
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
              >
                <option value="ALL">All Documents (No Filter) — ({rows.length} vehicles)</option>
                <optgroup label="⚡ Quick Status Filters">
                  <option value="EXPIRING_SOON">
                    ⚠️ Expiring Soon (&lt; 30 Days) — (
                    {filterOptionsWithCounts.anyExpiringSoonCount})
                  </option>
                  <option value="EXPIRED_ANY">
                    🔴 Any Expired Document — ({filterOptionsWithCounts.anyExpiredCount})
                  </option>
                  <option value="MISSING_ANY">
                    ⚪ Missing Documents — ({filterOptionsWithCounts.anyMissingCount})
                  </option>
                </optgroup>
                <optgroup label="⚠️ Expiring Soon by Document (< 30 Days)">
                  {DOC_COLS.map(({ key, label }) => (
                    <option key={`soon-${key}`} value={`SOON_${key}`}>
                      Expiring Soon: {label} — ({filterOptionsWithCounts.soonByDoc[key] || 0})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🔴 Expired by Document">
                  {DOC_COLS.map(({ key, label }) => (
                    <option key={`exp-${key}`} value={`EXPIRED_${key}`}>
                      Expired: {label} — ({filterOptionsWithCounts.expiredByDoc[key] || 0})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {docFilter !== 'ALL' && (
              <button
                type="button"
                className="v-dash-filter-reset-btn"
                onClick={() => setDocFilter('ALL')}
              >
                Showing {displayRows.length} of {rows.length} &middot; Clear Filter &times;
              </button>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '14px 0 20px 0' }}>
            <StatCard
              title="Total Vehicles"
              value={kpis.total}
              subtext={`${kpis.totalDocSlots} document slots`}
              accent="#3b82f6"
              icon={<Truck size={20} />}
            />
            <StatCard
              title="Expired / Critical"
              value={kpis.expired + kpis.critical}
              subtext={`${kpis.expired} expired · ${kpis.critical} < 15d`}
              accent="#dc2626"
              icon={<AlertTriangle size={20} />}
            />
            <StatCard
              title="Expiring 15-30 days"
              value={kpis.warning}
              subtext="Plan renewals soon"
              accent="#f59e0b"
              icon={<Clock size={20} />}
            />
            <StatCard
              title="Healthy"
              value={kpis.healthy}
              subtext={`${kpis.missing} not uploaded yet`}
              accent="#16a34a"
              icon={<CheckCircle2 size={20} />}
            />
          </div>

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
