import { useReducer } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useMutation } from '../../hooks/useMutation';
import TripPlanService from '../../services/TripPlanService';
import PickSelect from './PickSelect';
import PlacePick from './PlacePick';
import useTripPickLists from './useTripPickLists';
import { EMPTY_PLAN, formReducer, planBody, validatePlan } from './tripForms';

/**
 * Schedule a trip. It is matched to the GPS-detected trip once the truck runs it,
 * and then shows planned vs actual.
 */
export default function TripPlanDialog({ open, onOpenChange, onCreated }) {
  const [form, dispatch] = useReducer(formReducer, EMPTY_PLAN);
  const lists = useTripPickLists(open);
  const createM = useMutation(TripPlanService.create);
  const set = (field) => (value) => dispatch({ type: 'set', field, value });
  const setInput = (field) => (e) => set(field)(e.target.value);

  const close = () => {
    dispatch({ type: 'reset', initial: EMPTY_PLAN });
    onOpenChange(false);
  };

  const submit = async () => {
    const problem = validatePlan(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      await createM.mutate(planBody(form));
      toast.success('Trip scheduled');
      onCreated?.();
      close();
    } catch (e) {
      toast.error(e?.message || 'Could not schedule the trip');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Schedule a trip</DialogTitle>
          <DialogDescription>
            When the truck leaves for it, the trip from its GPS is linked here, so you see the plan
            against what happened.
          </DialogDescription>
        </DialogHeader>

        <div className="atx-form-grid">
          <PickSelect
            label="Truck"
            value={form.vehicleId}
            onChange={set('vehicleId')}
            options={lists.vehicles}
            noneLabel={lists.loading ? 'Loading…' : 'Pick the truck'}
          />
          <PickSelect
            label="Driver (optional)"
            value={form.driverId}
            onChange={set('driverId')}
            options={lists.drivers}
            noneLabel="No driver yet"
          />
          <PlacePick
            label="Loads at"
            siteId={form.pickupSiteId}
            onSite={set('pickupSiteId')}
            name={form.pickupName}
            onName={set('pickupName')}
            places={lists.places}
            noneLabel="Pick a saved place"
          />
          <PlacePick
            label="Drops at"
            siteId={form.dropSiteId}
            onSite={set('dropSiteId')}
            name={form.dropName}
            onName={set('dropName')}
            places={lists.places}
            noneLabel="Pick a saved place"
          />
          <div className="atx-field">
            <label className="atx-field-label" htmlFor="tp-plannedStartAt">
              Planned start
            </label>
            <Input
              id="tp-plannedStartAt"
              type="datetime-local"
              value={form.plannedStartAt}
              onChange={setInput('plannedStartAt')}
            />
          </div>
          <div className="atx-field">
            <label className="atx-field-label" htmlFor="tp-plannedEndAt">
              Planned arrival (optional)
            </label>
            <Input
              id="tp-plannedEndAt"
              type="datetime-local"
              value={form.plannedEndAt}
              onChange={setInput('plannedEndAt')}
            />
          </div>
          <div className="atx-field atx-field--wide">
            <label className="atx-field-label" htmlFor="tp-note">
              Note (optional)
            </label>
            <Input id="tp-note" value={form.note} onChange={setInput('note')} maxLength={500} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={close} disabled={createM.loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={createM.loading}>
            {createM.loading ? 'Scheduling…' : 'Schedule trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
