import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { approvalWindow, approvalValidity, approvalPlace } from './movementApprovalDisplay';
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
const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—';

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
      { key: 'place', label: 'Place', render: (r) => approvalPlace(r) },
      { key: 'when', label: 'When', render: (r) => approvalWindow(r) },
      {
        key: 'purpose',
        label: 'Purpose / allowance',
        render: (r) => (
          <div>
            <div>{r.purpose || r.note || 'Purpose not recorded'}</div>
            <small>
              {r.caps?.maxExtraKm != null
                ? `Up to ${r.caps.maxExtraKm} extra km`
                : 'No extra-km cap'}{' '}
              ·{' '}
              {r.caps?.maxDwellMin != null
                ? `Up to ${r.caps.maxDwellMin} min dwell`
                : 'No dwell cap'}
            </small>
          </div>
        ),
      },
      { key: 'approver', label: 'Approved by', render: (r) => r.approvedByName || 'Not recorded' },
      {
        key: 'kind',
        label: 'Kind',
        render: (r) =>
          r.excursionId ? (
            <Link to={`/auto-trips/excursions/${r.excursionId}`}>{r.kind} · Open excursion</Link>
          ) : (
            r.kind || '—'
          ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <Badge variant={approvalValidity(r) === 'ACTIVE' ? 'default' : 'outline'}>
            {approvalValidity(r).replaceAll('_', ' ')}
          </Badge>
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
