import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import MovementApprovalService from '../../services/MovementApprovalService';
import ApprovalCreateDialog from './ApprovalCreateDialog';

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

export default function MovementApprovalsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);

  const { data: refs } = useApi(
    (signal) =>
      Promise.all([
        apiClient.get('/api/vehicles', { params: { limit: 500 }, signal }),
        apiClient.get('/api/employees', { params: { limit: 500 }, signal }).catch(() => null),
      ]),
    [],
  );
  useEffect(() => {
    if (!refs) return;
    const [vehRes, empRes] = refs;
    const vlist = vehRes?.data?.data || vehRes?.data || [];
    setVehicleOptions(
      vlist
        .map((v) => ({
          id: String(v._id || v.id),
          label: v.registrationNumber || v.vehicleNumber || '—',
        }))
        .filter((v) => v.id && v.id !== 'undefined'),
    );
    const elist = Array.isArray(empRes?.data?.data) ? empRes.data.data : empRes?.data || [];
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
            <Button
              variant="outline"
              size="sm"
              disabled={revokeM.loading}
              onClick={(e) => {
                e.stopPropagation();
                revoke(r._id);
              }}
            >
              Revoke
            </Button>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehById, drvById, revokeM.loading],
  );

  return (
    <PageShell
      title="Movement Approvals"
      count={total}
      subtitle="Pre-authorise a vehicle or driver to visit a place, so a detour there is not charged as a deviation."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/auto-trips')}>
            <ArrowLeft size={16} /> Trips
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={16} /> New approval
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { key: '', label: 'All' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'REVOKED', label: 'Revoked' },
        ].map((t) => (
          <Button
            key={t.key || 'all'}
            type="button"
            size="sm"
            variant={status === t.key ? 'default' : 'outline'}
            onClick={() => {
              setStatus(t.key);
              setPage(1);
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle="No approvals yet"
        emptyHint="Create one to pre-authorise a known detour (a workshop, a driver's home, a regular stop)."
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 12,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--muted-foreground, #666)' }}>
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={16} /> Prev
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>

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
    </PageShell>
  );
}
