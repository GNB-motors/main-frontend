import { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from '../../hooks/useMutation';
import { useConfirm } from '../../components/ui/confirmContext';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import { impactSummary, isImpactGate, messageOf, typeLabel } from './placeIntelligenceModel';

/**
 * A manager's answer about one place. Declaring a warehouse can re-anchor open
 * trips, so the backend refuses (409 + impact) until the manager has seen what
 * moves; the answer is then resent with confirmImpact.
 */
export default function useSiteAnswer(onDone) {
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState(null);
  const acceptMutation = useMutation(PlaceIntelligenceService.accept);
  const rejectMutation = useMutation(PlaceIntelligenceService.reject);

  const accept = async (site, siteType) => {
    setBusyId(site._id);
    try {
      try {
        await acceptMutation.mutate({ id: site._id, siteType });
      } catch (err) {
        if (!isImpactGate(err)) throw err;
        const ok = await confirm({
          title: `Declare ${site.name || 'this place'} a warehouse?`,
          body: impactSummary(err.body.impact),
          consequence: 'Trips starting or ending here will anchor on this yard from now on.',
          confirmLabel: 'Declare warehouse',
        });
        if (!ok) return;
        await acceptMutation.mutate({ id: site._id, siteType, confirmImpact: true });
      }
      toast.success(`Saved as ${typeLabel(siteType)}`);
      onDone();
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
      onDone();
    } catch (err) {
      toast.error(messageOf(err, 'Could not reject'));
    } finally {
      setBusyId(null);
    }
  };

  return { accept, reject, busyId };
}
