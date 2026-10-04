import { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Check, X, MapPin } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import AutoTripService from '../../services/AutoTripService';
import AutoTripMap from './AutoTripMap';

const STATUS_VARIANT = {
  COMPLETE: 'default',
  CONFIRMED: 'default',
  NEEDS_REVIEW: 'secondary',
  OPEN: 'outline',
  DISMISSED: 'destructive',
};

function fmt(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
}
const km = (v) => (v == null ? '—' : `${Math.round(v)} km`);
const mins = (v) => (v == null ? '—' : `${Math.round(v)} min`);

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: 'var(--muted-foreground, #777)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{children}</span>
    </div>
  );
}

export default function AutoTripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: trip,
    loading,
    error,
    refetch,
  } = useApi((signal) => AutoTripService.get(id, { signal }), [id]);

  const confirmM = useMutation(AutoTripService.confirm);
  const dropM = useMutation(AutoTripService.drop);
  const dismissM = useMutation(AutoTripService.dismiss);
  const busy = confirmM.loading || dropM.loading || dismissM.loading;

  const act = useCallback(
    async (fn, payload, okMsg) => {
      try {
        await fn(payload);
        toast.success(okMsg);
        refetch();
      } catch (e) {
        toast.error(e?.message || 'Action failed');
      }
    },
    [refetch],
  );

  if (loading && !trip) {
    return (
      <PageShell title="Auto Trip">
        <div style={{ padding: 24, color: '#777' }}>Loading…</div>
      </PageShell>
    );
  }
  if (error || !trip) {
    return (
      <PageShell title="Auto Trip">
        <div style={{ padding: 24 }}>
          <p>Could not load this trip.</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      </PageShell>
    );
  }

  const frozen = Boolean(trip.frozenAt);
  const stopColumns = [
    { key: 'startAt', label: 'Arrived', render: (s) => fmt(s.startAt) },
    { key: 'dwell', label: 'Dwell', align: 'right', render: (s) => mins(s.dwellMinutes) },
    { key: 'purpose', label: 'Purpose', render: (s) => s.purpose?.top || '—' },
    {
      key: 'action',
      label: '',
      align: 'right',
      render: (s) =>
        frozen ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              act(dropM.mutate, { id, stopId: s._id }, 'Drop updated');
            }}
          >
            <MapPin size={14} /> Set as drop
          </Button>
        ),
    },
  ];

  return (
    <PageShell
      title={`${trip.registrationNumber || 'Trip'}`}
      subtitle={`${trip.pickup?.name || 'pickup'} → ${trip.drop?.name || trip.drop?.source || 'drop'}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/auto-trips')}>
            <ArrowLeft size={16} /> Back
          </Button>
          {!frozen && trip.status !== 'CONFIRMED' ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => act(confirmM.mutate, { id }, 'Trip confirmed')}
            >
              <Check size={16} /> Confirm
            </Button>
          ) : null}
          {!frozen && trip.status !== 'DISMISSED' ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => act(dismissM.mutate, { id }, 'Trip dismissed')}
            >
              <X size={16} /> Not a trip
            </Button>
          ) : null}
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Badge variant={STATUS_VARIANT[trip.status] || 'outline'}>{trip.status}</Badge>
        {frozen ? <Badge variant="outline">Frozen</Badge> : null}
        {(trip.flags || []).map((f) => (
          <Badge key={f} variant="secondary">
            {f}
          </Badge>
        ))}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}
      >
        <div
          style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
        >
          <AutoTripMap pickup={trip.pickup} drop={trip.drop} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            alignContent: 'start',
          }}
        >
          <Field label="Pickup">{trip.pickup?.name || '—'}</Field>
          <Field label="Drop">
            {trip.drop?.name || '—'}{' '}
            {trip.drop?.source ? (
              <span style={{ fontWeight: 400, color: '#888' }}>({trip.drop.source})</span>
            ) : null}
          </Field>
          <Field label="Left pickup">{fmt(trip.pickup?.departedAt)}</Field>
          <Field label="Arrived drop">{fmt(trip.drop?.arrivedAt)}</Field>
          <Field label="Laden">{km(trip.km?.laden)}</Field>
          <Field label="Approach">{km(trip.km?.approach)}</Field>
          <Field label="Fuel detour">{km(trip.km?.fuelDetour)}</Field>
          <Field label="Transit">{mins(trip.durations?.transitMin)}</Field>
          {trip.erpTripId ? (
            <Field label="ERP trip">
              <Link to={`/erp/trips/${trip.erpTripId}`}>{String(trip.erpTripId).slice(-6)}</Link>
            </Field>
          ) : null}
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>Pickup stops</h2>
      <DataTable
        columns={stopColumns}
        rows={trip.stops || []}
        rowKey={(s) => s._id}
        emptyTitle="No stops linked"
        emptyHint="This trip's pickup visit has no stored stop ids."
      />
    </PageShell>
  );
}
