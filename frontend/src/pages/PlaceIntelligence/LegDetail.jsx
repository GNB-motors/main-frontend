import useApi from '../../hooks/useApi';
import { formatDateTimeIST } from '../../utils/dateUtils';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import { messageOf, minutesLabel } from './placeIntelligenceModel';

/** Recent traversals of one leg, each scored against the leg's own history. */
export default function LegDetail({ id }) {
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.getLeg(id, { signal }),
    [id],
  );
  if (loading && !data) return <PanelLoading rows={3} />;
  if (error)
    return (
      <div className="p-3 text-xs text-rose-700">{messageOf(error, 'Could not load this leg')}</div>
    );
  return (
    <ul className="space-y-1 p-3 text-xs">
      {(data?.traversals || []).slice(0, 15).map((t) => (
        <li key={`${t.tourId}-${t.departedAt}`} className="flex flex-wrap gap-3">
          <span className="font-mono font-bold">{t.registrationNumber}</span>
          <span>{formatDateTimeIST(t.departedAt)}</span>
          <span>{minutesLabel(t.minutes)}</span>
          <span>{t.km != null ? `${t.km} km` : 'km unknown'}</span>
          <span className={(t.why || []).length ? 'text-amber-800' : 'text-emerald-700'}>
            {(t.why || []).length ? t.why.join('; ') : 'typical for this leg'}
          </span>
        </li>
      ))}
    </ul>
  );
}
