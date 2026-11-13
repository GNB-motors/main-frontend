import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import '../AutoTrips/TripsWorkspace.css';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { getVehicleList } from '../../services/vehicleListService';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import MovementApprovalService from '../../services/MovementApprovalService';
import ApprovalCreateDialog from '../AutoTrips/ApprovalCreateDialog';
import { AutoTripsService } from '../AutoTrips/AutoTripsService';

const PAGE_SIZE = 50;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function whenLabel(a) {
  if (a.window?.from) return `${fmtDate(a.window.from)} → ${fmtDate(a.window.to)}`;
  if (a.recurrence?.weekdays?.length) {
    const days = a.recurrence.weekdays.map((d) => WEEKDAYS[d] || d).join(' ');
    const h = `${a.recurrence.fromHour}:00–${a.recurrence.toHour}:00`;
    return `${days} · ${h}`;
  }
  return '—';
}

function placeLabel(a) {
  const ps = a.placeSpec || {};
  if (ps.kind === 'TYPE') return `Type: ${ps.type || '—'}`;
  if (ps.kind === 'SITE' || ps.kind === 'REGION')
    return `${ps.kind.toLowerCase()} ${String(ps.id || '').slice(-6)}`;
  return ps.kind || '—';
}

export default function TripApprovals() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);

  const { data: refs } = useApi(
    (signal) =>
      Promise.all([
        getVehicleList({ signal }),
        AutoTripsService.listEmployees({ limit: 500 }, { signal }).catch(() => null),
      ]),
    [],
  );
  useEffect(() => {
    if (!refs) return;
    const [vlist, empList] = refs;
    setVehicleOptions(
      vlist
        .map((v) => ({
          id: String(v._id || v.id),
          label: v.registrationNumber || v.vehicleNumber || '—',
        }))
        .filter((v) => v.id && v.id !== 'undefined'),
    );
    const elist = empList || [];
    setDriverOptions(
      (elist || [])
        .filter((d) => !d.role || d.role === 'DRIVER')
        .map((d) => ({
          id: String(d._id || d.id),
          label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Driver',
        }))
        .filter((d) => d.id && d.id !== 'undefined'),
    );
  }, [refs]);

  const vehById = useMemo(
    () => new Map(vehicleOptions.map((v) => [v.id, v.label])),
    [vehicleOptions],
  );
  const drvById = useMemo(
    () => new Map(driverOptions.map((d) => [d.id, d.label])),
    [driverOptions],
  );

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(status ? { status } : {}) }),
    [page, status],
  );
  const { data, loading, error, refetch } = useApi(
    (signal) => MovementApprovalService.list(params, { signal }),
    [JSON.stringify(params)],
  );
  const revokeM = useMutation(MovementApprovalService.revoke);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subjectLabel = (a) => {
    const vid = a.vehicleId && (a.vehicleId._id || a.vehicleId);
    const did = a.driverId && (a.driverId._id || a.driverId);
    const parts = [];
    if (vid) parts.push(vehById.get(String(vid)) || `veh ${String(vid).slice(-6)}`);
    if (did) parts.push(drvById.get(String(did)) || `driver ${String(did).slice(-6)}`);
    return parts.join(' · ') || '—';
  };

  const revoke = async (id) => {
    try {
      await revokeM.mutate({ id });
      toast.success('Approval revoked');
      refetch();
    } catch (e) {
      toast.error(e?.message || 'Could not revoke');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'createdAt', label: 'Created', render: (r) => fmtDate(r.createdAt) },
      { key: 'subject', label: 'Vehicle / driver', render: (r) => subjectLabel(r) },
      { key: 'place', label: 'Place', render: (r) => placeLabel(r) },
      { key: 'when', label: 'When', render: (r) => whenLabel(r) },
      { key: 'kind', label: 'Kind', render: (r) => r.kind || '—' },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <Badge variant={r.status === 'ACTIVE' ? 'default' : 'outline'}>{r.status}</Badge>
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (r) =>
          r.status === 'ACTIVE' ? (
            <button
              type="button"
              className="ra-btn ra-btn--reject"
              disabled={revokeM.loading}
              onClick={(e) => {
                e.stopPropagation();
                revoke(r._id);
              }}
            >
              Revoke
            </button>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehById, drvById, revokeM.loading],
  );

  return (
    <div className="apv-section">
      <div className="ra-toolbar">
        <div className="ra-tabs" role="tablist" aria-label="Trip approval status">
          {[
            { key: '', label: 'All' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'REVOKED', label: 'Revoked' },
          ].map((t) => (
            <button
              key={t.key || 'all'}
              type="button"
              role="tab"
              className={`ra-tab ${status === t.key ? 'is-active' : ''}`}
              aria-selected={status === t.key}
              onClick={() => {
                setStatus(t.key);
                setPage(1);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ra-btn apv-trip-create"
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={16} /> New trip approval
        </button>
      </div>
      <p className="apv-trip-hint">
        Authorise a vehicle or driver to visit a place, so an agreed stop is not treated as an
        unapproved detour.
      </p>

      <DataTable
        columns={columns}
        rows={items}
        total={total}
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={totalPages}
            totalItems={total || null}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        }
        rowKey={(r) => r._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle="No trip approvals"
        emptyHint="Create one to pre-authorise a known detour (a workshop, a driver's home, a regular stop)."
      />

      <ApprovalCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicleOptions={vehicleOptions}
        driverOptions={driverOptions}
        onCreated={() => {
          setDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
