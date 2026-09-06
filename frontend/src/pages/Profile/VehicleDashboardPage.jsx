import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Truck } from 'lucide-react';
import { VehicleService } from './VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import NewButton from '@/components/ui/NewButton';
import { getToken } from '../../utils/session.js';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import { computeVehicleDashboardKpis } from './vehicleDashboardLogic';
import { StatCard, LegendDot } from './vehicleDashboardCells';
import { buildVehicleDashboardColumns } from './vehicleDashboardColumns';
import './VehiclesPage.css';

const VehicleDashboardPage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Track in-flight request so a stale fetch can't overwrite a fresher one
  // (e.g. user types fast and an earlier response comes back after a later one).
  const requestIdRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const load = useCallback(async (q) => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const token = getToken();
      const data = await VehicleService.getFleetDashboard(token, q || undefined);
      if (myId !== requestIdRef.current) return; // a newer request superseded us
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load vehicle dashboard');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Single effect: fire immediately on first mount, debounce search changes
  // (so the duplicate "load on mount + load 300ms later" double-fetch is gone).
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      load('');
      return undefined;
    }
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const kpis = useMemo(() => computeVehicleDashboardKpis(rows), [rows]);

  const goEdit = (row) =>
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
    });

  const columns = buildVehicleDashboardColumns({ onManage: goEdit });

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div
        className="vehicles-content-wrapper"
        style={{ paddingBottom: 48, alignItems: 'stretch' }}
      >
        <PageShell
          title="Vehicle Dashboard"
          subtitle="Fleet-wide document expiry status. Badges update automatically based on each document's expiry date."
          actions={
            <NewButton
              variant="link"
              size="xs"
              text="Vehicles"
              prependIcon={<ArrowLeft size={14} />}
              prependGap={6}
              onClick={() => navigate('/vehicles')}
            />
          }
          filters={
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search registration or chassis number"
              right={
                loading && rows.length > 0 ? (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Updating…</span>
                ) : null
              }
            />
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
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

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row._id}
            loading={loading}
            emptyTitle="No vehicles found"
            emptyAction={
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
            }
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 16,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <LegendDot color="#16a34a" label=">30 days" />
            <LegendDot color="#f59e0b" label="15-30 days" />
            <LegendDot color="#dc2626" label="<15 days or expired" />
            <LegendDot color="#94a3b8" label="Not uploaded / OCR pending" />
          </div>
        </PageShell>
      </div>
    </div>
  );
};

export default VehicleDashboardPage;
