import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import TripPlanService from '../../services/TripPlanService';
import { dropLabel } from '../PlaceIntelligence/facilityText';
import { fmtDayTime, fmtKm } from './autoTripModel';

const DAY_MS = 86400000;

/** Pick the trip that ran a plan, from the truck's trips no plan links to (±3 days). */
export default function LinkTripDialog({ plan, onOpenChange, onLinked }) {
  const open = Boolean(plan);
  const startMs = plan ? new Date(plan.plannedStartAt).getTime() : 0;
  const vehicleId = plan ? String(plan.vehicleId?._id || plan.vehicleId) : '';
  const { data, loading, error } = useApi(
    (signal) =>
      TripPlanService.unplannedTrips(
        {
          vehicleId,
          from: new Date(startMs - 3 * DAY_MS).toISOString(),
          to: new Date(Math.min(Date.now(), startMs + 3 * DAY_MS)).toISOString(),
        },
        { signal },
      ),
    [vehicleId, startMs],
    { enabled: open },
  );
  const linkM = useMutation(TripPlanService.link);
  const trips = data?.items ?? [];

  const link = async (trip) => {
    try {
      await linkM.mutate({ id: plan._id, autoTripId: trip._id });
      toast.success('Trip linked to the plan');
      onLinked?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || 'Could not link the trip');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Link the trip that ran this plan</DialogTitle>
          <DialogDescription>
            {plan?.registrationNumber}: trips within 3 days of the planned start that no plan has.
          </DialogDescription>
        </DialogHeader>
        {loading ? <div className="atx-state">Loading trips…</div> : null}
        {error ? <div className="atx-state">Could not load the trips.</div> : null}
        {!loading && !error && !trips.length ? (
          <div className="atx-state">No unlinked trips for this truck around that time.</div>
        ) : null}
        <ul className="atx-pick-list">
          {trips.map((t) => (
            <li key={t._id} className="atx-pick-row">
              <span>
                <strong>{fmtDayTime(t.pickup?.departedAt)}</strong> · {t.pickup?.name || '—'} →{' '}
                {dropLabel(t.drop)} · {t.km?.laden == null ? '—' : fmtKm(t.km.laden)}
              </span>
              <Button size="sm" onClick={() => link(t)} disabled={linkM.loading}>
                Link
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
