import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AutoTripService from '../../services/AutoTripService';
import PickSelect from './PickSelect';
import PlacePick from './PlacePick';
import useTripPickLists from './useTripPickLists';
import { EMPTY_MANUAL_TRIP, formReducer, manualTripBody, validateManualTrip } from './tripForms';

/**
 * Add a trip the GPS detection missed (a truck added late, a run that did not start
 * at a confirmed plant). The server builds it from the truck's GPS in the window;
 * ends left blank are the truck's first and last stop there.
 */
export default function ManualTripDialog({ open, onOpenChange, onAdded }) {
  const navigate = useNavigate();
  const [form, dispatch] = useReducer(formReducer, EMPTY_MANUAL_TRIP);
  const lists = useTripPickLists(open);
  const addM = useMutation(AutoTripService.addManual);
  const backfillM = useMutation(AutoTripService.backfill);
  const set = (field) => (value) => dispatch({ type: 'set', field, value });
  const setInput = (field) => (e) => set(field)(e.target.value);
  const busy = addM.loading || backfillM.loading;

  const close = () => {
    dispatch({ type: 'reset', initial: EMPTY_MANUAL_TRIP });
    onOpenChange(false);
  };

  const submit = async () => {
    const problem = validateManualTrip(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const trip = await addM.mutate(manualTripBody(form));
      toast.success('Trip added');
      onAdded?.();
      close();
      if (trip?._id) navigate(`/auto-trips/${trip._id}`);
    } catch (e) {
      toast.error(e?.message || 'Could not add the trip');
    }
  };

  const findPastTrips = async () => {
    if (!form.vehicleId) {
      toast.error('Pick the truck first.');
      return;
    }
    try {
      await backfillM.mutate({ vehicleId: form.vehicleId });
      toast.success(
        'Reading this truck’s last 30 days of GPS — its trips appear in a few minutes.',
      );
      close();
    } catch (e) {
      toast.error(e?.message || 'Could not start the search');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add a missed trip</DialogTitle>
          <DialogDescription>
            Pick the truck and when it ran. Distance, stops and fuel come from its GPS for that
            time. A truck added recently? Find its past trips instead.
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
          <span />
          <div className="atx-field">
            <label className="atx-field-label" htmlFor="mt-startAt">
              Started
            </label>
            <Input
              id="mt-startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={setInput('startAt')}
            />
          </div>
          <div className="atx-field">
            <label className="atx-field-label" htmlFor="mt-endAt">
              Ended
            </label>
            <Input
              id="mt-endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={setInput('endAt')}
            />
          </div>
          <PickSelect
            label="Loaded at"
            value={form.pickupSiteId}
            onChange={set('pickupSiteId')}
            options={lists.places}
            noneLabel="First GPS stop in that time"
          />
          <PlacePick
            label="Unloaded at"
            siteId={form.dropSiteId}
            onSite={set('dropSiteId')}
            name={form.dropName}
            onName={set('dropName')}
            places={lists.places}
            noneLabel="Last GPS stop"
          />
          <div className="atx-field">
            <label className="atx-field-label" htmlFor="mt-km">
              Distance, km (only if there is no GPS)
            </label>
            <Input id="mt-km" type="number" min="0" value={form.km} onChange={setInput('km')} />
          </div>
          <div className="atx-field atx-field--wide">
            <label className="atx-field-label" htmlFor="mt-note">
              Note (optional)
            </label>
            <Input id="mt-note" value={form.note} onChange={setInput('note')} maxLength={500} />
          </div>
        </div>

        <DialogFooter className="atx-form-footer">
          <Button variant="outline" size="sm" onClick={findPastTrips} disabled={busy}>
            {backfillM.loading ? 'Starting…' : 'Find this truck’s past trips'}
          </Button>
          <Button variant="outline" size="sm" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={busy}>
            {addM.loading ? 'Adding…' : 'Add trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
