import NamePlaceDialog from '../../components/places/NamePlaceDialog';
import { useConfirm } from '../../components/ui/confirmContext';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { impactSummary, isImpactGate } from '../PlaceHub/intelligence/model/requestOutcome.js';

export default function IdentifyJourneyPlaceDialog({ stop, registrationNumber, onClose, onSaved }) {
  const confirm = useConfirm();
  const save = async ({ name, type }) => {
    const identify = stop.stopId
      ? PlaceIntelligenceService.identifyStopPlace
      : PlaceIntelligenceService.identifyTrackPointPlace;
    const body = {
      ...(stop.stopId ? { id: stop.stopId } : { registrationNumber, at: stop.fixAt }),
      name,
      siteType: type,
    };
    let result;
    try {
      result = await identify(body);
    } catch (failure) {
      if (!isImpactGate(failure)) throw failure;
      const approved = await confirm({
        title: 'Confirm this warehouse?',
        body: impactSummary(failure.body.impact),
        confirmLabel: 'Confirm warehouse',
      });
      if (!approved) return false;
      result = await identify({ ...body, confirmImpact: true });
    }
    onSaved(result);
  };
  return (
    <NamePlaceDialog
      title="Identify this place"
      description="Name this recorded location and choose its type. Saving updates the journey without changing your replay range."
      onSave={save}
      onClose={onClose}
    />
  );
}
