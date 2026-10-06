import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Check, X, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageShell from '../../components/ui/PageShell';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import ExcursionService from '../../services/ExcursionService';

const STATUS_VARIANT = {
  DEVIATION: 'destructive',
  APPROVED: 'default',
  APPROVED_LATE: 'secondary',
  NOT_DEVIATION: 'outline',
};
const PURPOSES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DRIVER_HOME', label: 'Driver home' },
  { value: 'PERSONAL_ERRAND', label: 'Personal errand' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'OTHER', label: 'Other' },
];

function fmt(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
}
const km = (v) => (v == null ? '—' : `${Math.round(v)} km`);
const litres = (v) => (v == null ? '—' : `${Number(v).toFixed(1)} L`);

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: 'var(--muted-foreground, #777)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{children}</span>
    </div>
  );
}

export default function ExcursionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState('MAINTENANCE');
  const [note, setNote] = useState('');

  const {
    data: ex,
    loading,
    error,
    refetch,
  } = useApi((signal) => ExcursionService.get(id, { signal }), [id]);

  const classifyM = useMutation(ExcursionService.classify);
  const approveM = useMutation(ExcursionService.approveLate);
  const dismissM = useMutation(ExcursionService.notADeviation);
  const busy = classifyM.loading || approveM.loading || dismissM.loading;

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

  if (loading && !ex) {
    return (
      <PageShell title="Deviation">
        <div style={{ padding: 24, color: '#777' }}>Loading…</div>
      </PageShell>
    );
  }
  if (error || !ex) {
    return (
      <PageShell title="Deviation">
        <div style={{ padding: 24 }}>
          <p>Could not load this deviation.</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      </PageShell>
    );
  }

  const isOpen = ex.status === 'DEVIATION';

  return (
    <PageShell
      title={ex.registrationNumber || 'Deviation'}
      subtitle={`${fmt(ex.openedAt)} → ${ex.closedAt ? fmt(ex.closedAt) : 'open'}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/auto-trips/excursions')}>
          <ArrowLeft size={16} /> Deviations
        </Button>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Badge variant={STATUS_VARIANT[ex.status] || 'outline'}>{ex.status}</Badge>
        {ex.loadState ? <Badge variant="outline">{ex.loadState}</Badge> : null}
        {ex.purpose ? <Badge variant="secondary">{ex.purpose}</Badge> : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        <Field label="Total km">{km(ex.km?.total)}</Field>
        <Field label="Direct km">{km(ex.km?.direct)}</Field>
        <Field label="Extra km">{km(ex.km?.extra)}</Field>
        <Field label="Charged (excess)">{km(ex.km?.excess)}</Field>
        <Field label="Approved km">{km(ex.km?.approvedExtra)}</Field>
        <Field label="Fuel total">{litres(ex.fuel?.totalL)}</Field>
        <Field label="Fuel extra">{litres(ex.fuel?.excessL)}</Field>
        <Field label="Dwell">{ex.dwellMin != null ? `${Math.round(ex.dwellMin)} min` : '—'}</Field>
      </div>

      {Array.isArray(ex.visits) && ex.visits.length ? (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>Where it stopped</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ex.visits.map((v, i) => (
              <div
                key={v.visitId || i}
                style={{ display: 'flex', gap: 10, fontSize: 13, color: '#444' }}
              >
                <Badge variant="outline">{v.placeKind || '—'}</Badge>
                <span>{v.name || '—'}</span>
                <span style={{ color: '#888' }}>
                  {fmt(v.arrivedAt)} · {v.dwellMin != null ? `${Math.round(v.dwellMin)} min` : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {isOpen ? (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>Review</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-9 w-[180px] text-sm" aria-label="Purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Note (optional)"
              aria-label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: 240 }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                act(classifyM.mutate, { id, purpose, ...(note ? { note } : {}) }, 'Classified')
              }
            >
              <Tag size={16} /> Classify
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                act(approveM.mutate, { id, ...(note ? { note } : {}) }, 'Approved (late)')
              }
            >
              <Check size={16} /> Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                act(dismissM.mutate, { id, ...(note ? { note } : {}) }, 'Marked not a deviation')
              }
            >
              <X size={16} /> Not a deviation
            </Button>
          </div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            Classify records the reason (and may watch the place) without clearing the charge.
            Approve or Not-a-deviation settle it.
          </p>
        </>
      ) : null}

      {Array.isArray(ex.statusHistory) && ex.statusHistory.length ? (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 10px' }}>History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ex.statusHistory.map((h, i) => (
              <div key={i} style={{ fontSize: 13, color: '#555' }}>
                <strong>{h.status}</strong> · {fmt(h.at)}
                {h.note ? ` · ${h.note}` : ''}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
