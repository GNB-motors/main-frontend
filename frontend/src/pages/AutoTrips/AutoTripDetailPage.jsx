import { useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Check, X, HelpCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import AutoTripService from '../../services/AutoTripService';
import AutoTripMap from './AutoTripMap';
import AutoTripRouteStops from './AutoTripRouteStops';
import { FLAG_LABEL, DROP_SOURCE_LABEL, answerPlaceHref, stopLabel } from './autoTripModel';
import { dropLabel } from '../PlaceIntelligence/facilityText';

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

  // Where a dismissed trip's km go (contract: never dropped). Default UNATTRIBUTED.
  const [reallocateAs, setReallocateAs] = useState('UNATTRIBUTED');

  const act = useCallback(
    async (fn, payload, okMsg) => {
      try {
        const res = await fn(payload);
        toast.success(okMsg);
        // The structure-changing actions queue a background recompute (contract §1).
        if (res?.recompute?.queued) toast.info('Recalculating the affected trucks…');
        refetch();
      } catch (e) {
        const raw = `${e?.message || e?.detail || ''} ${e?.code || ''}`;
        toast.error(
          /NO_STOP_IN_TRIP/i.test(raw)
            ? 'That place has no stop inside this trip — pick a stop on the route below instead.'
            : e?.message || e?.detail || 'Action failed',
        );
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
  const answerHref = answerPlaceHref(trip);
  const summary = trip.stopsSummary;
  const plantColumns = [
    { key: 'startAt', label: 'Arrived', render: (s) => fmt(s.startAt) },
    { key: 'place', label: 'Where', render: (s) => stopLabel(s) },
    { key: 'dwell', label: 'Stayed', align: 'right', render: (s) => mins(s.dwellMinutes) },
    { key: 'purpose', label: 'Looks like', render: (s) => s.purpose?.top || '—' },
  ];
  const setDrop = (stop, markPlaceAsDrop) =>
    act(
      dropM.mutate,
      { id, stopId: stop._id, ...(markPlaceAsDrop ? { markPlaceAsDrop: true } : {}) },
      markPlaceAsDrop ? 'Drop set and place marked as a drop' : 'Drop updated',
    );

  return (
    <PageShell
      title={`${trip.registrationNumber || 'Trip'}`}
      subtitle={`${trip.pickup?.name || 'pickup'} → ${dropLabel(trip.drop)}`}
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
            <>
              <Select value={reallocateAs} onValueChange={setReallocateAs}>
                <SelectTrigger
                  className="h-9 w-[150px] text-sm"
                  title="Where this trip's km go when dismissed"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="UNATTRIBUTED">Unattributed</SelectItem>
                  <SelectItem value="REPOSITION">Reposition</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => act(dismissM.mutate, { id, reallocateAs }, 'Trip dismissed')}
              >
                <X size={16} /> Not a trip
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Badge variant={STATUS_VARIANT[trip.status] || 'outline'}>{trip.status}</Badge>
        {frozen ? <Badge variant="outline">Frozen</Badge> : null}
        {(trip.flags || []).map((f) => (
          <Badge key={f} variant="secondary">
            {FLAG_LABEL[f] || f}
          </Badge>
        ))}
        {answerHref && !frozen ? (
          <Link to={answerHref} style={{ marginLeft: 'auto', fontSize: 13 }}>
            <HelpCircle size={14} style={{ verticalAlign: 'middle' }} aria-hidden="true" /> Is this
            place a drop? Answer it on the Places page
          </Link>
        ) : null}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}
      >
        <div
          style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
        >
          <AutoTripMap
            pickup={trip.pickup}
            drop={trip.drop}
            extraDrops={trip.extraDrops}
            routeStops={trip.routeStops}
          />
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
            {dropLabel(trip.drop)}{' '}
            {trip.drop?.source ? (
              <span style={{ fontWeight: 400, color: '#888' }}>
                ({DROP_SOURCE_LABEL[trip.drop.source] || trip.drop.source})
              </span>
            ) : null}
          </Field>
          <Field label="Left pickup">{fmt(trip.pickup?.departedAt)}</Field>
          <Field label="Arrived drop">{fmt(trip.drop?.arrivedAt)}</Field>
          <Field label="Laden">{km(trip.km?.laden)}</Field>
          <Field label="Approach">{km(trip.km?.approach)}</Field>
          <Field label="Fuel detour">{km(trip.km?.fuelDetour)}</Field>
          <Field label="Transit">{mins(trip.durations?.transitMin)}</Field>
          <Field label="Empty before pickup">{mins(trip.durations?.approachMin)}</Field>
          <Field label="At the plant">{mins(trip.durations?.plantMin)}</Field>
          {trip.extraDrops?.length ? (
            <Field label="Further drops">{trip.extraDrops.length}</Field>
          ) : null}
          {summary ? (
            <Field label="Stops on the way">
              {summary.fuel} fuel · {summary.rest} rest · {summary.overnight} overnight ·{' '}
              {summary.unexplained} unexplained
            </Field>
          ) : null}
          {trip.erpTripId ? (
            <Field label="ERP trip">
              <Link to={`/erp/trips/${trip.erpTripId}`}>{String(trip.erpTripId).slice(-6)}</Link>
            </Field>
          ) : null}
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>
        Stops after leaving the plant
      </h2>
      <AutoTripRouteStops trip={trip} frozen={frozen} busy={busy} onSetDrop={setDrop} />

      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>At the plant</h2>
      <DataTable
        columns={plantColumns}
        rows={trip.stops || []}
        rowKey={(s) => s._id}
        emptyTitle="No stops linked"
        emptyHint="This trip's pickup visit has no stored stop ids."
      />
    </PageShell>
  );
}
