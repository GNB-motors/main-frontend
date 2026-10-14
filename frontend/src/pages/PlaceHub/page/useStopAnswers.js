import { useState } from 'react';
import { toast } from 'react-toastify';
import PlaceHubService from '../PlaceHubService.js';
import { PURPOSE_LABEL } from '../intelligence/model/siteVocabulary.js';
import errorText from './errorText.js';

export default function useStopAnswers({ loadStops, loadPlaces }) {
  const [stopsBusy, setStopsBusy] = useState(false);
  const answerStops = async (stops, purpose) => {
    setStopsBusy(true);
    try {
      // One at a time, so a failure part-way says which stops were saved.
      for (const st of stops) await PlaceHubService.tagStop(st._id, purpose);
      // A purpose without a label must not turn a saved answer into an error.
      const label = (PURPOSE_LABEL[purpose] || purpose).toLowerCase();
      toast.success(`${stops.length === 1 ? 'Stop' : `${stops.length} stops`} marked as ${label}`);
      await loadStops();
      loadPlaces();
    } catch (err) {
      toast.error(errorText(err, 'Could not save the answer'));
      loadStops();
    } finally {
      setStopsBusy(false);
    }
  };

  return { stopsBusy, answerStops };
}
