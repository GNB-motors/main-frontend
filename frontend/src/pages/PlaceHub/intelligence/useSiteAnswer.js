import { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from '../../../hooks/useMutation';
import { useConfirm } from '../../../components/ui/confirmContext';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import {
  impactSummary,
  isImpactGate,
  messageOf,
  placeTitle,
  typeLabel,
} from './placeIntelligenceModel';

/**
 * A manager's answer about one place. Declaring a warehouse can re-anchor open
 * trips, so the backend refuses (409 + impact) until the manager has seen what
 * moves; the answer is then resent with confirmImpact. A confirmed place is
 * retyped, not re-accepted — except into WAREHOUSE, which the backend only
 * takes through accept (it creates the yard).
 */
export default function useSiteAnswer(onDone) {
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState(null);
  const acceptMutation = useMutation(PlaceIntelligenceService.accept);
  const rejectMutation = useMutation(PlaceIntelligenceService.reject);
  const retypeMutation = useMutation(PlaceIntelligenceService.retype);

  const acceptWithImpact = async (site, siteType, name) => {
    const body = { id: site._id, siteType, ...(name ? { name } : {}) };
    try {
      await acceptMutation.mutate(body);
      return true;
    } catch (err) {
      if (!isImpactGate(err)) throw err;
      const ok = await confirm({
        title: `Make ${name || placeTitle(site)} a warehouse?`,
        body: impactSummary(err.body.impact),
        consequence: 'Trips starting or ending here will anchor on this yard from now on.',
        confirmLabel: 'Make it a warehouse',
      });
      if (!ok) return false;
      await acceptMutation.mutate({ ...body, confirmImpact: true });
      return true;
    }
  };

  const accept = async (site, siteType, name) => {
    setBusyId(site._id);
    try {
      const retypeOnly = site.status === 'CONFIRMED' && siteType !== 'WAREHOUSE' && !name;
      const saved = retypeOnly
        ? await retypeMutation.mutate({ id: site._id, siteType }).then(() => true)
        : await acceptWithImpact(site, siteType, name);
      if (!saved) return;
      toast.success(`Saved: ${name || typeLabel(siteType)}`);
      onDone(site._id);
    } catch (err) {
      toast.error(messageOf(err, 'Could not save the answer'));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (site) => {
    setBusyId(site._id);
    try {
      await rejectMutation.mutate({ id: site._id });
      toast.success('Marked as not a place');
      onDone(site._id);
    } catch (err) {
      toast.error(messageOf(err, 'Could not save the answer'));
    } finally {
      setBusyId(null);
    }
  };

  return { accept, reject, busyId };
}
