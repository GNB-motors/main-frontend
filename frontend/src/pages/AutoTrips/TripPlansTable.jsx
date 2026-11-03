import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/ui/DataTable';
import { useMutation } from '../../hooks/useMutation';
import { useConfirm } from '../../components/ui/confirmContext';
import TripPlanService from '../../services/TripPlanService';
import { fmtDayTime, fmtKm } from './autoTripFormat';
import { PLAN_STATUS_CLASS, PLAN_STATUS_LABEL, planEndName, planWarnings } from './tripForms';
import LinkTripDialog from './LinkTripDialog';
import { erpPlanTracking } from './erpPlanTracking';

export default function TripPlansTable({ data, loading, error, refetch, pagination }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState(null);
  const cancelM = useMutation(TripPlanService.cancel);
  const unlinkM = useMutation(TripPlanService.unlink);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const act = async (mutation, payload, question, okMsg) => {
    if (!(await confirm({ title: question, confirmLabel: 'Yes' }))) return;
    try {
      await mutation.mutate(payload);
      toast.success(okMsg);
      refetch();
    } catch (e) {
      toast.error(e?.message || 'Action failed');
    }
  };

  const columns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (p) => (
        <>
          <span className="atx-plate">{p.registrationNumber || '—'}</span>
          {p.source === 'ERP' ? (
            <Link
              className="atx-chip"
              to={`/erp/trips/${p.erpTripId}`}
              onClick={(e) => e.stopPropagation()}
            >
              ERP · {p.erpTripNumber}
            </Link>
          ) : null}
        </>
      ),
    },
    {
      key: 'route',
      label: 'Planned route',
      render: (p) => `${planEndName(p.pickup)} → ${planEndName(p.drop)}`,
    },
    { key: 'planned', label: 'Planned / ERP start', render: (p) => fmtDayTime(p.plannedStartAt) },
    {
      key: 'actual',
      label: 'Actual',
      render: (p) =>
        p.actual?.startedAt ? (
          <>
            {fmtDayTime(p.actual.startedAt)}
            {p.actual.dropName ? ` → ${p.actual.dropName}` : ''}
            {p.actual.km != null ? ` · ${fmtKm(p.actual.km)}` : ''}
          </>
        ) : (
          <span className="atx-muted">
            {p.source === 'ERP' ? 'GPS evidence pending' : 'not started'}
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <>
          <span className={`atx-status ${PLAN_STATUS_CLASS[p.status] || 'atx-status--open'}`}>
            {PLAN_STATUS_LABEL[p.status] || p.status}
          </span>
          {p.source === 'ERP' ? <span className="atx-muted">{erpPlanTracking(p)}</span> : null}
          {planWarnings(p).map((w) => (
            <span key={w} className="atx-chip atx-chip--warn">
              {w}
            </span>
          ))}
        </>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <span className="atx-row-actions">
          {p.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ kind: 'link', plan: p });
              }}
            >
              {p.autoTripId ? 'Change trip' : 'Link trip'}
            </button>
          ) : null}
          {p.autoTripId && p.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              disabled={unlinkM.loading}
              onClick={(e) => {
                e.stopPropagation();
                act(unlinkM, { id: p._id }, 'Take the trip off this plan?', 'Trip unlinked');
              }}
            >
              Unlink
            </button>
          ) : null}
          {p.source !== 'ERP' && (p.status === 'PLANNED' || p.status === 'IN_PROGRESS') ? (
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              disabled={cancelM.loading}
              onClick={(e) => {
                e.stopPropagation();
                act(cancelM, { id: p._id }, 'Cancel this plan?', 'Plan cancelled');
              }}
            >
              Cancel
            </button>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(p) => p._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={items.length}
        total={total}
        pagination={pagination}
        paginated={true}
        onRowClick={(p) => (p.autoTripId ? navigate(`/auto-trips/${p.autoTripId}`) : null)}
        emptyTitle="No planned trips here"
        emptyHint="Schedule a trip and it is matched to the truck’s GPS trip when it runs."
      />
      <LinkTripDialog
        plan={dialog?.kind === 'link' ? dialog.plan : null}
        onOpenChange={(o) => (o ? null : setDialog(null))}
        onLinked={refetch}
      />
    </>
  );
}
