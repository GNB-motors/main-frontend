import useApi from '../../hooks/useApi';
import { formatDateTimeIST } from '../../utils/dateUtils';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import { kmLabel, messageOf, minutesLabel } from './placeIntelligenceModel';

/** Recent runs of one leg, each scored against the leg's own history. */
export default function LegDetail({ id }) {
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.getLeg(id, { signal }),
    [id],
  );
  if (loading && !data) return <PanelLoading rows={2} />;
  if (error)
    return <p className="pi-note">{messageOf(error, 'Could not load the runs on this leg')}</p>;
  const runs = (data?.traversals || []).slice(0, 15);
  if (!runs.length) return <p className="pi-note">No runs recorded yet.</p>;
  return (
    <ul className="pi-trav">
      {runs.map((t) => {
        const odd = (t.why || []).length > 0;
        return (
          <li key={`${t.tourId}-${t.departedAt}`}>
            <span className="pi-plate">{t.registrationNumber}</span>
            <span>{formatDateTimeIST(t.departedAt)}</span>
            <span>{minutesLabel(t.minutes)}</span>
            <span>{t.km != null ? kmLabel(t.km) : 'km not measured'}</span>
            <span className={odd ? 'is-odd' : 'is-ok'}>
              {odd ? t.why.join('; ') : 'Normal run'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
