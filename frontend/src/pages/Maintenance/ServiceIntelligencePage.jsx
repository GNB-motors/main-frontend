import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Paperclip, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { MaintenanceService } from './MaintenanceService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import AlertsTab from './Component/AlertsTab.jsx';
import '../Profile/VehiclesPage.css';

const TABS = [
  { key: 'SERVICE', label: 'Service' },
  { key: 'REPAIR', label: 'Repair' },
  { key: 'ALERTS', label: 'Alerts' },
];

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (n) => {
  if (n === null || n === undefined) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatKm = (n) =>
  n === null || n === undefined ? '—' : `${Number(n).toLocaleString('en-IN')} km`;

const ServiceIntelligencePage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  // Optional focusTab from location.state — set when navigating back from the
  // add-page so the user lands on the tab they just contributed to.
  const navState = typeof window !== 'undefined' ? (window.history.state?.usr || {}) : {};
  const [activeTab, setActiveTab] = useState(navState.focusTab || 'SERVICE');
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
      const token = localStorage.getItem('authToken');
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
    if (!window.confirm(`Delete this ${activeTab.toLowerCase()} entry? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('authToken');
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

  // KPI summary across the loaded set (current tab).
  const kpi = useMemo(() => {
    if (activeTab === 'ALERTS') return null;
    const total = rows.length;
    const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const last30 = rows.filter((r) => {
      const d = new Date(r.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    }).length;
    return { total, totalAmount, last30 };
  }, [rows, activeTab]);

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div className="vehicles-content-wrapper" style={{ paddingBottom: 48, alignItems: 'stretch' }}>
        {/* Header */}
        <div style={{ padding: '4px 24px 16px' }}>
          <button
            onClick={() => navigate('/vehicles')}
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
              marginBottom: 8,
            }}
          >
            <ArrowLeft size={14} />
            Vehicles
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
            Service Intelligence
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Manage vehicle service and repair history. Alerts will surface automatically once we wire the rules.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    setSearch('');
                    isFirstRenderRef.current = true; // re-fire immediate load
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? '#0f172a' : '#64748b',
                    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'ALERTS' ? (
          <AlertsTab />
        ) : (
          <RecordsTab
            activeTab={activeTab}
            rows={rows}
            loading={loading}
            kpi={kpi}
            search={search}
            setSearch={setSearch}
            onAdd={goToAdd}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

const RecordsTab = ({ activeTab, rows, loading, kpi, search, setSearch, onAdd, onDelete }) => {
  const isService = activeTab === 'SERVICE';
  const navigate = useNavigate();

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 24px 20px' }}>
        <Kpi title={`Total ${isService ? 'Services' : 'Repairs'}`} value={kpi.total} accent="#3b82f6" icon={<Wrench size={18} />} />
        <Kpi title="Last 30 days" value={kpi.last30} accent="#f59e0b" icon={<Wrench size={18} />} />
        <Kpi title="Total Spend" value={`₹${kpi.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} accent="#16a34a" icon={<Wrench size={18} />} />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px 12px',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 12px',
            minWidth: 280,
            flex: 1,
            maxWidth: 360,
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search workshop, ${isService ? 'service' : 'repair'} type, notes…`}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#0f172a',
              width: '100%',
              background: 'transparent',
            }}
          />
        </div>
        <button
          onClick={onAdd}
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
      </div>

      {/* Table */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={th}>Vehicle</th>
                  <th style={th}>{isService ? 'Service Date' : 'Repair Date'}</th>
                  {isService && <th style={th}>Current KM</th>}
                  <th style={th}>Workshop</th>
                  <th style={th}>{isService ? 'Service Type' : 'Repair Type'}</th>
                  <th style={th}>Amount</th>
                  <th style={th}>{isService ? 'Notes' : 'Issue'}</th>
                  <th style={th}>Files</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={`sk-${i}`} isService={isService} />
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={isService ? 9 : 8} style={emptyCell}>
                      No {isService ? 'service' : 'repair'} entries yet. Click "{isService ? 'Add Service' : 'Add Repair'}" to log one.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const veh = r.vehicleId && typeof r.vehicleId === 'object' ? r.vehicleId : null;
                  return (
                    <tr key={r._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        {veh ? (
                          <button
                            onClick={() =>
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
                              })
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: '#0f172a',
                              fontWeight: 700,
                              textAlign: 'left',
                            }}
                          >
                            {veh.registrationNumber}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                        {veh?.model && (
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{veh.model}</div>
                        )}
                      </td>
                      <td style={td}>{formatDate(r.date)}</td>
                      {isService && <td style={td}>{formatKm(r.currentKm)}</td>}
                      <td style={td}>{r.workshop}</td>
                      <td style={td}>{r.type}</td>
                      <td style={td}>{formatCurrency(r.amount)}</td>
                      <td style={{ ...td, maxWidth: 260, color: '#475569' }}>
                        {r.notes ? <span title={r.notes}>{r.notes.length > 60 ? `${r.notes.slice(0, 60)}…` : r.notes}</span> : '—'}
                      </td>
                      <td style={td}>
                        {Array.isArray(r.attachments) && r.attachments.length > 0 ? (
                          <a
                            href={r.attachments[0].publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              color: '#2563eb',
                              textDecoration: 'none',
                            }}
                          >
                            <Paperclip size={13} />
                            {r.attachments.length}
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <button
                          onClick={() => onDelete(r)}
                          title="Delete entry"
                          style={{
                            background: '#fff',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            borderRadius: 8,
                            padding: '6px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

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
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

const SkeletonRow = ({ isService }) => (
  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
    <td style={td}><span className="vd-skeleton" style={{ width: '70%' }} /></td>
    <td style={td}><span className="vd-skeleton" style={{ width: '60%' }} /></td>
    {isService && <td style={td}><span className="vd-skeleton" style={{ width: '50%' }} /></td>}
    <td style={td}><span className="vd-skeleton" style={{ width: '80%' }} /></td>
    <td style={td}><span className="vd-skeleton" style={{ width: '70%' }} /></td>
    <td style={td}><span className="vd-skeleton" style={{ width: '40%' }} /></td>
    <td style={td}><span className="vd-skeleton" style={{ width: '90%' }} /></td>
    <td style={td}><span className="vd-skeleton" style={{ width: '30%' }} /></td>
    <td style={{ ...td, textAlign: 'right' }}><span className="vd-skeleton vd-skeleton-btn" /></td>
  </tr>
);

const th = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
const td = { padding: '12px', color: '#1e293b', verticalAlign: 'middle' };
const emptyCell = { padding: 28, textAlign: 'center', color: '#94a3b8' };

export default ServiceIntelligencePage;
